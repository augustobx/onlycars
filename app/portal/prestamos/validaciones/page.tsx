import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedCliente } from '@/lib/client-auth';
import { redirect } from 'next/navigation';
import ValidacionesClienteView from './ValidacionesClienteView';

export const dynamic = 'force-dynamic';

export default async function PortalValidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);
  const resolvedSearchParams = await searchParams;

  if (!currentCliente) {
    redirect('/portal/login?redirect=/portal/prestamos/validaciones');
  }

  const solicitudesDb = await db.solicitudPrestamo.findMany({
    where: {
      tenantId: tenant.id,
      id_cliente: currentCliente.id_cliente,
    },
    orderBy: { fecha_solicitud: 'desc' },
    include: {
      documentos: true,
    },
  });

  const solicitudes = solicitudesDb.map((s) => ({
    ...s,
    monto_solicitado_usd: Number(s.monto_solicitado_usd),
    monto_solicitado_ars: s.monto_solicitado_ars ? Number(s.monto_solicitado_ars) : null,
    documentos: s.documentos.map((d) => ({
      ...d,
    })),
  }));

  return (
    <ValidacionesClienteView
      solicitudes={solicitudes}
      justCreated={resolvedSearchParams.created === '1'}
    />
  );
}
