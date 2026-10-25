'use client';

import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';

export default function PortalSplash({
  children,
  logo,
  tenantName,
  brandColor = '#FF6600',
}: {
  children: React.ReactNode;
  logo: string | null;
  tenantName: string;
  brandColor?: string;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    const unmountTimer = setTimeout(() => setMounted(false), 1700);
    return () => {
      clearTimeout(timer);
      clearTimeout(unmountTimer);
    };
  }, []);

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN CLIENTES) */}
      {mounted && (
        <div
          className={`fixed inset-0 z-[100] bg-slate-950 overflow-hidden flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none ${
            showSplash ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Glow de fondo animado contenido sin desborde */}
          <div
            className="absolute w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none -translate-y-12"
            style={{ backgroundColor: brandColor }}
          />

          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-5 animate-pulse z-10">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={tenantName} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: brandColor }}
              >
                <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}
          </div>

          <div className="text-center px-4 z-10 space-y-1.5 max-w-sm">
            <span
              className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border inline-block"
              style={{
                borderColor: `${brandColor}40`,
                backgroundColor: `${brandColor}15`,
                color: brandColor,
              }}
            >
              Portal Oficial de Clientes
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{tenantName}</h1>
            <p className="text-xs text-slate-400 font-medium">Mis Cuotas, Préstamos y Catálogo Digital</p>
          </div>

          {/* Indicadores de carga */}
          <div className="mt-6 sm:mt-8 flex gap-2 z-10">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: brandColor, opacity: 0.5, animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: brandColor, opacity: 0.8, animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: brandColor, opacity: 1, animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {children}
    </>
  );
}
