'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function PrestamosClienteView({
  prestamos,
  dolarActual,
  puedeSolicitar,
}: {
  prestamos: any[];
  dolarActual: number;
  puedeSolicitar: boolean;
}) {
  const [expandedPrestamo, setExpandedPrestamo] = useState<number | null>(
    prestamos[0]?.id_prestamo || null
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-amber-400" /> Préstamos Adquiridos
          </h1>
          <p className="text-xs text-slate-400">
            Control de préstamos de dinero, saldos y cuotas canceladas.
          </p>
        </div>

        {puedeSolicitar && (
          <Link
            href="/portal/prestamos/solicitar"
            className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-lg shadow-emerald-500/20 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Solicitar
          </Link>
        )}
      </div>

      {prestamos.length === 0 ? (
        <div className="p-8 text-center bg-slate-850 border border-slate-800 rounded-3xl space-y-3">
          <HandCoins className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-sm font-bold text-white">No tenés préstamos registrados</h2>
          <p className="text-xs text-slate-400">
            Actualmente no registrás préstamos de dinero activos con la concesionaria.
          </p>
          {puedeSolicitar && (
            <div className="pt-2">
              <Link
                href="/portal/prestamos/solicitar"
                className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                Solicitar un préstamo online <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {prestamos.map((p) => {
            const isExpanded = expandedPrestamo === p.id_prestamo;
            const cuotas = p.cuotas || [];
            const pagadas = cuotas.filter((c: any) => c.estado === 'PAGADA');
            const pendientes = cuotas.filter((c: any) => c.estado !== 'PAGADA');
            const pct = cuotas.length > 0 ? Math.round((pagadas.length / cuotas.length) * 100) : 0;

            const saldoPendienteUsd = pendientes.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
            const capitalEntregadoUsd = Number(p.capital_entregado_usd || 0);
            const totalDevolverUsd = Number(p.total_devolver_usd || 0);

            const proximaCuota = pendientes[0] || null;

            return (
              <div
                key={p.id_prestamo}
                className="bg-slate-850 border border-slate-800 rounded-3xl overflow-hidden shadow-lg"
              >
                {/* Header del Préstamo */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Préstamo #{p.id_prestamo}
                      </span>
                      <h2 className="text-base font-black text-white mt-1">
                        Préstamo Personal
                      </h2>
                      <p className="text-xs text-slate-400">
                        Otorgado el {new Date(p.fecha_prestamo).toLocaleDateString('es-AR')}
                      </p>
                    </div>

                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {pct}% completado
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>{pagadas.length} pagadas</span>
                      <span>{pendientes.length} restantes ({cuotas.length} cuotas)</span>
                    </div>
                  </div>

                  {/* Métricas clave */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Capital recibido</p>
                      <DualMoney
                        usd={capitalEntregadoUsd}
                        ars={capitalEntregadoUsd * dolarActual}
                        rate={dolarActual}
                        compact
                        primaryClassName="text-sm font-black text-white mt-1"
                        secondaryClassName="text-[10px] text-slate-400 block"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Saldo pendiente</p>
                      <DualMoney
                        usd={saldoPendienteUsd}
                        ars={saldoPendienteUsd * dolarActual}
                        rate={dolarActual}
                        compact
                        primaryClassName="text-sm font-black text-amber-400 mt-1"
                        secondaryClassName="text-[10px] text-slate-400 block"
                      />
                    </div>
                  </div>

                  {/* Próxima Cuota */}
                  {proximaCuota && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-white">
                            Próxima Cuota #{proximaCuota.numero_cuota}
                          </p>
                          <p className="text-[10px] text-amber-300">
                            Vence el {new Date(proximaCuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-white">
                        USD ${Number(proximaCuota.monto_usd).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedPrestamo(isExpanded ? null : p.id_prestamo)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    {isExpanded ? (
                      <>
                        Ocultar cuotas del préstamo <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Ver cronograma ({cuotas.length} cuotas) <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Detalle de cuotas */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-2 bg-slate-900/60">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
                      Plan de Cuotas del Préstamo
                    </p>

                    {cuotas.map((c: any) => {
                      const isPagada = c.estado === 'PAGADA';
                      const isVencida = !isPagada && new Date(c.fecha_vencimiento) < new Date();

                      return (
                        <div
                          key={c.id_cuota}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isPagada
                              ? 'bg-slate-900/80 border-slate-800/80'
                              : isVencida
                              ? 'bg-red-500/10 border-red-500/20'
                              : 'bg-slate-850 border-slate-750'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isPagada ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            ) : isVencida ? (
                              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-black text-white">
                                Cuota #{c.numero_cuota} de {cuotas.length}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Vencimiento: {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                              </p>
                              {isPagada && c.recibo_nro && (
                                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                  <Receipt className="w-3 h-3" /> Recibo #{c.recibo_nro}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-white">
                              USD ${Number(c.monto_usd).toLocaleString('es-AR')}
                            </p>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                isPagada
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : isVencida
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isPagada ? 'PAGADA' : isVencida ? 'EN MORA' : 'PENDIENTE'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Banner a pestaña de validaciones */}
      <div className="pt-2">
        <Link
          href="/portal/prestamos/validaciones"
          className="p-4 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white">¿Tenés una solicitud en trámite?</p>
              <p className="text-[10px] text-slate-400">Consultá la validación de documentación y resolución</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
        </Link>
      </div>
    </div>
  );
}
