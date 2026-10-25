import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedCliente } from '@/lib/client-auth';
import { redirect } from 'next/navigation';
import PortalLoginClient from './PortalLoginClient';

export const dynamic = 'force-dynamic';

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const tenant = await getTenantContext();
  const currentCliente = await getLoggedCliente(tenant.id);
  const resolvedSearchParams = await searchParams;

  const returnUrl = resolvedSearchParams.redirect || '/portal';

  if (currentCliente) {
    redirect(returnUrl);
  }

  return (
    <PortalLoginClient
      tenantName={tenant.name}
      redirectTo={returnUrl}
      logoUrl={tenant.settings?.logoUrl || null}
      brandColor={tenant.settings?.primaryColor || '#FF6600'}
      paletteId={tenant.settings?.paletteId || 'orange'}
    />
  );
}
