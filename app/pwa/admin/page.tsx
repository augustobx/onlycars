import type { Metadata } from 'next';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';
import PwaAdminHubClient from './PwaAdminHubClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars';
  try {
    const tenant = await getTenantContext();
    tenantName = tenant.name;
  } catch {}

  return {
    title: `${tenantName} · Admin PWA`,
    description: 'Panel de Administración Móvil para Concesionarias',
    manifest: '/api/pwa/manifest/admin',
    icons: {
      icon: '/icons/admin-192.png',
      apple: '/icons/admin-192.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: `${tenantName.slice(0, 8)} Admin`,
    },
  };
}

export default async function PwaAdminPage() {
  const tenant = await getTenantContext();
  const { user } = await requireTenantRole(tenant.id, [
    RolMembresia.OWNER,
    RolMembresia.MANAGER,
    RolMembresia.ADMINISTRATIVO,
  ]);

  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [vehiculosCount, cuotasPendientesCount, prestamosActivosCount] = await Promise.all([
    db.vehiculo.count({ where: { tenantId: tenant.id, estado: { not: 'VENDIDO' } } }),
    db.ventaCuota.count({ where: { tenantId: tenant.id, estado: 'PENDIENTE' } }),
    db.prestamo.count({ where: { tenantId: tenant.id, estado: 'ACTIVO' } }),
  ]);

  return (
    <>
      <link rel="manifest" href="/api/pwa/manifest/admin" />
      <link rel="apple-touch-icon" href="/icons/admin-192.png" />
      <PwaAdminHubClient
        tenantName={tenant.name}
        userName={user.name || user.email || 'Administrador'}
        dolarActual={dolarActual}
        vehiculosCount={vehiculosCount}
        cuotasPendientesCount={cuotasPendientesCount}
        prestamosActivosCount={prestamosActivosCount}
      />
    </>
  );
}
