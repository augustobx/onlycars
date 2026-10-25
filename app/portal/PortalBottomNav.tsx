'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, FileText, HandCoins, CheckCircle2, Home, LogIn } from 'lucide-react';
import type { ClientPwaConfig } from '@/lib/client-pwa-config';

interface PortalBottomNavProps {
  isLoggedIn: boolean;
  config?: ClientPwaConfig;
}

export default function PortalBottomNav({ isLoggedIn, config }: PortalBottomNavProps) {
  const pathname = usePathname();

  // Construcción dinámica de botones según los módulos habilitados por el tenant
  const navItems = [];

  // 1. Inicio siempre presente
  navItems.push({
    href: '/portal',
    label: 'Inicio',
    icon: Home,
    active: pathname === '/portal',
  });

  // 2. Catálogo (sólo si está habilitado por el tenant)
  if (config?.habilitarCatalogo !== false) {
    navItems.push({
      href: '/portal/catalogo',
      label: 'Catálogo',
      icon: Car,
      active: pathname === '/portal/catalogo' || pathname.startsWith('/portal/catalogo/'),
    });
  }

  // 3. Mis Cuotas (sólo si está habilitado por el tenant)
  if (config?.habilitarPlanCuotas !== false) {
    navItems.push({
      href: '/portal/cuotas',
      label: 'Mis Cuotas',
      icon: FileText,
      active: pathname === '/portal/cuotas',
    });
  }

  // 4. Préstamos (sólo si préstamos o solicitud de préstamos están habilitados)
  if (config?.habilitarPrestamos !== false || config?.habilitarSolicitudPrestamos !== false) {
    navItems.push({
      href: '/portal/prestamos',
      label: 'Préstamos',
      icon: HandCoins,
      active: pathname === '/portal/prestamos' || pathname === '/portal/prestamos/solicitar',
    });
  }

  // 5. Validación de documentación (sólo si solicitud de préstamos está habilitada)
  if (config?.habilitarSolicitudPrestamos !== false) {
    navItems.push({
      href: '/portal/prestamos/validaciones',
      label: 'Validación',
      icon: CheckCircle2,
      active: pathname === '/portal/prestamos/validaciones',
    });
  }

  // 6. Ingresar (si no inició sesión todavía)
  if (!isLoggedIn) {
    navItems.push({
      href: '/portal/login',
      label: 'Ingresar',
      icon: LogIn,
      active: pathname === '/portal/login',
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 max-w-md mx-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around w-full gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                item.active
                  ? 'font-black border shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-semibold border-transparent'
              }`}
              style={
                item.active
                  ? {
                      color: 'var(--color-brand, #ff6600)',
                      backgroundColor: 'var(--color-brand-ring, rgba(255,102,0,0.15))',
                      borderColor: 'var(--color-brand, #ff6600)',
                      boxShadow: '0 0 12px var(--color-brand-ring, rgba(255,102,0,0.2))',
                    }
                  : undefined
              }
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5 transition-transform duration-200"
                  style={item.active ? { color: 'var(--color-brand, #ff6600)', transform: 'scale(1.1)' } : undefined}
                />
                {item.active && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-brand, #ff6600)',
                      boxShadow: '0 0 6px var(--color-brand, #ff6600)',
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
