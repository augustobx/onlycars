import { MetadataRoute } from 'next'
import { getTenantContext } from '@/lib/tenant-context'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = 'OnlyCars Vendedores'
  let primaryColor = '#4f46e5'

  try {
    const tenant = await getTenantContext()
    appName = `${tenant.name} - Vendedores`
    primaryColor = tenant.settings?.primaryColor || '#4f46e5'
  } catch {
    // fallback
  }

  return {
    name: appName,
    short_name: 'Ventas',
    description: 'Sistema de Gestión de Ventas y Cotizaciones',
    start_url: '/pwa',
    display: 'standalone',
    background_color: '#0f172a',
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
  }
}