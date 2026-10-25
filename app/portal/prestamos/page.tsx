import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { redirect } from 'next/navigation';
import PrestamosClienteView from './PrestamosClienteView';

export const dynamic = 'force-dynamic';

export default async function PortalPrestamosPage() {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);

  if (!currentCliente) {
    redirect('/portal/login?redirect=/portal/prestamos');
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
  if (!config.habilitarPrestamos && !config.habilitarSolicitudPrestamos) {
    redirect('/portal');
  }
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const prestamosDb = await db.prestamo.findMany({
    where: {
      tenantId: tenant.id,
      id_cliente: currentCliente.id_cliente,
    },
    orderBy: { fecha_prestamo: 'desc' },
    include: {
      cuotas: { orderBy: { numero_cuota: 'asc' } },
    },
  });

  const prestamos = prestamosDb.map((p) => ({
    ...p,
    capital_entregado_usd: Number(p.capital_entregado_usd),
    total_devolver_usd: Number(p.total_devolver_usd),
    cotizacion_dolar_prestamo: Number(p.cotizacion_dolar_prestamo),
    cuotas: p.cuotas.map((c) => ({
      ...c,
      monto_usd: Number(c.monto_usd),
      monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
    })),
  }));

  return (
    <PrestamosClienteView
      prestamos={prestamos}
      dolarActual={dolarActual}
      puedeSolicitar={config.habilitarSolicitudPrestamos}
    />
  );
}
