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
  HandCoins,
  Printer,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function CuotasClient({
  ventas = [],
  prestamos = [],
  dolarActual,
  isSoloPrestamos = false,
  habilitarCatalogo = true,
  habilitarPrestamos = true,
  habilitarSolicitudPrestamos = false,
}: {
  ventas?: any[];
  prestamos?: any[];
  dolarActual: number;
  isSoloPrestamos?: boolean;
  habilitarCatalogo?: boolean;
  habilitarPrestamos?: boolean;
  habilitarSolicitudPrestamos?: boolean;
}) {
  const [expandedVenta, setExpandedVenta] = useState<number | null>(
    ventas[0]?.id_venta || null
  );
  const [expandedPrestamo, setExpandedPrestamo] = useState<number | null>(
    prestamos[0]?.id_prestamo || null
  );

  const totalOperaciones = ventas.length + prestamos.length;

  if (totalOperaciones === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6" style={{ color: 'var(--color-brand, #ff6600)' }} /> Mis Planes de Cuotas
        </h1>
        <div className="p-8 sm:p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No tenés planes de cuotas activos</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isSoloPrestamos || !habilitarCatalogo
              ? 'Acá vas a poder consultar el cronograma de vencimientos, cuotas canceladas y comprobantes oficiales de pago.'
              : 'Cuando adquieras un vehículo financiado o accedas a un plan en la agencia, acá vas a poder consultar el estado de cada cuota y comprobantes oficiales.'}
          </p>

          <div className="pt-2">
            {isSoloPrestamos || !habilitarCatalogo ? (
              habilitarSolicitudPrestamos ? (
                <Link
                  href="/portal/prestamos/solicitar"
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95"
                  style={{
                    background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
                  }}
                >
                  <HandCoins className="w-3.5 h-3.5" /> Solicitar nuevo préstamo
                </Link>
              ) : habilitarPrestamos ? (
                <Link
                  href="/portal/prestamos"
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95"
                  style={{
                    background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
                  }}
                >
                  <HandCoins className="w-3.5 h-3.5" /> Consultar mis préstamos
                </Link>
              ) : null
            ) : (
              <Link
                href="/portal/catalogo"
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95"
                style={{
                  background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
                }}
              >
                Ver vehículos disponibles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 truncate">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: 'var(--color-brand, #ff6600)' }} /> Mis Planes de Cuotas
        </h1>
        <p className="text-xs text-slate-400">
          Consulta de pagos realizados, cuotas pendientes y próximos vencimientos.
        </p>
      </div>

      {/* SECCIÓN 1: PRÉSTAMOS FINANCIEROS (CUOTAS DE PRÉSTAMO) */}
      {prestamos.length > 0 && (
        <div className="space-y-3">
          {ventas.length > 0 && (
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 px-1">
              <HandCoins className="w-4 h-4 text-emerald-400" /> Préstamos Financieros
            </h2>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prestamos.map((p) => {
              const isExpanded = expandedPrestamo === p.id_prestamo;
              const cuotas = p.cuotas || [];
              const pagadas = cuotas.filter((c: any) => c.estado === 'PAGADA');
              const pendientes = cuotas.filter((c: any) => c.estado !== 'PAGADA');
              const pct = cuotas.length > 0 ? Math.round((pagadas.length / cuotas.length) * 100) : 0;
              const rate = p.cotizacion_dolar_prestamo || dolarActual;

              const saldoPendienteUsd = pendientes.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
              const pagadoUsd = pagadas.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
              const proximaCuota = pendientes[0] || null;

              return (
                <div
                  key={p.id_prestamo}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                          Préstamo #{p.id_prestamo}
                        </span>
                        <h2 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
                          <HandCoins className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                          Mutuo Dinerario Personal
                        </h2>
                        <p className="text-xs text-slate-400">
                          Emitido el {new Date(p.fecha_prestamo).toLocaleDateString('es-AR')}
                        </p>
                      </div>

                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {pct}% cancelado
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>{pagadas.length} pagadas</span>
                        <span>{pendientes.length} restantes ({cuotas.length} total)</span>
                      </div>
                    </div>

                    {/* Métricas clave (ARS principal, USD secundario) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-400">Saldo pendiente</p>
                        <DualMoney
                          usd={saldoPendienteUsd}
                          ars={saldoPendienteUsd * rate}
                          rate={rate}
                          compact
                          primaryClassName="text-sm font-black text-amber-400 mt-1"
                          secondaryClassName="text-[10px] text-slate-400 block"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-400">Total cancelado</p>
                        <DualMoney
                          usd={pagadoUsd}
                          ars={pagadoUsd * rate}
                          rate={rate}
                          compact
                          primaryClassName="text-sm font-black text-emerald-400 mt-1"
                          secondaryClassName="text-[10px] text-slate-400 block"
                        />
                      </div>
                    </div>

                    {/* Alerta de próxima cuota si hay pendientes */}
                    {proximaCuota && (
                      <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                          <div>
                            <p className="text-xs font-black text-white">
                              Próxima: Cuota #{proximaCuota.numero_cuota}
                            </p>
                            <p className="text-[10px] text-slate-300">
                              Vence el {new Date(proximaCuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-white font-mono block">
                            $ {Math.round(Number(proximaCuota.monto_usd) * rate).toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ≈ U$S {Number(proximaCuota.monto_usd).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <a
                        href={`/documentos/prestamo/${p.id_prestamo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-700/60 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ver Boleto</span>
                      </a>
                      <button
                        onClick={() => setExpandedPrestamo(isExpanded ? null : p.id_prestamo)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-700/60 shadow-sm cursor-pointer"
                      >
                        {isExpanded ? (
                          <>Ocultar detalle <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Ver detalle ({cuotas.length} cuotas) <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Detalle individual de cuotas del préstamo */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 p-4 space-y-2 bg-slate-950/70">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
                        Cronograma de Cuotas del Préstamo
                      </p>

                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                        {cuotas.map((c: any) => {
                          const isPagada = c.estado === 'PAGADA';
                          const isVencida = !isPagada && new Date(c.fecha_vencimiento) < new Date();
                          const montoArs = c.monto_pagado_ars || Math.round(Number(c.monto_usd) * rate);

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
                                  {isPagada && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {c.recibo_nro && (
                                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                          <Receipt className="w-3 h-3" /> Recibo #{c.recibo_nro}
                                        </span>
                                      )}
                                      <a
                                        href={`/documentos/recibo-cuota/${c.id_cuota}?tipo=PRESTAMO`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9.5px] font-bold text-slate-300 hover:text-white underline inline-flex items-center gap-0.5"
                                      >
                                        Ver recibo oficial
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs font-black text-white font-mono">
                                  $ {montoArs.toLocaleString('es-AR')}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  ≈ U$S {Number(c.monto_usd).toLocaleString('es-AR')}
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
      )}

      {/* SECCIÓN 2: PLANES DE CUOTAS VEHICULARES (SI EXISTEN VENTAS) */}
      {ventas.length > 0 && (
        <div className="space-y-3">
          {prestamos.length > 0 && (
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 px-1">
              <Car className="w-4 h-4 text-blue-400" /> Financiación Vehicular
            </h2>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ventas.map((v) => {
              const isExpanded = expandedVenta === v.id_venta;
              const cuotas = v.cuotas || [];
              const pagadas = cuotas.filter((c: any) => c.estado === 'PAGADA');
              const pendientes = cuotas.filter((c: any) => c.estado !== 'PAGADA');
              const pct = cuotas.length > 0 ? Math.round((pagadas.length / cuotas.length) * 100) : 0;

              const saldoPendienteUsd = pendientes.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
              const pagadoUsd = pagadas.reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
              const proximaCuota = pendientes[0] || null;

              return (
                <div
                  key={v.id_venta}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
                >
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

                    <button
                      onClick={() => setExpandedVenta(isExpanded ? null : v.id_venta)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-700/60 shadow-sm cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Ocultar detalle de cuotas <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Ver detalle de las {cuotas.length} cuotas <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  {/* Detalle individual de cuotas */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 p-4 space-y-2 bg-slate-950/70">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
                        Cronograma de Cuotas
                      </p>

                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
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
                                  {isPagada && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {c.recibo_nro && (
                                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                          <Receipt className="w-3 h-3" /> Recibo #{c.recibo_nro}
                                        </span>
                                      )}
                                      <a
                                        href={`/documentos/recibo-cuota/${c.id_cuota}?tipo=VENTA`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9.5px] font-bold text-slate-300 hover:text-white underline inline-flex items-center gap-0.5"
                                      >
                                        Ver recibo oficial
                                      </a>
                                    </div>
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
      )}
    </div>
  );
}
