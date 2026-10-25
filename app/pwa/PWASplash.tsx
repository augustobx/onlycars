'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { CarFront, ShieldCheck, UserCheck } from 'lucide-react';

export default function PWASplash({
  children,
  logo,
  initialDolar,
  tenantName,
  variant,
}: {
  children: React.ReactNode;
  logo: string | null;
  initialDolar: number;
  tenantName?: string;
  variant?: 'admin' | 'seller' | 'client';
}) {
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const { setLogo, setDolar } = useConfigStore();

  const effectiveVariant: 'admin' | 'seller' | 'client' =
    variant ||
    (pathname?.includes('/admin') || pathname?.includes('/cuotas') || pathname?.includes('/prestamos')
      ? 'admin'
      : pathname?.includes('/portal')
      ? 'client'
      : 'seller');

  useEffect(() => {
    if (logo) setLogo(logo);
    if (initialDolar) setDolar(initialDolar);

    const timer = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(timer);
  }, [logo, initialDolar, setLogo, setDolar]);

  const config = {
    admin: {
      badge: 'Panel Administrador',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      subtitle: 'Cuotas, Préstamos y Finanzas',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      Icon: ShieldCheck,
      iconColor: 'bg-emerald-600',
    },
    seller: {
      badge: 'Comercial & Ventas',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      subtitle: 'Stock en Vivo, Cotizador y Operaciones',
      glowColor: 'rgba(234, 88, 12, 0.25)',
      Icon: CarFront,
      iconColor: 'bg-orange-600',
    },
    client: {
      badge: 'Portal Clientes',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      subtitle: 'Mis Cuotas, Préstamos y Catálogo Digital',
      glowColor: 'rgba(2, 132, 199, 0.25)',
      Icon: UserCheck,
      iconColor: 'bg-cyan-600',
    },
  }[effectiveVariant];

  const IconComp = config.Icon;

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN) */}
      <div
        className={`absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ${
          showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Glow de fondo animado */}
        <div
          className="absolute w-80 h-80 rounded-full blur-[140px] opacity-40 pointer-events-none -translate-y-12"
          style={{ backgroundColor: config.glowColor }}
        />

        <div className="w-32 h-32 flex items-center justify-center mb-5 animate-pulse z-10">
          {logo ? (
            <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          ) : (
            <div className={`w-20 h-20 ${config.iconColor} rounded-3xl flex items-center justify-center shadow-2xl`}>
              <IconComp className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        <div className="text-center px-4 z-10 space-y-1.5">
          <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border ${config.badgeClass} inline-block`}>
            {config.badge}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {tenantName || 'OnlyCars'}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {config.subtitle}
          </p>
        </div>

        {/* Indicadores de carga */}
        <div className="mt-8 flex gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {children}
    </>
  );
}