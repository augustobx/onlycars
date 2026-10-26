import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { managedModuleEnabled } from '@/lib/hub-features';

export const dynamic = 'force-dynamic';

export async function GET() {
  let appName = 'OnlyCars Ventas';
  let shortName = 'Ventas';
  let primaryColor = '#ea580c';

  try {
    const tenant = await getTenantContext();
    if (!managedModuleEnabled(tenant, 'seller_pwa')) return NextResponse.json({ success: false, error: 'Módulo deshabilitado.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    appName = `${tenant.name} · Ventas`;
    shortName = `${tenant.name.slice(0, 10)} Ventas`;
    primaryColor = tenant.settings?.primaryColor || '#ea580c';
  } catch {
    // fallback
  }

  const manifest = {
    name: appName,
    short_name: shortName,
    description: 'Gestión Comercial, Catálogo en Vivo, Cotizador y Operaciones',
    start_url: '/pwa/dashboard',
    scope: '/pwa',
    id: '/pwa-seller',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/icons/seller-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/seller-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/seller-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
