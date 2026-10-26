import 'server-only';
import { Prisma, PrismaClient } from '@prisma/client';
import { hashUserPassword } from './user-auth';
import { getPlatformHost, buildTenantHostname } from './domain-config';
import { HubError, CATALOG, commandSchemas, fingerprint, requestDigest, type HubCommand } from './hub-contract';
import { effectiveFeatureSet, effectivePlanFeatures, HUB_MODULES, syncInheritedFeatures } from './hub-features';
import { period } from './hub-contract';

const tenantInclude = {
  domains: { orderBy: { hostname: 'asc' as const } },
  subscription: { include: { plan: true, payments: { orderBy: { createdAt: 'desc' as const }, take: 100 } } },
  features: { orderBy: { featureKey: 'asc' as const } },
  memberships: { orderBy: { id: 'asc' as const }, include: { user: { select: { id: true, name: true, email: true, updatedAt: true, isSuperAdmin: true } } } },
  _count: { select: { vehiculos: true, ventas: true, clientes: true, locations: true, memberships: true, fotos: true } },
} satisfies Prisma.TenantInclude;
type TenantRow = Prisma.TenantGetPayload<{ include: typeof tenantInclude }>;
type PlanRow = Prisma.PlanGetPayload<Record<string, never>>;
type Tx = Prisma.TransactionClient;
const DAY = 86400000;
function fail(code: string, message: string, status = 422): never { throw new HubError(status, code, message); }
function planModules(features: Prisma.JsonValue) { const values = new Set(Array.isArray(features) ? features : []); return Object.fromEntries(HUB_MODULES.map(k => [k, values.has(k)])); }
function planVersion(p: PlanRow) { return fingerprint(p); }
function shapePlan(p: PlanRow) {
  const modules = planModules(p.features);
  // Legacy seller/print access had no platform gate. Preserve that effective
  // availability in the first Hub form, rather than silently disabling it.
  if (!p.hubManaged) { modules.seller_pwa = true; modules.branding_documentos = true; }
  return { id: p.id, code: p.code, name: p.name, description: p.description || '', priceCents: Math.round(p.priceMonthly * 100), currency: 'USD', active: p.isActive, version: planVersion(p), modules, limits: { maxVehicles: p.maxVehicles, maxLocations: p.maxLocations, maxUsers: p.maxUsers }, preservedFeatures: Array.isArray(p.features) ? p.features.filter(k => typeof k === 'string' && !(HUB_MODULES as readonly string[]).includes(k)) : [] };
}
function access(t: TenantRow, now = new Date()) {
  const s = t.subscription;
  if (!s) return { enabled: false, reason: 'Sin suscripción.' };
  if (!['ACTIVE', 'TRIAL'].includes(t.status) || !['ACTIVE', 'TRIAL'].includes(s.status)) return { enabled: false, reason: 'Tenant o suscripción suspendidos, vencidos o cancelados.' };
  const end = s.status === 'TRIAL' && s.trialEndsAt ? s.trialEndsAt : s.currentPeriodEnd;
  if (end <= now) return { enabled: false, reason: 'El período está vencido; esta consulta no cambia su estado.' };
  return { enabled: true, reason: null };
}
function shapeTenant(t: TenantRow) {
  const s = t.subscription, enabled = effectiveFeatureSet(effectivePlanFeatures(s?.plan.features, !!s?.plan.hubManaged), t.features), a = access(t);
  const raw = t.status === 'CANCELLED' ? 'CANCELED' : t.status;
  const status = raw === 'ACTIVE' || raw === 'TRIAL' ? a.enabled ? raw : s && (s.currentPeriodEnd <= new Date() || (s.status === 'TRIAL' && s.trialEndsAt && s.trialEndsAt <= new Date())) ? 'PAST_DUE' : 'SUSPENDED' : raw;
  return {
    id: t.id, name: t.name, slug: t.slug, status, rawStatus: t.status,
    version: fingerprint({ tenant: { id: t.id, name: t.name, updatedAt: t.updatedAt, status: t.status }, subscription: s ? { ...s, payments: s.payments.map(p => ({ id: p.id, updatedAt: p.updatedAt })) } : null, features: t.features, memberships: t.memberships, domains: t.domains, access: a }),
    access: a, contact: { email: t.email, phone: t.phone, address: t.address, city: t.city, cuit: t.cuit },
    domains: t.domains.map(d => ({ id: d.id, hostname: d.hostname, primary: d.isPrimary, custom: d.isCustom, verified: !d.isCustom || !!d.verifiedAt })),
    plan: s ? shapePlan(s.plan) : null,
    subscription: s ? { id: s.id, planId: s.planId, status: s.status, start: s.currentPeriodStart.toISOString(), end: s.currentPeriodEnd.toISOString(), trialEndsAt: s.trialEndsAt?.toISOString() || null, provider: 'manual' } : null,
    modules: Object.fromEntries(HUB_MODULES.map(key => { const row = t.features.find(f => f.featureKey === key), managed = !!s?.plan.hubManaged || !!row?.hubManaged; return [key, { enabled: key !== 'pwa_clientes' && !managed ? true : enabled.has(key), override: row && !row.hubInherit ? row.isEnabled : null, managed }]; })),
    admins: t.memberships.filter(m => ['OWNER', 'MANAGER'].includes(m.role) && !m.user.isSuperAdmin).map(m => ({ id: m.userId, name: m.user.name || '', email: m.user.email, role: m.role, active: m.isActive })),
    usage: { vehicles: t._count.vehiculos, sales: t._count.ventas, clients: t._count.clientes, users: t._count.memberships, locations: t._count.locations, photos: t._count.fotos },
    payments: s?.payments.map(p => ({ id: p.id, amountCents: Math.round(p.amount * 100), currency: p.currency, method: p.method || '', reference: p.reference, notes: p.notes, status: p.status, start: p.periodStart.toISOString(), end: p.periodEnd.toISOString(), createdAt: p.createdAt.toISOString(), paidAt: p.paidAt?.toISOString() || null })) || [],
  };
}
async function tenant(tx: Tx, tenantId: string, expected?: string) {
  if (expected) await tx.$queryRaw`SELECT id FROM Tenant WHERE id=${tenantId} FOR UPDATE`;
  const t = await tx.tenant.findUnique({ where: { id: tenantId }, include: tenantInclude });
  if (!t) fail('NOT_FOUND', 'La empresa no existe.', 404);
  if (expected && shapeTenant(t).version !== expected) fail('STALE_VERSION', 'Los datos cambiaron. Actualizá antes de guardar.', 409);
  return t;
}
async function assignablePlan(tx: Tx, planId: string, existingId?: string) {
  const p = await tx.plan.findUnique({ where: { id: planId } });
  if (!p || (!p.isActive && p.id !== existingId)) fail('PLAN', 'El plan no está disponible para nuevas asignaciones.');
  return p;
}
async function admin(tx: Tx, t: TenantRow, userId: string) {
  const m = t.memberships.find(m => m.userId === userId && ['OWNER', 'MANAGER'].includes(m.role));
  if (!m || m.user.isSuperAdmin) fail('ADMIN', 'Administrador fuera de esta empresa.', 403);
  const memberships = await tx.tenantMembership.count({ where: { userId } });
  if (memberships !== 1) fail('SHARED_ACCOUNT', 'La cuenta es compartida. Gestionarla aquí afectaría otra empresa.', 409);
  return m;
}
const RESERVED = new Set(['onlycars', 'onlyfood', 'onlygym', 'onlyturn', 'onlypadel', 'onlyerp', 'onlymob', 'hub', 'www', 'api', 'admin', 'proxy', 'portainer', 'nanocontrol', 'nanomonitor']);
function hostnameAllowed(hostname: string) { if (hostname === getPlatformHost() || RESERVED.has(hostname.split('.')[0])) fail('RESERVED_SLUG', 'El dominio o identificador está reservado.'); }
function jsonResult(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }

export function createHubManagement(db: PrismaClient) {
  async function read(query: URLSearchParams) {
    const resource = query.get('resource') || 'catalog', offsetText = query.get('offset') || '0';
    if (!/^\d{1,6}$/.test(offsetText)) fail('INVALID_INPUT', 'Paginación inválida.');
    const offset = Number(offsetText), take = 50;
    if (resource === 'catalog') return CATALOG;
    if (resource === 'plans') { const rows = await db.plan.findMany({ orderBy: { id: 'asc' }, skip: offset, take: take + 1 }); return { items: rows.slice(0, take).map(shapePlan), nextOffset: rows.length > take ? offset + take : null }; }
    if (resource === 'tenant') { const id = query.get('tenantId'); if (!id || id.length > 191) fail('INVALID_INPUT', 'Empresa requerida.'); return shapeTenant(await tenant(db, id)); }
    if (resource === 'audit') {
      const tenantId = query.get('tenantId') || undefined;
      const rows = await db.platformAuditLog.findMany({ where: tenantId ? { tenantId } : {}, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: offset, take: take + 1, include: { user: { select: { email: true } } } });
      return { items: rows.slice(0, take).map(r => { const d = r.details && typeof r.details === 'object' && !Array.isArray(r.details) ? r.details : {}; return { id: r.id, tenantId: r.tenantId, actor: typeof d.actor === 'string' ? d.actor : r.user?.email || null, action: typeof d.operation === 'string' ? d.operation : r.action, entity: r.resource, entityId: typeof d.entityId === 'string' ? d.entityId : null, result: 'success', createdAt: r.createdAt.toISOString() }; }), nextOffset: rows.length > take ? offset + take : null };
    }
    fail('INVALID_INPUT', 'Recurso de administración desconocido.');
  }
  async function readTenants(offset: number) {
    const rows = await db.tenant.findMany({ orderBy: { id: 'asc' }, skip: offset, take: 101, include: tenantInclude });
    return { tenants: rows.slice(0, 100).map(t => { const value = shapeTenant(t); return { id: t.id, slug: t.slug, name: t.name, status: value.status === 'PAST_DUE' ? 'SUSPENDED' : value.status, rawStatus: t.status, createdAt: t.createdAt.toISOString(), plan: t.subscription?.plan.name || null, planExpiresAt: t.subscription?.currentPeriodEnd.toISOString() || null, modules: Object.fromEntries(HUB_MODULES.map(k => [k, value.modules[k].enabled])), metrics: { available: true, totalRecords: t._count.vehiculos, recordLabel: 'Vehículos' } }; }), nextOffset: rows.length > 100 ? offset + 100 : null };
  }
  async function perform(tx: Tx, cmd: HubCommand): Promise<Record<string, string>> {
    switch (cmd.operation) {
      case 'tenant.create': {
        const i = commandSchemas['tenant.create'].parse(cmd.input);
        if (RESERVED.has(i.slug)) fail('RESERVED_SLUG', 'Identificador reservado.');
        const hostname = buildTenantHostname(i.slug); hostnameAllowed(hostname);
        const p = await assignablePlan(tx, i.planId), dates = period(i.start, i.end, i.status, i.status === 'TRIAL' ? i.end : null);
        if (await tx.user.findUnique({ where: { email: i.ownerEmail } })) fail('SHARED_ACCOUNT', 'Ese correo ya pertenece a una cuenta. No se reutiliza ni cambia su acceso.', 409);
        const t = await tx.tenant.create({ data: { name: i.name, slug: i.slug, email: i.ownerEmail, status: i.status } });
        await tx.subscription.create({ data: { tenantId: t.id, planId: p.id, status: i.status, currentPeriodStart: dates.start, currentPeriodEnd: dates.end, trialEndsAt: dates.trial } });
        await tx.tenantDomain.create({ data: { tenantId: t.id, hostname, isPrimary: true, isCustom: false } });
        const location = await tx.location.create({ data: { tenantId: t.id, name: 'Casa Central', code: 'central', isMain: true, isActive: true } });
        await tx.tenantSettings.create({ data: { tenantId: t.id, appName: i.name, razonSocial: i.name, emailContacto: i.ownerEmail } });
        const u = await tx.user.create({ data: { name: i.ownerName, email: i.ownerEmail, passwordHash: await hashUserPassword(i.password), isSuperAdmin: false } });
        await tx.tenantMembership.create({ data: { tenantId: t.id, userId: u.id, role: 'OWNER', locationId: location.id, isActive: true } });
        return { tenantId: t.id };
      }
      case 'tenant.update': {
        const i = commandSchemas['tenant.update'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version);
        if (i.slug !== t.slug) fail('RESERVED_SLUG', 'El identificador existente se conserva. Los dominios se administran por separado.');
        await tx.tenant.update({ where: { id: t.id }, data: { name: i.name, ...(i.email !== undefined ? { email: i.email } : {}), ...(i.phone !== undefined ? { phone: i.phone } : {}), ...(i.address !== undefined ? { address: i.address } : {}), ...(i.city !== undefined ? { city: i.city } : {}), ...(i.cuit !== undefined ? { cuit: i.cuit } : {}) } });
        return { tenantId: t.id };
      }
      case 'tenant.status': {
        const i = commandSchemas['tenant.status'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version), s = t.subscription;
        if (!s) fail('SUBSCRIPTION', 'La empresa no tiene suscripción.');
        period(s.currentPeriodStart.toISOString(), s.currentPeriodEnd.toISOString(), i.status, s.trialEndsAt?.toISOString());
        await tx.tenant.update({ where: { id: t.id }, data: { status: i.status } });
        await tx.subscription.update({ where: { id: s.id }, data: { status: i.status } });
        return { tenantId: t.id };
      }
      case 'subscription.update': {
        const i = commandSchemas['subscription.update'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version);
        const p = await assignablePlan(tx, i.planId, t.subscription?.planId), d = period(i.start, i.end, i.status, i.trialEndsAt);
        await tx.subscription.upsert({ where: { tenantId: t.id }, update: { planId: p.id, status: i.status, currentPeriodStart: d.start, currentPeriodEnd: d.end, trialEndsAt: i.status === 'TRIAL' ? d.trial : null }, create: { tenantId: t.id, planId: p.id, status: i.status, currentPeriodStart: d.start, currentPeriodEnd: d.end, trialEndsAt: i.status === 'TRIAL' ? d.trial : null } });
        await tx.tenant.update({ where: { id: t.id }, data: { status: i.status } });
        await syncInheritedFeatures(tx, [t.id], p.features, p.hubManaged); return { tenantId: t.id };
      }
      case 'subscription.renew': {
        const i = commandSchemas['subscription.renew'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version), s = t.subscription;
        if (!s) fail('SUBSCRIPTION', 'Asigná un plan antes de renovar.');
        const now = new Date(), anchor = new Date(Math.max(+now, +s.currentPeriodEnd));
        await tx.subscription.update({ where: { id: s.id }, data: { status: 'ACTIVE', trialEndsAt: null, currentPeriodStart: s.currentPeriodEnd > now ? s.currentPeriodStart : now, currentPeriodEnd: new Date(+anchor + i.days * DAY) } });
        await tx.tenant.update({ where: { id: t.id }, data: { status: 'ACTIVE' } }); return { tenantId: t.id };
      }
      case 'module.set': {
        const i = commandSchemas['module.set'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version), fromPlan = !!t.subscription && effectivePlanFeatures(t.subscription.plan.features, t.subscription.plan.hubManaged).includes(i.key);
        const values = { isEnabled: i.enabled ?? fromPlan, hubManaged: true, hubInherit: i.enabled === null };
        await tx.tenantFeature.upsert({ where: { tenantId_featureKey: { tenantId: t.id, featureKey: i.key } }, update: values, create: { tenantId: t.id, featureKey: i.key, ...values } });
        return { tenantId: t.id };
      }
      case 'admin.update': {
        const i = commandSchemas['admin.update'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version); await admin(tx, t, i.userId);
        await tx.user.update({ where: { id: i.userId }, data: { name: i.name, email: i.email, ...(i.password ? { passwordHash: await hashUserPassword(i.password) } : {}) } });
        await tx.userSession.deleteMany({ where: { userId: i.userId } }); return { tenantId: t.id };
      }
      case 'admin.revoke': {
        const i = commandSchemas['admin.revoke'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version); await admin(tx, t, i.userId);
        await tx.userSession.deleteMany({ where: { userId: i.userId } }); return { tenantId: t.id };
      }
      case 'plan.create': {
        const i = commandSchemas['plan.create'].parse(cmd.input), features = HUB_MODULES.filter(k => i.modules[k]);
        const p = await tx.plan.create({ data: { code: i.code, name: i.name, description: i.description, priceMonthly: i.priceCents / 100, isActive: i.active, features, ...i.limits, hubManaged: true } });
        return { planId: p.id };
      }
      case 'plan.update': {
        const i = commandSchemas['plan.update'].parse(cmd.input);
        await tx.$queryRaw`SELECT id FROM Plan WHERE id=${i.planId} FOR UPDATE`;
        const p = await tx.plan.findUnique({ where: { id: i.planId } }); if (!p) fail('NOT_FOUND', 'El plan no existe.', 404);
        if (planVersion(p) !== i.version) fail('STALE_VERSION', 'El plan cambió. Actualizá antes de guardar.', 409);
        const historical = Array.isArray(p.features) ? p.features.filter((k): k is string => typeof k === 'string' && !(HUB_MODULES as readonly string[]).includes(k)) : [];
        const features = [...historical, ...HUB_MODULES.filter(k => i.modules[k])];
        await tx.plan.update({ where: { id: p.id }, data: { name: i.name, description: i.description, priceMonthly: i.priceCents / 100, isActive: i.active, features, ...i.limits, hubManaged: true } });
        const subscribers = await tx.subscription.findMany({ where: { planId: p.id }, select: { tenantId: true } });
        await syncInheritedFeatures(tx, subscribers.map(s => s.tenantId), features); return { planId: p.id };
      }
      case 'payment.record': {
        const i = commandSchemas['payment.record'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version), s = t.subscription;
        if (!s) fail('SUBSCRIPTION', 'La empresa no tiene suscripción.');
        const dates = period(i.start, i.end), paidAt = i.paidAt ? new Date(i.paidAt) : new Date();
        if (paidAt > new Date(Date.now() + 300000)) fail('INVALID_INPUT', 'La fecha de pago no puede estar en el futuro.');
        if (await tx.saaSPayment.findFirst({ where: { reference: i.reference } })) fail('PAYMENT_DUPLICATE', 'La referencia de pago ya fue registrada.', 409);
        const plan = await assignablePlan(tx, i.planId || s.planId, s.planId);
        const p = await tx.saaSPayment.create({ data: { tenantId: t.id, subscriptionId: s.id, amount: i.amountCents / 100, currency: i.currency, status: 'PAID', method: i.method, reference: i.reference, notes: i.notes, paidAt, periodStart: dates.start, periodEnd: dates.end } });
        const current = dates.start <= new Date() && dates.end > new Date();
        if (current) {
          await tx.subscription.update({ where: { id: s.id }, data: { planId: plan.id, status: 'ACTIVE', trialEndsAt: null, currentPeriodStart: dates.start, currentPeriodEnd: dates.end } });
          await tx.tenant.update({ where: { id: t.id }, data: { status: 'ACTIVE' } });
          await syncInheritedFeatures(tx, [t.id], plan.features, plan.hubManaged);
        }
        return { tenantId: t.id, paymentId: p.id, subscriptionUpdated: current ? 'true' : 'false' };
      }
      case 'domain.add': {
        const i = commandSchemas['domain.add'].parse(cmd.input), t = await tenant(tx, i.tenantId, i.version); hostnameAllowed(i.hostname);
        if (!i.custom && i.hostname !== buildTenantHostname(t.slug)) fail('INVALID_INPUT', 'El dominio estándar debe corresponder al identificador existente.');
        if (await tx.tenantDomain.findUnique({ where: { hostname: i.hostname } })) fail('CONFLICT', 'El dominio ya está registrado.', 409);
        if (i.primary) await tx.tenantDomain.updateMany({ where: { tenantId: t.id }, data: { isPrimary: false } });
        const d = await tx.tenantDomain.create({ data: { tenantId: t.id, hostname: i.hostname, isCustom: i.custom, isPrimary: i.primary, verifiedAt: i.custom ? new Date() : null } });
        return { tenantId: t.id, domainId: d.id };
      }
    }
  }
  async function command(cmd: HubCommand, key: string) {
    // Keyed digest prevents a receipt from becoming an offline password oracle.
    const hash = requestDigest(cmd, key), receiptId = 'hub-command:' + cmd.requestId;
    const replay = async () => {
      const row = await db.platformAuditLog.findUnique({ where: { id: receiptId } });
      if (!row) return null;
      const d = row.details as { hash?: string; result?: Record<string, string> } | null;
      if (d?.hash !== hash || !d.result) fail('IDEMPOTENCY_CONFLICT', 'Identificador ya utilizado para otra solicitud.', 409);
      return d.result;
    };
    const old = await replay(); if (old) return old;
    commandSchemas[cmd.operation].parse(cmd.input);
    try {
      return await db.$transaction(async tx => {
        // Unique insert serializes duplicate requests and rolls back with every mutation.
        await tx.platformAuditLog.create({ data: { id: receiptId, action: 'HUB_COMMAND', resource: 'NanoLabsHub', details: { hash, actor: cmd.actor, operation: cmd.operation } } });
        const result = await perform(tx, cmd);
        await tx.platformAuditLog.update({ where: { id: receiptId }, data: { tenantId: result.tenantId || null, details: jsonResult({ hash, actor: cmd.actor, operation: cmd.operation, entityId: result.tenantId || result.planId || null, result }) } });
        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 20000 });
    } catch (e) {
      // MariaDB can report a competing receipt insert as connector error 1020
      // (PrismaClientUnknownRequestError). A committed receipt proves that the
      // identical command completed atomically, regardless of the losing error.
      // Never repeat mutations here or weaken Serializable isolation.
      const result = await replay(); if (result) return result;
      if (e instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(e.code)) { fail('CONFLICT', 'Los datos cambiaron o el identificador ya existe. Actualizá antes de reintentar.', 409); }
      throw e;
    }
  }
  return { read, readTenants, command };
}
