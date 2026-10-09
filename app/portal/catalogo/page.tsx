import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import CatalogoClient from './CatalogoClient';

export const dynamic = 'force-dynamic';

export default async function PortalCatalogoPage() {
  const tenant = await getTenantContext();

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

  const vehiculosDb = await db.vehiculo.findMany({
    where: {
      tenantId: tenant.id,
      estado: 'LISTO_PARA_VENTA',
    },
    orderBy: { fecha_ingreso: 'desc' },
    include: {
      fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }] },
    },
  });

  const vehiculos = vehiculosDb.map((v) => ({
    ...v,
    precio_venta_usd: v.precio_venta_usd ? Number(v.precio_venta_usd) : null,
    precio_venta_ars: v.precio_venta_ars ? Number(v.precio_venta_ars) : null,
    fotos: v.fotos.map((f) => ({ id_foto: f.id_foto, url_foto: f.url_foto })),
  }));

  return (
    <CatalogoClient
      vehiculos={vehiculos}
      dolarActual={dolarActual}
      whatsappContacto={config.whatsappContacto || tenant.phone || ''}
      agencyName={tenant.name}
    />
  );
}
