import ERPThemeShell from '@/components/theme/ERPThemeShell';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedUser } from '@/lib/user-auth';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getTenantContext();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('TENANT_RESOLUTION_FAILED:SUSPENDED:')) redirect('/suspendido');
    console.error('[ERP Tenant Context Error]:', error);
    notFound();
  }

  const user = await getLoggedUser();
  if (!user) redirect('/login');
  const membership = user.memberships.find((m) => m.tenantId === tenant.id);
  if (!user.isSuperAdmin && !membership) {
    console.warn(`[SECURITY] User ${user.id} attempted tenant access without membership: ${tenant.id}`);
    redirect('/login?error=tenant_access_denied');
  }

  const currentRole = user.isSuperAdmin ? 'OWNER' : membership?.role || 'VENDEDOR';

  // El vendedor opera exclusivamente desde la experiencia móvil/PWA.
  if (!user.isSuperAdmin && currentRole === 'VENDEDOR') {
    redirect('/pwa/dashboard');
  }

  const canConfigure = user.isSuperAdmin || ['OWNER', 'MANAGER'].includes(currentRole);
  const canSyncDolar = user.isSuperAdmin || ['OWNER', 'MANAGER', 'ADMINISTRATIVO'].includes(currentRole);
  const initialDolar = tenant.settings?.dolarActual ?? 1400;
  const initialTipo = tenant.settings?.tipoDolar ?? 'blue';
  const initialLogo = tenant.settings?.logoUrl ?? null;
  const brandPrimary = tenant.settings?.primaryColor ?? '#2563eb';

  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('onlycars_theme')?.value;
  const initialTheme = (cookieTheme === '1' ? '1' : '2') as '1' | '2';
  const initialPaletteId = cookieStore.get('onlycars_palette')?.value || 'orange';

  return (
    <ERPThemeShell
      initialTheme={initialTheme}
      initialPaletteId={initialPaletteId}
      tenantName={tenant.name}
      tenantLogo={initialLogo}
      isSuperAdmin={user.isSuperAdmin}
      currentRole={currentRole}
      canConfigure={canConfigure}
      canSyncDolar={canSyncDolar}
      initialDolar={initialDolar}
      initialTipo={initialTipo}
      userName={user.name || user.email.split('@')[0]}
      userEmail={user.email}
      brandPrimary={brandPrimary}
    >
      {children}
    </ERPThemeShell>
  );
}
