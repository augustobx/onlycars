import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { notFound } from 'next/navigation';
import VehiculoDetalleClient from './VehiculoDetalleClient';

export const dynamic = 'force-dynamic';

export default async function PortalVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const tenant = await getTenantContext();
  const idVehiculo = Number(resolvedParams.id);

  if (!idVehiculo || isNaN(idVehiculo)) {
    notFound();
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
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const vehiculoDb = await db.vehiculo.findFirst({
    where: {
      id_vehiculo: idVehiculo,
      tenantId: tenant.id,
      publicadoWeb: true,
      estado: { in: ['LISTO_PARA_VENTA', 'EN_CONSIGNACION'] },
    },
    include: {
      fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }] },
    },
  });

  if (!vehiculoDb) {
    notFound();
  }

  const vehiculo = {
    ...vehiculoDb,
    precio_venta_usd: vehiculoDb.precio_venta_usd ? Number(vehiculoDb.precio_venta_usd) : null,
    precio_venta_ars: vehiculoDb.precio_venta_ars ? Number(vehiculoDb.precio_venta_ars) : null,
    fotos: vehiculoDb.fotos.map((f) => ({ id_foto: f.id_foto, url_foto: f.url_foto })),
  };

  return (
    <VehiculoDetalleClient
      vehiculo={vehiculo}
      dolarActual={dolarActual}
      whatsappContacto={config.whatsappContacto || tenant.phone || ''}
      agencyName={tenant.name}
    />
  );
}
