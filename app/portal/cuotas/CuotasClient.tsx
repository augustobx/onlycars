'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function CuotasClient({
  ventas,
  dolarActual,
}: {
  ventas: any[];
  dolarActual: number;
}) {
  const [expandedVenta, setExpandedVenta] = useState<number | null>(
    ventas[0]?.id_venta || null
  );

  if (ventas.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6" style={{ color: 'var(--color-brand, #ff6600)' }} /> Mis Planes de Cuotas
        </h1>
        <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No tenés planes de cuotas activos</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cuando adquieras un vehículo financiado en la agencia, acá vas a poder consultar el estado de cada cuota y comprobantes oficiales.
          </p>
          <div className="pt-2">
            <Link
              href="/portal/catalogo"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95"
              style={{
                background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
              }}
            >
              Ver vehículos disponibles <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 truncate">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: 'var(--color-brand, #ff6600)' }} /> Mis Planes de Cuotas
        </h1>
        <p className="text-xs text-slate-400">
          Consulta de pagos realizados, cuotas pendientes y próximos vencimientos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ventas.map((v) => {
          const isExpanded = expandedVenta === v.id_venta;
          const cuotas = v.cuotas || [];
          const pagadas = cuotas.filter((c: any) => c.estado === 'PAGADA');
          const pendientes = cuotas.filter((c: any) => c.estado !== 'PAGADA');
          const pct = cuotas.length > 0 ? Math.round((pagadas.length / cuotas.length) * 100) : 0;

          const saldoPendienteUsd = pendientes.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
          const pagadoUsd = pagadas.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);

          // Próxima cuota a vencer
          const proximaCuota = pendientes[0] || null;

          return (
            <div
              key={v.id_venta}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
            >
              {/* Header de la operación */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Operación #{v.id_venta}
                    </span>
                    <h2 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
                      <Car className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-brand, #ff6600)' }} />
                      {v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : 'Vehículo financiado'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {v.vehiculo?.version || ''} {v.vehiculo?.anio ? `· ${v.vehiculo.anio}` : ''}
                    </p>
                  </div>

                  <span
                    className="text-[10px] font-black px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: 'var(--color-brand, #ff6600)',
                      backgroundColor: 'var(--color-brand-ring, rgba(255,102,0,0.15))',
                      color: 'var(--color-brand, #ff6600)',
                    }}
                  >
                    {pct}% pagado
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{pagadas.length} pagadas</span>
                    <span>{pendientes.length} restantes ({cuotas.length} total)</span>
                  </div>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
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

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400">Total cancelado</p>
                    <DualMoney
                      usd={pagadoUsd}
                      ars={pagadoUsd * dolarActual}
                      rate={dolarActual}
                      compact
                      primaryClassName="text-sm font-black text-emerald-400 mt-1"
                      secondaryClassName="text-[10px] text-slate-400 block"
                    />
                  </div>
                </div>

                {/* Alerta de próxima cuota si hay pendientes */}
                {proximaCuota && (
                  <div
                    className="p-3 rounded-2xl border flex items-center justify-between shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-brand-ring, rgba(255,102,0,0.12))',
                      borderColor: 'var(--color-brand, #ff6600)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-brand, #ff6600)' }} />
                      <div>
                        <p className="text-xs font-black text-white">
                          Próxima: Cuota #{proximaCuota.numero_cuota}
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Vence el {new Date(proximaCuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white font-mono">
                      USD ${Number(proximaCuota.monto_usd).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                {/* Botón expandir/colapsar cuotas */}
                <button
                  onClick={() => setExpandedVenta(isExpanded ? null : v.id_venta)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-700/60 shadow-sm"
                >
                  {isExpanded ? (
                    <>
                      Ocultar detalle de cuotas <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Ver detalle de las {cuotas.length} cuotas <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Detalle individual de cuotas */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-4 space-y-2 bg-slate-950/70">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
                    Cronograma de Cuotas
                  </p>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {cuotas.map((c: any) => {
                      const isPagada = c.estado === 'PAGADA';
                      const isVencida = !isPagada && new Date(c.fecha_vencimiento) < new Date();

                      return (
                        <div
                          key={c.id_cuota}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isPagada
                              ? 'bg-slate-900/80 border-slate-800'
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
                                Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                              </p>
                              {isPagada && c.recibo_nro && (
                                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                  <Receipt className="w-3 h-3" /> Recibo #{c.recibo_nro}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-white font-mono">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
