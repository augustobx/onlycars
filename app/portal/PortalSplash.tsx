'use client';

import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';

export default function PortalSplash({
  children,
  logo,
  tenantName,
  brandColor = '#059669',
}: {
  children: React.ReactNode;
  logo: string | null;
  tenantName: string;
  brandColor?: string;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN CLIENTES) */}
      <div
        className={`absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ${
          showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Glow de fondo animado */}
        <div
          className="absolute w-80 h-80 rounded-full blur-[140px] opacity-35 pointer-events-none -translate-y-12"
          style={{ backgroundColor: brandColor }}
        />

        <div className="w-28 h-28 flex items-center justify-center mb-5 animate-pulse z-10">
          {logo ? (
            <img src={logo} alt={tenantName} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          ) : (
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: brandColor }}
            >
              <UserCheck className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        <div className="text-center px-4 z-10 space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 inline-block">
            Portal Oficial de Clientes
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">{tenantName}</h1>
          <p className="text-xs text-slate-400 font-medium">Mis Cuotas, Préstamos y Catálogo Digital</p>
        </div>

        {/* Indicadores de carga */}
        <div className="mt-8 flex gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {children}
    </>
  );
}
