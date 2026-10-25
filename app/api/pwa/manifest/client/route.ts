import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  let appName = 'OnlyCars Clientes';
  let shortName = 'Clientes';
  let primaryColor = '#059669';

  try {
    const tenant = await getTenantContext();
    appName = `${tenant.name} · Clientes`;
    shortName = `${tenant.name.slice(0, 10)} Clientes`;
    primaryColor = tenant.settings?.primaryColor || '#059669';
  } catch {
    // fallback
  }

  const manifest = {
    name: appName,
    short_name: shortName,
    description: 'Portal de Clientes, Mis Cuotas, Mis Préstamos y Catálogo Digital',
    start_url: '/portal',
    scope: '/portal',
    id: '/portal-client',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#090d16',
    theme_color: '#059669',
    icons: [
      {
        src: '/icons/client-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/client-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/client-512.png',
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
