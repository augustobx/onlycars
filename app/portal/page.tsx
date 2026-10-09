import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
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
  Clock,
  ChevronRight,
  LogOut,
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
      estado: 'LISTO_PARA_VENTA',
    },
    take: 3,
    orderBy: { fecha_ingreso: 'desc' },
    include: {
      fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }], take: 1 },
    },
  });

  return (
    <div className="p-4 space-y-5">
      {/* Saludo y Estado */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {currentCliente ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Cliente Verificado
                </p>
                <h1 className="text-xl font-black text-white mt-0.5">
                  ¡Hola, {currentCliente.nombre_completo}!
                </h1>
                <p className="text-xs text-slate-400">DNI: {currentCliente.dni || 'Sin registrar'}</p>
              </div>
              <form action="/api/portal/logout" method="POST">
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs font-bold flex items-center gap-1 border border-slate-700"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-lg font-black text-white">{cuotasPendientesCount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Cuotas pend.</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-lg font-black text-emerald-400">{prestamosActivosCount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Préstamos</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-lg font-black text-indigo-400">{solicitudesPendientesCount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">En validación</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Portal de Clientes
            </span>
            <h1 className="text-2xl font-black text-white leading-tight">
              Bienvenido a <span className="text-emerald-400">{tenant.name}</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {config.mensajeBienvenida}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Link
                href="/portal/login"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black text-center shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                Ingresar con DNI <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/portal/catalogo"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center border border-slate-700 transition"
              >
                Ver Catálogo
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Módulos Principales */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Servicios Disponibles
        </h2>

        {config.habilitarCatalogo && (
          <Link
            href="/portal/catalogo"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Catálogo de Autos</p>
                <p className="text-[11px] text-slate-400">Stock disponible, precios y características (libre acceso)</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition" />
          </Link>
        )}

        {config.habilitarPlanCuotas && (
          <Link
            href="/portal/cuotas"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Mis Planes de Cuotas</p>
                <p className="text-[11px] text-slate-400">Cuotas pagadas, pendientes, montos y comprobantes</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition" />
          </Link>
        )}

        {config.habilitarPrestamos && (
          <Link
            href="/portal/prestamos"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Préstamos de Dinero</p>
                <p className="text-[11px] text-slate-400">Capital otorgado, saldo a devolver y cuotas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition" />
          </Link>
        )}

        {config.habilitarSolicitudPrestamos && (
          <Link
            href="/portal/prestamos/solicitar"
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-850 hover:from-emerald-900/60 border border-emerald-500/30 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Solicitar Nuevo Préstamo</p>
                <p className="text-[11px] text-emerald-300">Subí tus documentos y obtené respuesta rápida</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-0.5 transition" />
          </Link>
        )}

        <Link
          href="/portal/prestamos/validaciones"
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Validación de Solicitudes</p>
              <p className="text-[11px] text-slate-400">Estado de trámites y validación de documentación</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition" />
        </Link>
      </section>

      {/* Preview de Unidades Destacadas */}
      {config.habilitarCatalogo && destacadosDb.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Unidades Destacadas
            </h2>
            <Link href="/portal/catalogo" className="text-xs font-black text-emerald-400 hover:underline">
              Ver todas ({destacadosDb.length}+)
            </Link>
          </div>

          <div className="space-y-3">
            {destacadosDb.map((v) => {
              const foto = v.fotos[0]?.url_foto;
              return (
                <Link
                  key={v.id_vehiculo}
                  href={`/portal/catalogo/${v.id_vehiculo}`}
                  className="flex gap-3.5 p-3 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="w-24 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 relative">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt={v.modelo || 'Vehículo'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Car className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-black text-white truncate">
                        {v.marca} {v.modelo}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {v.version || ''} {v.anio ? `· ${v.anio}` : ''}
                      </p>
                    </div>
                    <div>
                      {v.precio_venta_usd && (
                        <DualMoney
                          usd={Number(v.precio_venta_usd)}
                          ars={Number(v.precio_venta_ars || 0)}
                          rate={dolarActual}
                          compact
                          primaryClassName="text-sm font-black text-emerald-400"
                          secondaryClassName="text-[10px] text-slate-400 font-bold"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Contacto Concesionaria */}
      {(tenant.phone || config.whatsappContacto) && (
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center space-y-2">
          <p className="text-xs text-slate-400">¿Tenés dudas sobre tu financiación o querés visitarnos?</p>
          <div className="flex justify-center gap-2">
            {(config.whatsappContacto || tenant.phone) && (
              <a
                href={`https://wa.me/${String(config.whatsappContacto || tenant.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Escribinos por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
