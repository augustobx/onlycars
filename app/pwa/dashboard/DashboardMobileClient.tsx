'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookmarkCheck, CarFront, Search, Car, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';

interface DashboardMobileClientProps {
  vehiculos: any[];
  pwaConfig: SellerPwaConfig;
  tenantName?: string;
  dolarActual?: number;
}

export default function DashboardMobileClient({
  vehiculos,
  pwaConfig,
  tenantName = 'OnlyCars',
  dolarActual: propDolar,
}: DashboardMobileClientProps) {
  const { dolarBlue } = useConfigStore();
  const dolar = propDolar || Number(dolarBlue || 1400);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'DISPONIBLES' | 'RESERVADOS' | 'PREPARACION'>('TODOS');

  const filtrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vehiculos.filter((v) => {
      const matchSearch =
        !q ||
        `${v.marca} ${v.modelo} ${v.version || ''} ${v.patente}`.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filtroEstado === 'DISPONIBLES') return !v.reservado && v.estado === 'LISTO_PARA_VENTA';
      if (filtroEstado === 'RESERVADOS') return v.reservado;
      if (filtroEstado === 'PREPARACION') return v.estado === 'EN_PREPARACION';
      return true;
    });
  }, [vehiculos, searchTerm, filtroEstado]);

  const money = (value: number, digits = 0) =>
    Number(value || 0).toLocaleString('es-AR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans antialiased select-none">
      {/* HEADER Nanolabs Mobile */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700 p-2 flex items-center justify-center text-white shadow-lg shadow-orange-950/50 border border-orange-400/20">
              <Car className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 leading-none">
                {tenantName}
              </p>
              <h1 className="mt-1 text-xl font-black tracking-tight text-white leading-none">
                Stock en Vivo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pwaConfig.showUsdPrices && (
              <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-400 shadow-sm">
                USD $ {dolar.toLocaleString('es-AR')}
              </span>
            )}
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-300">
              {filtrados.length}
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar marca, modelo, versión o patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 py-3 pl-10 pr-4 text-xs font-medium text-white placeholder:text-slate-500 outline-none transition-all focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/80"
          />
        </div>

        {/* Chips de Filtro Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
          <button
            onClick={() => setFiltroEstado('TODOS')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              filtroEstado === 'TODOS'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            Todos ({vehiculos.length})
          </button>
          <button
            onClick={() => setFiltroEstado('DISPONIBLES')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              filtroEstado === 'DISPONIBLES'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setFiltroEstado('RESERVADOS')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              filtroEstado === 'RESERVADOS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            Reservados
          </button>
          <button
            onClick={() => setFiltroEstado('PREPARACION')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              filtroEstado === 'PREPARACION'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            En Taller
          </button>
        </div>
      </header>

      {/* LISTA DE VEHÍCULOS */}
      <main className="mt-2 space-y-3.5 p-4">
        {filtrados.length === 0 ? (
          <div className="mt-12 text-center p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <CarFront className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300 text-sm">No se encontraron vehículos</p>
            <p className="text-xs text-slate-500">Probá con otro término de búsqueda o filtro.</p>
          </div>
        ) : (
          filtrados.map((v) => (
            <Link
              key={v.id_vehiculo}
              href={`/pwa/vehiculo/${v.id_vehiculo}`}
              className="block overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 shadow-xl shadow-black/40 hover:border-slate-700/90 transition-all duration-200 active:scale-[0.99] group"
            >
              <div className="relative h-44 w-full bg-slate-900">
                {v.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.foto}
                    alt={`${v.marca} ${v.modelo}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-700">
                    <CarFront className="h-16 w-16" />
                  </div>
                )}

                {/* Badges superiores */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                      v.estado === 'EN_PREPARACION'
                        ? 'bg-amber-500/90 text-slate-950 border border-amber-400/40'
                        : v.estado === 'EN_CONSIGNACION'
                        ? 'bg-purple-500/90 text-white border border-purple-400/40'
                        : 'bg-emerald-500/90 text-slate-950 border border-emerald-400/40'
                    }`}
                  >
                    {v.estado === 'EN_PREPARACION'
                      ? 'Preparación'
                      : v.estado === 'EN_CONSIGNACION'
                      ? 'Consignación'
                      : 'Disponible'}
                  </span>

                  {v.reservado && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-lg shadow-orange-950/60 border border-orange-400/40">
                      <BookmarkCheck className="h-3.5 w-3.5" /> Reservado
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                      {v.marca} {v.modelo}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400 uppercase tracking-tight">
                      {v.version || 'Sin versión'} · {v.anio || 'S/A'} · {Number(v.km || 0).toLocaleString('es-AR')} km
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 text-xs font-mono font-bold text-slate-300 shrink-0">
                    {v.patente}
                  </div>
                </div>

                {v.reservado && pwaConfig.showReservationOwner && (
                  <p className="truncate text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-xl">
                    Reserva: {v.reserva_cliente}
                  </p>
                )}

                {/* Precios */}
                <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Valor de venta
                  </span>
                  <div className="text-right">
                    {pwaConfig.showArsPrices && (
                      <p className="text-lg font-black text-white font-mono leading-none">
                        $ {money(v.precio_venta_ars)} ARS
                      </p>
                    )}
                    {pwaConfig.showUsdPrices && (
                      <p className="text-xs font-black text-emerald-400 font-mono mt-1 leading-none">
                        USD {money(v.precio_venta_usd, 2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      <PwaInstallPrompt appType="seller" appName={tenantName} />
      <PwaBottomNav active="stock" />
    </div>
  );
}
