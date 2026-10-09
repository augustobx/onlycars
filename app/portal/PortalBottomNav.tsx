'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, FileText, HandCoins, CheckCircle2, User } from 'lucide-react';

export default function PortalBottomNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/portal/catalogo',
      label: 'Catálogo',
      icon: Car,
      active: pathname === '/portal/catalogo' || pathname.startsWith('/portal/catalogo/'),
    },
    {
      href: '/portal/cuotas',
      label: 'Mis Cuotas',
      icon: FileText,
      active: pathname === '/portal/cuotas',
    },
    {
      href: '/portal/prestamos',
      label: 'Préstamos',
      icon: HandCoins,
      active: pathname === '/portal/prestamos' || pathname === '/portal/prestamos/solicitar',
    },
    {
      href: '/portal/prestamos/validaciones',
      label: 'Validación',
      icon: CheckCircle2,
      active: pathname === '/portal/prestamos/validaciones',
    },
    {
      href: isLoggedIn ? '/portal' : '/portal/login',
      label: isLoggedIn ? 'Inicio' : 'Ingresar',
      icon: User,
      active: pathname === '/portal' || pathname === '/portal/login',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1 max-w-md mx-auto">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                item.active
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.active ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
