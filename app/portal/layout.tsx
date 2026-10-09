import type { Metadata, Viewport } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import PortalBottomNav from './PortalBottomNav';
import { ShieldAlert, Phone, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal Clientes',
  description: 'Consulta de cuotas, préstamos y catálogo de unidades',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090d16',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getTenantContext();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('TENANT_RESOLUTION_FAILED:SUSPENDED:')) redirect('/suspendido');
    notFound();
  }

  const isModuleEnabled = tenant.features.has(CLIENT_PWA_FEATURE_KEY);

  if (!isModuleEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Módulo Premium
            </span>
            <h1 className="text-xl font-black text-white mt-1">Portal Clientes no habilitado</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              La aplicación para clientes y catálogo digital no se encuentra activa en el plan de <strong className="text-slate-200">{tenant.name}</strong>.
            </p>
          </div>
          {tenant.phone && (
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contacto de la agencia: <strong className="text-white">{tenant.phone}</strong></span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentCliente = await getLoggedCliente(tenant.id);
  const brandColor = tenant.settings?.primaryColor || '#10b981';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased select-none">
      <div className="max-w-md mx-auto min-h-screen bg-slate-900 border-x border-slate-800/60 shadow-2xl flex flex-col relative pb-20">
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.settings.logoUrl}
                alt={tenant.name}
                className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-1 border border-slate-700"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ backgroundColor: brandColor }}
              >
                {tenant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-black text-white leading-none tracking-tight">{tenant.name}</p>
              <p className="text-[10px] text-emerald-400 font-bold leading-none mt-1">Portal Clientes</p>
            </div>
          </div>

          <div>
            {currentCliente ? (
              <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                {currentCliente.nombre_completo.split(' ')[0]}
              </span>
            ) : (
              <a
                href="/portal/login"
                className="text-[11px] font-black text-white px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 transition"
              >
                Ingresar
              </a>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <PortalBottomNav isLoggedIn={Boolean(currentCliente)} />
      </div>
    </div>
  );
}
