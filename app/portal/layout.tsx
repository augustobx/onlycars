import type { Metadata, Viewport } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma as db } from '@/lib/prisma';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { getPalette } from '@/components/theme/palettes';
import PortalBottomNav from './PortalBottomNav';
import PortalSplash from './PortalSplash';
import PortalHeader from './PortalHeader';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import { NanoLabsMark } from '@/components/intro/NanoLabsMark';
import { ShieldAlert, Phone, Sparkles, ShieldCheck } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars';
  try {
    const tenant = await getTenantContext();
    tenantName = tenant.name;
  } catch {}

  return {
    title: `${tenantName} · Portal Clientes`,
    description: 'Consulta de cuotas, préstamos y catálogo de unidades',
    manifest: '/api/pwa/manifest/client',
    icons: {
      icon: '/icons/client-192.png',
      apple: '/icons/client-192.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: `${tenantName.slice(0, 8)} Clientes`,
    },
  };
}

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

  // Detectar si estamos en la ruta de login para renderizarla a pantalla completa con el estándar oficial de NanoLabs
  const reqHeaders = await headers();
  const pathname = reqHeaders.get('x-pathname') || '';
  const isLoginPage = pathname === '/portal/login' || pathname.startsWith('/portal/login');

  if (isLoginPage) {
    return (
      <>
        <link rel="manifest" href="/api/pwa/manifest/client" />
        <link rel="apple-touch-icon" href="/icons/client-192.png" />
        {children}
      </>
    );
  }

  const featureRecord = await db.tenantFeature.findUnique({
    where: {
      tenantId_featureKey: {
        tenantId: tenant.id,
        featureKey: CLIENT_PWA_FEATURE_KEY,
      },
    },
  });
  const config = normalizeClientPwaConfig(featureRecord?.config);
  const currentCliente = await getLoggedCliente(tenant.id);
  const palette = getPalette(tenant.settings?.paletteId);
  const brandColor = palette.primary;
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const themeStyles = `
    :root {
      --color-brand: ${palette.primary};
      --color-brand-hover: ${palette.hover};
      --color-brand-ring: ${palette.glow};
      --nl-mark-gradient: ${palette.gradient};
      --nl-mark-glow: ${palette.glow};
    }
  `;

  return (
    <>
      <link rel="manifest" href="/api/pwa/manifest/client" />
      <link rel="apple-touch-icon" href="/icons/client-192.png" />
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-orange-500/20 selection:text-orange-200">
        <PortalSplash
          logo={tenant.settings?.logoUrl || null}
          tenantName={tenant.name}
          brandColor={brandColor}
        >
          {/* Header Responsivo (Móvil y Desktop) */}
          <PortalHeader
            tenantName={tenant.name}
            logoUrl={tenant.settings?.logoUrl || null}
            dolarActual={dolarActual}
            currentCliente={currentCliente}
            config={config}
            palette={palette}
          />

          {/* Área Principal de Contenido Responsiva */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col pb-24 md:pb-8">
            {children}
          </main>

          {/* Footer Desktop Oficial de NanoLabs */}
          <footer className="hidden md:block border-t border-slate-900 bg-slate-950/60 py-8 mt-12 text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <NanoLabsMark size={20} />
                <p className="text-slate-400">
                  Powered by <strong className="text-white font-bold">NanoLabs</strong> · Automotive Cloud Platform
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Conexión Segura TLS 1.3
                </span>
                <span>© {new Date().getFullYear()} {tenant.name}.</span>
              </div>
            </div>
          </footer>

          <PwaInstallPrompt appType="client" appName={tenant.name} />

          {/* Barra de Navegación Inferior (Sólo en Móviles) */}
          <div className="md:hidden">
            <PortalBottomNav isLoggedIn={Boolean(currentCliente)} config={config} />
          </div>
        </PortalSplash>
      </div>
    </>
  );
}
