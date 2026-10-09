import { MetadataRoute } from 'next';
import { getTenantContext } from '@/lib/tenant-context';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = 'Portal Clientes OnlyCars';
  let primaryColor = '#10b981';

  try {
    const tenant = await getTenantContext();
    appName = `${tenant.name} - Clientes`;
    primaryColor = tenant.settings?.primaryColor || '#10b981';
  } catch {
    // Usar defaults si falla contexto
  }

  return {
    name: appName,
    short_name: 'Clientes',
    description: 'Portal de gestión de cuotas, préstamos y catálogo de unidades',
    start_url: '/portal',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: primaryColor,
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
