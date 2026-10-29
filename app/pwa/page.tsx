import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedUser } from '@/lib/user-auth';
import { tenantIsFinancialOnly } from '@/lib/tenant-modules';
import { RolMembresia } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function PWARootPage() {
  try {
    const tenant = await getTenantContext();
    if (tenantIsFinancialOnly(tenant.features)) {
      redirect('/pwa/admin');
    }

    const user = await getLoggedUser();
    const membership = user?.memberships.find((m) => m.tenantId === tenant.id);
    const role = user?.isSuperAdmin ? RolMembresia.OWNER : membership?.role;

    if (role === RolMembresia.OWNER || role === RolMembresia.MANAGER || role === RolMembresia.ADMINISTRATIVO) {
      redirect('/pwa/admin');
    }
  } catch {}

  redirect('/pwa/admin');
}
