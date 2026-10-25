'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Calculator, LayoutGrid, Handshake, CalendarClock, HandCoins } from 'lucide-react';

export default function PwaBottomNav({ active }: { active: 'stock' | 'quote' | 'operations' | 'cuotas' | 'prestamos' }) {
  const item = (key: 'stock' | 'quote' | 'operations' | 'cuotas' | 'prestamos', href: string, label: string, icon: ReactNode) => {
    const isCurrent = active === key;
    return (
      <Link
        href={href}
        className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition-all ${
          isCurrent ? 'text-indigo-600 scale-105 font-black' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className={`p-1 rounded-xl transition-colors ${isCurrent ? 'bg-indigo-50 text-indigo-600' : ''}`}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-md items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-1 py-1.5 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.06)]">
      {item('stock', '/pwa/dashboard', 'Stock', <LayoutGrid className="h-5 w-5" />)}
      {item('cuotas', '/pwa/cuotas', 'Cuotas', <CalendarClock className="h-5 w-5" />)}
      {item('prestamos', '/pwa/prestamos', 'Préstamos', <HandCoins className="h-5 w-5" />)}
      {item('quote', '/pwa/cotizador', 'Cotizar', <Calculator className="h-5 w-5" />)}
      {item('operations', '/pwa/operaciones', 'Operar', <Handshake className="h-5 w-5" />)}
    </nav>
  );
}
