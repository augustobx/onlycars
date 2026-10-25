import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { redirect } from 'next/navigation';
import CuotasClient from './CuotasClient';

export const dynamic = 'force-dynamic';

export default async function PortalCuotasPage() {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);

  if (!currentCliente) {
    redirect('/portal/login?redirect=/portal/cuotas');
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

  if (!config.habilitarPlanCuotas) {
    redirect('/portal');
  }

  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const ventasDb = await db.venta.findMany({
    where: {
      tenantId: tenant.id,
      id_cliente: currentCliente.id_cliente,
      forma_pago: 'Cuotas',
    },
    orderBy: { fecha_venta: 'desc' },
    include: {
      vehiculo: true,
      cuotas: { orderBy: { numero_cuota: 'asc' } },
    },
  });

  const ventas = ventasDb.map((v) => ({
    ...v,
    precio_final_usd: Number(v.precio_final_usd),
    anticipo_usd: v.anticipo_usd ? Number(v.anticipo_usd) : 0,
    saldo_financiado_usd: v.saldo_financiado_usd ? Number(v.saldo_financiado_usd) : 0,
    cuotas: v.cuotas.map((c) => ({
      ...c,
      monto_usd: Number(c.monto_usd),
      monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
    })),
  }));

  return <CuotasClient ventas={ventas} dolarActual={dolarActual} />;
}
