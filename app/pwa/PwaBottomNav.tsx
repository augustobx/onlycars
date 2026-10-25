'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSellerPwaEnabled } from './PwaCapabilities';
import { Calculator, LayoutGrid, Handshake, CalendarClock, HandCoins } from 'lucide-react';

export default function PwaBottomNav({
  active,
}: {
  active: 'stock' | 'quote' | 'operations' | 'cuotas' | 'prestamos';
}) {
  const sellerEnabled = useSellerPwaEnabled();
  const item = (
    key: 'stock' | 'quote' | 'operations' | 'cuotas' | 'prestamos',
    href: string,
    label: string,
    icon: ReactNode
  ) => {
    const isCurrent = active === key;
    return (
      <Link
        href={href}
        className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
          isCurrent
            ? 'text-orange-400 font-black bg-orange-500/15 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.18)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-semibold border border-transparent'
        }`}
      >
        <div className="relative">
          <div className={`p-1 rounded-xl transition-transform duration-200 ${isCurrent ? 'scale-110 text-orange-400' : 'text-slate-400'}`}>
            {icon}
          </div>
          {isCurrent && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c]" />
          )}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider leading-none truncate max-w-full">
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-md items-center justify-around border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-1.5 py-1.5 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      {sellerEnabled && item('stock', '/pwa/dashboard', 'Stock', <LayoutGrid className="h-5 w-5" />)}
      {sellerEnabled && item('quote', '/pwa/cotizador', 'Cotizar', <Calculator className="h-5 w-5" />)}
      {sellerEnabled && item('operations', '/pwa/operaciones', 'Operar', <Handshake className="h-5 w-5" />)}
      {item('cuotas', '/pwa/cuotas', 'Cuotas', <CalendarClock className="h-5 w-5" />)}
      {item('prestamos', '/pwa/prestamos', 'Préstamos', <HandCoins className="h-5 w-5" />)}
    </nav>
  );
}
