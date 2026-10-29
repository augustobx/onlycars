import type { Metadata, Viewport } from 'next';
import { RolMembresia } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { headers } from 'next/headers';
import { managedModuleEnabled } from '@/lib/hub-features';
import { tenantIsFinancialOnly } from '@/lib/tenant-modules';
import { PwaCapabilities } from './PwaCapabilities';
import { notFound, redirect } from 'next/navigation';
import PWASplash from './PWASplash';
import ModuleHelpButton from '@/components/ModuleHelpButton';

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars';
  try {
    const tenant = await getTenantContext();
    tenantName = tenant.name;
  } catch {}

  return {
    title: `${tenantName} · Ventas Móvil`,
    description: 'Gestión comercial móvil para concesionarias',
    manifest: '/api/pwa/manifest/seller',
    icons: {
      icon: '/icons/seller-192.png',
      apple: '/icons/seller-192.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: `${tenantName.slice(0, 8)} Ventas`,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default async function PWALayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getTenantContext();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('TENANT_RESOLUTION_FAILED:SUSPENDED:')) redirect('/suspendido');
    notFound();
  }

  try {
    await requireTenantRole(tenant.id, [
      RolMembresia.OWNER,
      RolMembresia.MANAGER,
      RolMembresia.ADMINISTRATIVO,
      RolMembresia.VENDEDOR,
    ]);
  } catch (error: any) {
    if (String(error?.message || '').startsWith('UNAUTHORIZED')) redirect('/login');
    redirect('/');
  }

  const pathname = (await headers()).get('x-pathname') || '';
  if (/^\/pwa\/(dashboard|cotizador|operaciones|vehiculo)(\/|$)/.test(pathname) && !managedModuleEnabled(tenant, 'seller_pwa')) notFound();
  const brandColor = tenant.settings?.primaryColor || '#2563eb';
  const themeStyles = `
    :root {
      --color-brand: ${brandColor};
      --color-brand-hover: ${brandColor}ee;
      --color-brand-ring: ${brandColor}33;
    }
  `;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 select-none antialiased">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
        <ModuleHelpButton variant="floating" />
        <PWASplash logo={tenant.settings?.logoUrl || null} initialDolar={tenant.settings?.dolarActual || 1400} tenantName={tenant.name}>
          <PwaCapabilities sellerEnabled={!tenantIsFinancialOnly(tenant.features) && managedModuleEnabled(tenant, 'seller_pwa')}>{children}</PwaCapabilities>
        </PWASplash>
      </div>
    </div>
  );
}
