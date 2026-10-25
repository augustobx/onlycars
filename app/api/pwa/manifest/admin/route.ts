import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  let appName = 'OnlyCars Admin';
  let shortName = 'Admin';
  let primaryColor = '#10b981';

  try {
    const tenant = await getTenantContext();
    appName = `${tenant.name} · Admin`;
    shortName = `${tenant.name.slice(0, 10)} Admin`;
    primaryColor = tenant.settings?.primaryColor || '#10b981';
  } catch {
    // fallback
  }

  const manifest = {
    name: appName,
    short_name: shortName,
    description: 'Panel de Administración Móvil, Cuotas, Préstamos y Control Operativo',
    start_url: '/pwa/admin',
    scope: '/pwa',
    id: '/pwa-admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0f19',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icons/admin-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/admin-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/admin-512.png',
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
