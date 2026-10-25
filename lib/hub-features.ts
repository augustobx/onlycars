import type { Prisma } from '@prisma/client';

export const HUB_MODULES = ['pwa_clientes', 'seller_pwa', 'branding_documentos'] as const;
type Feature = { featureKey: string; isEnabled: boolean; hubManaged?: boolean; hubInherit?: boolean };
export function effectivePlanFeatures(planFeatures: unknown, managed: boolean): string[] {
  const values = Array.isArray(planFeatures) ? planFeatures.filter((k): k is string => typeof k === 'string') : [];
  return managed ? values : [...new Set([...values, 'seller_pwa', 'branding_documentos'])];
}
export function effectiveFeatureSet(planFeatures: unknown, features: Feature[]): Set<string> {
  const result = new Set<string>(Array.isArray(planFeatures) ? planFeatures.filter((k): k is string => typeof k === 'string') : []);
  for (const f of features) {
    if (f.hubInherit) continue;
    if (f.isEnabled) result.add(f.featureKey); else result.delete(f.featureKey);
  }
  return result;
}
export async function syncInheritedFeatures(tx: Prisma.TransactionClient, tenantIds: string[], planFeatures: unknown, managed = true) {
  if (!tenantIds.length) return;
  const included = new Set(effectivePlanFeatures(planFeatures, managed));
  for (const featureKey of HUB_MODULES) await tx.tenantFeature.updateMany({
    where: { tenantId: { in: tenantIds }, featureKey, hubInherit: true },
    data: { isEnabled: included.has(featureKey) },
  });
}
export function assertFeatureConfigurationAllowed(feature: Feature | null, planManaged: boolean, enabled: boolean) {
  if ((planManaged || feature?.hubManaged) && !enabled) throw new Error('El módulo está deshabilitado desde la plataforma. Su configuración se conserva.');
}
export function managedModuleEnabled(tenant: { managedModules?: Record<string, boolean>; features: Set<string> }, key: string): boolean {
  return !tenant.managedModules?.[key] || tenant.features.has(key);
}
export function assertManagedModuleEnabled(tenant: { managedModules?: Record<string, boolean>; features: Set<string> }, key: string) {
  if (!managedModuleEnabled(tenant, key)) throw new Error('El módulo está deshabilitado desde la plataforma.');
}
