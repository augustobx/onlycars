'use client';

import Link from 'next/link';
import { ArrowLeft, Receipt, Calendar, CarFront, UserRound, CheckCircle2, AlertTriangle, TrendingUp, MapPin, Phone, Mail, Printer, Truck } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function VentaDetalleClient({ venta }: { venta: any }) {
  const rate = Number(venta.cotizacion_dolar_venta || 0);
  const finalUsd = Number(venta.precio_final_usd || 0);
  const finalArs = finalUsd * rate;
  const costUsd = Number(venta.vehiculo?.precio_compra_usd || 0);
  const costArs = Number(venta.vehiculo?.precio_compra_ars || 0) || costUsd * rate;
  const marginUsd = finalUsd - costUsd - Number(venta.valor_toma_permuta_usd || 0);
  const marginArs = marginUsd * rate;
  const isFinanced = venta.forma_pago === 'Cuotas';
  const paidInstallments = venta.cuotas.filter((c: any) => c.estado === 'PAGADA').length;
  const pendingUsd = venta.cuotas.filter((c: any) => c.estado === 'PENDIENTE').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {venta.numero_boleto || `Operación #${venta.id_venta}`}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${isFinanced ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                {venta.forma_pago}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {new Date(venta.fecha_venta).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/documentos/boleto/${venta.id_venta}`} target="_blank" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Printer className="w-4 h-4" /> Boleto
          </Link>
          <Link href="/ventas" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-1 bg-slate-950 text-white rounded-2xl p-5 space-y-5 border border-slate-800 shadow-md">
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Valor final</p>
            <DualMoney ars={finalArs} usd={finalUsd} rate={rate} primaryClassName="text-3xl font-black text-white" secondaryClassName="text-sm font-bold text-slate-400" />
            <p className="text-[10px] text-slate-400 mt-1">TC histórico $ {rate.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Costo inventario</p>
              <DualMoney ars={costArs} usd={costUsd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Margen bruto estimado</p>
              <DualMoney ars={marginArs} usd={marginUsd} rate={rate} primaryClassName={`font-black ${marginArs >= 0 ? 'text-emerald-300' : 'text-red-300'}`} secondaryClassName="text-xs text-slate-400" />
            </div>
          </div>
          {Number(venta.valor_toma_permuta_usd || 0) > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4">
              <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Permuta tomada</p>
              <DualMoney usd={venta.valor_toma_permuta_usd} rate={rate} primaryClassName="font-black text-amber-100" secondaryClassName="text-xs text-amber-300" />
            </div>
          )}
          {isFinanced && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 p-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Anticipo</p>
                <DualMoney usd={venta.anticipo_usd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Saldo financiado</p>
                <DualMoney usd={venta.saldo_financiado_usd || pendingUsd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-indigo-300" />
              </div>
            </div>
          )}
        </section>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <CarFront className="w-4 h-4 text-indigo-500" /> Vehículo
              </h2>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-4">
                {venta.vehiculo?.marca} {venta.vehiculo?.modelo}
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Patente: <strong className="uppercase text-slate-900 dark:text-slate-100">{venta.vehiculo?.patente || 'S/P'}</strong></p>
                <p>Año: <strong className="text-slate-900 dark:text-slate-100">{venta.vehiculo?.anio || 'S/A'}</strong></p>
                <p>Km: <strong className="text-slate-900 dark:text-slate-100">{Number(venta.vehiculo?.km || 0).toLocaleString('es-AR')}</strong></p>
              </div>
              <Link href={`/vehiculos/${venta.id_vehiculo}`} className="inline-block mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline">
                Abrir ficha 360° →
              </Link>
            </section>

            <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <UserRound className="w-4 h-4 text-indigo-500" /> Comprador
              </h2>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-4">
                {venta.cliente?.nombre_completo}
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>DNI: <strong className="text-slate-900 dark:text-slate-100">{venta.cliente?.dni || 'S/N'}</strong></p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" /> {venta.cliente?.telefono || 'Sin teléfono'}</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> {venta.cliente?.email || 'Sin email'}</p>
                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> {venta.cliente?.domicilio || 'Sin domicilio'}</p>
              </div>
            </section>
          </div>

          {venta.entrega && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h2 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Entrega
              </h2>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-3">Estado: {venta.entrega.estado}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {venta.entrega.fecha_programada ? new Date(venta.entrega.fecha_programada).toLocaleString('es-AR') : 'Sin fecha programada'}
              </p>
            </section>
          )}

          {isFinanced && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
                <h2 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Plan de pagos
                </h2>
                <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {paidInstallments}/{venta.cuotas.length} pagas
                </span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[580px]">
                  <thead className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="text-left px-4 py-3 w-16">Cuota</th>
                      <th className="text-left px-4 py-3 w-28">Vencimiento</th>
                      <th className="text-right px-4 py-3 w-40">Importe</th>
                      <th className="text-center px-4 py-3 w-32">Estado</th>
                      <th className="text-right px-4 py-3 w-44">Cobro histórico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {venta.cuotas.map((c: any) => {
                      const overdue = c.estado === 'PENDIENTE' && new Date(c.fecha_vencimiento) < new Date();
                      const paymentRate = Number(c.cotizacion_pago || rate);
                      const expectedArs = Number(c.monto_usd || 0) * rate;
                      return (
                        <tr
                          key={c.id_cuota}
                          className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                            c.estado === 'PAGADA'
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/15'
                              : overdue
                              ? 'bg-red-50/20 dark:bg-red-950/15'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-black text-slate-900 dark:text-slate-100">#{c.numero_cuota}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                            {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DualMoney ars={expectedArs} usd={c.monto_usd} rate={rate} compact primaryClassName="font-black text-slate-900 dark:text-slate-100" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.estado === 'PAGADA' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-black text-xs inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3.5 h-3.5" /> PAGADA
                              </span>
                            ) : overdue ? (
                              <span className="text-red-700 dark:text-red-400 font-black text-xs inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200/50 dark:border-red-800/40">
                                <AlertTriangle className="w-3.5 h-3.5" /> VENCIDA
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-black text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                PENDIENTE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.estado === 'PAGADA' ? (
                              <div>
                                <DualMoney ars={c.monto_pagado_ars} usd={c.monto_usd} rate={paymentRate} compact primaryClassName="font-black text-emerald-700 dark:text-emerald-400" />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">TC $ {paymentRate.toLocaleString('es-AR')}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
