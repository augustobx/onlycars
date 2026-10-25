import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { getPalette } from '@/components/theme/palettes';
import Link from 'next/link';
import {
  Car,
  FileText,
  HandCoins,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  ChevronRight,
  LogOut,
  Clock,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export const dynamic = 'force-dynamic';

export default async function PortalHomePage() {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);

  const featureRecord = await db.tenantFeature.findUnique({
    where: {
      tenantId_featureKey: {
        tenantId: tenant.id,
        featureKey: CLIENT_PWA_FEATURE_KEY,
      },
    },
  });
  const config = normalizeClientPwaConfig(featureRecord?.config);
  const palette = getPalette(tenant.settings?.paletteId);
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  // Obtener estadísticas si está logueado
  let cuotasPendientesCount = 0;
  let prestamosActivosCount = 0;
  let solicitudesPendientesCount = 0;

  if (currentCliente) {
    const [cuotas, prestamos, solicitudes] = await Promise.all([
      db.ventaCuota.count({
        where: {
          tenantId: tenant.id,
          venta: { id_cliente: currentCliente.id_cliente },
          estado: 'PENDIENTE',
        },
      }),
      db.prestamo.count({
        where: {
          tenantId: tenant.id,
          id_cliente: currentCliente.id_cliente,
          estado: 'ACTIVO',
        },
      }),
      db.solicitudPrestamo.count({
        where: {
          tenantId: tenant.id,
          id_cliente: currentCliente.id_cliente,
          estado: { in: ['PENDIENTE', 'EN_REVISION'] },
        },
      }),
    ]);
    cuotasPendientesCount = cuotas;
    prestamosActivosCount = prestamos;
    solicitudesPendientesCount = solicitudes;
  }

  // Obtener 3 autos destacados para preview
  const destacadosDb = await db.vehiculo.findMany({
    where: {
      tenantId: tenant.id,
      publicadoWeb: true,
      estado: { in: ['LISTO_PARA_VENTA', 'EN_CONSIGNACION'] },
    },
    take: 3,
    orderBy: { fecha_ingreso: 'desc' },
    include: {
      fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }], take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      {/* Saludo y Estado Principal */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: palette.primary }}
        />

        {currentCliente ? (
          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p
                  className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: palette.primary }}
                >
                  <ShieldCheck className="w-4 h-4" /> Cliente Verificado
                </p>
                <h1 className="text-2xl font-black text-white mt-1">
                  ¡Hola, {currentCliente.nombre_completo}!
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">DNI: {currentCliente.dni || 'Sin registrar'}</p>
              </div>

              <form action="/api/portal/logout" method="POST" className="self-start sm:self-auto">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/30 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </form>
            </div>

            {/* Resumen rápido de métricas */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm">
                <p className="text-xl font-black text-white font-mono">{cuotasPendientesCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Cuotas pend.</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm">
                <p className="text-xl font-black font-mono" style={{ color: palette.primary }}>
                  {prestamosActivosCount}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Préstamos</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm">
                <p className="text-xl font-black text-indigo-400 font-mono">{solicitudesPendientesCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">En trámite</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative z-10 max-w-2xl">
            <span
              className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit"
              style={{
                borderColor: `${palette.primary}40`,
                backgroundColor: `${palette.primary}15`,
                color: palette.primary,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Portal Oficial de Clientes
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Bienvenido a <span style={{ color: palette.primary }}>{tenant.name}</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {config.mensajeBienvenida}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/portal/login"
                className="py-2.5 px-5 rounded-xl text-white text-xs font-black text-center shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
                style={{
                  background: palette.gradient,
                  boxShadow: `0 4px 14px ${palette.glow}`,
                }}
              >
                Ingresar con DNI <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {config.habilitarCatalogo && (
                <Link
                  href="/portal/catalogo"
                  className="py-2.5 px-5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white text-xs font-bold text-center border border-slate-700 transition"
                >
                  Ver Catálogo de Autos
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Servicios Disponibles (Grid Responsivo) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Servicios Disponibles
          </h2>
          <span className="text-[11px] text-slate-500 font-semibold">Acceso rápido</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {config.habilitarCatalogo && (
            <Link
              href="/portal/catalogo"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition shadow-sm">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-blue-300 transition">
                    Catálogo de Autos
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Stock disponible y entrega inmediata</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
            </Link>
          )}

          {config.habilitarPlanCuotas && (
            <Link
              href="/portal/cuotas"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition shadow-sm"
                  style={{
                    backgroundColor: `${palette.primary}15`,
                    borderColor: `${palette.primary}30`,
                    color: palette.primary,
                  }}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-slate-200 transition">
                    Mis Planes de Cuotas
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cuotas al día, saldos y comprobantes</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
            </Link>
          )}

          {config.habilitarPrestamos && (
            <Link
              href="/portal/prestamos"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition shadow-sm">
                  <HandCoins className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-amber-300 transition">
                    Préstamos de Dinero
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Capital otorgado y saldo a devolver</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
            </Link>
          )}

          {config.habilitarSolicitudPrestamos && (
            <Link
              href="/portal/prestamos/solicitar"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border transition-all duration-200 group shadow-md"
              style={{
                borderColor: `${palette.primary}35`,
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition shadow-sm"
                  style={{
                    backgroundColor: `${palette.primary}20`,
                    borderColor: `${palette.primary}40`,
                    color: palette.primary,
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Solicitar Préstamo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Simulador online y validación rápida</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition" style={{ color: palette.primary }} />
            </Link>
          )}

          {config.habilitarSolicitudPrestamos && (
            <Link
              href="/portal/prestamos/validaciones"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-indigo-300 transition">
                    Validación de Solicitudes
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Estado de tus trámites en curso</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </section>

      {/* Preview de Unidades Destacadas (Grid Responsivo) */}
      {config.habilitarCatalogo && destacadosDb.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Unidades Destacadas
            </h2>
            <Link
              href="/portal/catalogo"
              className="text-xs font-black hover:underline flex items-center gap-1 transition"
              style={{ color: palette.primary }}
            >
              <span>Ver todas ({destacadosDb.length}+)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {destacadosDb.map((v) => {
              const foto = v.fotos[0]?.url_foto;
              return (
                <Link
                  key={v.id_vehiculo}
                  href={`/portal/catalogo/${v.id_vehiculo}`}
                  className="flex flex-col rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 overflow-hidden shadow-md group"
                >
                  <div className="h-44 bg-slate-950 overflow-hidden relative">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto}
                        alt={v.modelo || 'Vehículo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Car className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-wider">
                      {v.tipo_vehiculo || 'Auto'}
                    </span>
                    {v.anio && (
                      <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1 rounded-full border border-slate-700">
                        Año {v.anio}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-sm font-black text-white group-hover:text-slate-200 transition truncate">
                        {v.marca} {v.modelo}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {v.version || 'Versión estándar'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        {v.precio_venta_usd && (
                          <DualMoney
                            usd={Number(v.precio_venta_usd)}
                            ars={Number(v.precio_venta_ars || 0)}
                            rate={dolarActual}
                            compact
                            primaryClassName="text-base font-black text-white"
                            secondaryClassName="text-[11px] text-slate-400 font-bold"
                          />
                        )}
                      </div>
                      <span
                        className="p-2 rounded-xl text-white transition shadow-sm"
                        style={{ background: palette.gradient }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Contacto Directo */}
      {(tenant.phone || config.whatsappContacto) && (
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5 text-center space-y-2.5">
          <p className="text-xs text-slate-400">¿Tenés dudas sobre tu financiación o querés visitarnos?</p>
          <div className="flex justify-center">
            {(config.whatsappContacto || tenant.phone) && (
              <a
                href={`https://wa.me/${String(config.whatsappContacto || tenant.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-950/40"
              >
                <PhoneCall className="w-4 h-4" /> Escribinos por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
