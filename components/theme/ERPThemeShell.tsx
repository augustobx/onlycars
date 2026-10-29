'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { LayoutNanoLabs } from './LayoutNanoLabs';
import { ERPThemeProvider, useERPTheme, type ERPTheme } from './ThemeContext';

export interface ERPThemeShellProps {
  initialTheme?: ERPTheme;
  initialPaletteId?: string;
  tenantName: string;
  tenantLogo: string | null;
  isSuperAdmin: boolean;
  currentRole: string;
  canConfigure: boolean;
  canSyncDolar: boolean;
  initialDolar: number;
  initialTipo: string;
  userName: string;
  userEmail: string;
  brandPrimary?: string;
  children: React.ReactNode;
}

function ERPThemeShellContent({
  tenantName,
  tenantLogo,
  isSuperAdmin,
  currentRole,
  canConfigure,
  canSyncDolar,
  initialDolar,
  initialTipo,
  userName,
  userEmail,
  brandPrimary = '#FF6600',
  children,
}: Omit<ERPThemeShellProps, 'initialTheme' | 'initialPaletteId'>) {
  const { theme, setTheme } = useERPTheme();

  // THEME 2 (Oficial NanoLabs)
  if (theme === '2') {
    return (
      <LayoutNanoLabs
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        userName={userName}
        userEmail={userEmail}
        currentRole={currentRole}
        isSuperAdmin={isSuperAdmin}
        canConfigure={canConfigure}
        canSyncDolar={canSyncDolar}
        initialDolar={initialDolar}
        initialTipo={initialTipo}
      >
        {children}
      </LayoutNanoLabs>
    );
  }

  // THEME 1 (Clásico)
  const themeStyles = `:root { --color-brand: ${brandPrimary}; --color-brand-hover: ${brandPrimary}ee; --color-brand-ring: ${brandPrimary}33; }`;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <div className="print:hidden">
        <Sidebar
          tenantName={tenantName}
          tenantLogo={tenantLogo}
          isSuperAdmin={isSuperAdmin}
          currentRole={currentRole}
        />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="print:hidden">
          <TopBar
            initialDolar={initialDolar}
            initialTipo={initialTipo}
            initialLogo={tenantLogo}
            tenantName={tenantName}
            isSuperAdmin={isSuperAdmin}
            canConfigure={canConfigure}
            canSyncDolar={canSyncDolar}
            onSwitchTheme={(t) => setTheme(t)}
            currentTheme="1"
          />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

export default function ERPThemeShell({
  initialTheme = '2',
  initialPaletteId,
  ...props
}: ERPThemeShellProps) {
  return (
    <ERPThemeProvider initialTheme={initialTheme} initialPaletteId={initialPaletteId}>
      <ERPThemeShellContent {...props} />
    </ERPThemeProvider>
  );
}
