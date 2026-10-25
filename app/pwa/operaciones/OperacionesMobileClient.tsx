'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  CalendarClock,
  CarFront,
  ChevronRight,
  PackageCheck,
  ReceiptText,
  Search,
  Truck,
  Handshake,
  Plus,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';

function statusLabel(value: string) {
  return (
    ({
      NUEVO: 'Nuevo',
      CONTACTADO: 'Contactado',
      VISITA_AGENDADA: 'Visita',
      COTIZADO: 'Cotizado',
      NEGOCIACION: 'Negociación',
      PERMUTANDO: 'Permuta',
      RESERVADO: 'Reservado',
      GANADO: 'Vendido',
      PERDIDO: 'Perdido',
    } as Record<string, string>)[value] || value
  );
}

export default function OperacionesMobileClient({ operaciones }: { operaciones: any[] }) {
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return operaciones.filter((o) => {
      const isClosed = Boolean(o.ciclo_cerrado);
      if (filter === 'open' ? isClosed : !isClosed) return false;
      return !q || `${o.nombre} ${o.telefono || ''} ${o.vehiculo} ${o.patente || ''}`.toLowerCase().includes(q);
    });
  }, [operaciones, filter, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans antialiased select-none">
      {/* HEADER NanoLabs */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-4 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700 p-2 flex items-center justify-center text-white shadow-lg shadow-orange-950/50 border border-orange-400/20">
              <Handshake className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 leading-none">
                Ventas Móvil
              </p>
              <h1 className="mt-1 text-xl font-black tracking-tight text-white leading-none">
                Mis Operaciones
              </h1>
            </div>
          </div>

          <Link
            href="/pwa/cotizador"
            className="rounded-xl bg-orange-600 hover:bg-orange-500 px-3 py-2 text-xs font-black text-white shadow-md shadow-orange-950/40 flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Cotizar
          </Link>
        </div>

        {/* Buscador */}
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, vehículo o patente..."
            className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 py-3 pl-10 pr-4 text-xs font-medium text-white placeholder:text-slate-500 outline-none transition-all focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/80"
          />
        </div>
      </header>

      <main className="space-y-4 p-4">
        {/* Switcher En Curso / Finalizadas */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-900 border border-slate-800 p-1.5">
          <button
            onClick={() => setFilter('open')}
            className={`rounded-xl py-2 text-xs font-black transition-all ${
              filter === 'open'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            En curso
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`rounded-xl py-2 text-xs font-black transition-all ${
              filter === 'closed'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Finalizadas
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center space-y-2">
            <Handshake className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="font-bold text-white text-sm">Sin operaciones en esta vista</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Las cotizaciones guardadas aparecen acá y siguen activas hasta perderse o completar la entrega.
            </p>
          </div>
        ) : (
          rows.map((o) => {
            const overdue =
              !o.venta &&
              o.proxima_accion &&
              new Date(o.proxima_accion).getTime() < Date.now() &&
              o.estado !== 'PERDIDO';
            const deliveryState = o.venta?.entrega_estado || null;

            return (
              <Link
                key={o.id_prospecto}
                href={`/pwa/operaciones/${o.id_prospecto}`}
                className="block overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 shadow-xl shadow-black/40 hover:border-slate-700/80 active:scale-[0.99] transition-all group"
              >
                <div className="flex gap-3.5 p-4">
                  <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-850 border border-slate-800 text-slate-600">
                    {o.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.foto} alt={o.vehiculo} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <CarFront className="h-10 w-10 text-slate-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-white group-hover:text-orange-400 transition-colors">
                          {o.nombre}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
                          {o.vehiculo}
                          {o.patente ? ` · ${o.patente}` : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          o.estado === 'RESERVADO'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : o.estado === 'GANADO'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : o.estado === 'PERDIDO'
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {statusLabel(o.estado)}
                      </span>
                    </div>

                    {o.cotizacion && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                        <ReceiptText className="h-3.5 w-3.5 text-orange-400" />
                        $ {Number(o.cotizacion.ars).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/40 px-4 py-2.5">
                  <div
                    className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${
                      overdue
                        ? 'text-red-400'
                        : deliveryState === 'PENDIENTE'
                        ? 'text-purple-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {o.venta ? (
                      deliveryState === 'ENTREGADA' ? (
                        <PackageCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Truck className="h-4 w-4 text-purple-400 shrink-0" />
                      )
                    ) : o.reserva ? (
                      <BookmarkCheck className="h-4 w-4 text-orange-400 shrink-0" />
                    ) : (
                      <CalendarClock className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {o.venta
                        ? deliveryState === 'ENTREGADA'
                          ? 'Venta entregada'
                          : deliveryState === 'PROGRAMADA' && o.venta.entrega_programada
                          ? `Entrega · ${new Date(o.venta.entrega_programada).toLocaleDateString('es-AR')}`
                          : 'Entrega pendiente'
                        : o.reserva
                        ? 'Reserva activa'
                        : o.proxima_accion
                        ? `${overdue ? 'Seguimiento vencido · ' : 'Seguimiento · '}${new Date(o.proxima_accion).toLocaleDateString('es-AR')}`
                        : 'Sin seguimiento agendado'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </main>

      <PwaBottomNav active="operations" />
    </div>
  );
}
