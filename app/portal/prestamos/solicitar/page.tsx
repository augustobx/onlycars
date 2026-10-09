import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { redirect } from 'next/navigation';
import SolicitarPrestamoClient from './SolicitarPrestamoClient';

export const dynamic = 'force-dynamic';

export default async function PortalSolicitarPrestamoPage() {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);

  if (!currentCliente) {
    redirect('/portal/login?redirect=/portal/prestamos/solicitar');
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

  if (!config.habilitarSolicitudPrestamos) {
    redirect('/portal/prestamos');
  }

  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  return (
    <SolicitarPrestamoClient
      dolarActual={dolarActual}
      tiposDocumentos={config.tiposDocumentos}
      montoMaximoUsd={config.montoMaximoPrestamoUsd}
      requerirDocumentos={config.requerirDocumentacion}
    />
  );
}
