'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registrarPagoCuota, registrarPagoCuotaPrestamo } from '@/actions/cuotas';
import { Banknote, Calendar, CheckCircle2, AlertTriangle, Search, Clock, HandCoins, Car, ChevronDown, ChevronUp, MessageCircle, Printer } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import ModalWhatsAppRecordatorio from '@/components/prestamos/ModalWhatsAppRecordatorio';
import ModalPreguntarImprimirRecibo from '@/components/prestamos/ModalPreguntarImprimirRecibo';

export default function CuotasClient({
  carteraInicial,
  dolarActual,
  tenantName = 'OnlyCars',
}: {
  carteraInicial: any[];
  dolarActual: number;
  tenantName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal para preguntar si desea imprimir el recibo
  const [reciboPrompt, setReciboPrompt] = useState<{
    idCuota: number;
    tipo: 'VENTA' | 'PRESTAMO';
    reciboNro: string;
    clienteNombre: string;
    clienteTelefono?: string;
    numeroCuota: number;
    totalCuotas: number;
    montoArs: number;
    montoUsd: number;
  } | null>(null);

  // Modal de WhatsApp con plantillas prearmadas
  const [cuotaWhatsApp, setCuotaWhatsApp] = useState<{
    cliente: { nombre: string; telefono: string; dni?: string };
    cuota: any;
  } | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const cartera = useMemo(() => carteraInicial.map(op => {
    const pendientes = op.cuotas.filter((c: any) => c.estado === 'PENDIENTE');
    const vencidas = pendientes.filter((c: any) => c.fecha_vto_str && new Date(c.fecha_vto_str) < hoy);
    const deudaUsd = pendientes.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    const pagadoUsd = op.cuotas.filter((c: any) => c.estado === 'PAGADA').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    return {
      ...op,
      resumen: {
        deudaUsd,
        pagadoUsd,
        cantidadPendiente: pendientes.length,
        enMora: vencidas.length > 0,
        proximoVto: pendientes[0]?.fecha_vto_str ? new Date(pendientes[0].fecha_vto_str) : null
      }
    };
  }).filter(op => {
    const q = searchTerm.trim().toLowerCase();
    return !q || `${op.cliente?.nombre_completo || ''} ${op.cliente?.dni || ''} ${op.detalle_operacion || ''} ${op.id_operacion}`.toLowerCase().includes(q);
  }), [carteraInicial, searchTerm, hoy]);

  const totalPendienteUsd = cartera.reduce((s, op) => s + op.resumen.deudaUsd, 0);
  const operacionesEnMora = cartera.filter(op => op.resumen.enMora).length;

  const cobrar = async (cuota: any, tipo: string, op: any) => {
    const montoArs = Number(cuota.monto_usd || 0) * dolarActual;
    if (!confirm(`¿Registrar cobro de $ ${montoArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS (U$S ${Number(cuota.monto_usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })})?`)) return;
    setIsSubmitting(true);
    const res = tipo === 'VENTA'
      ? await registrarPagoCuota(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarActual })
      : await registrarPagoCuotaPrestamo(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarActual });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el cobro.');

    // Preguntar si desea imprimir recibo oficial
    setReciboPrompt({
      idCuota: cuota.id_cuota_real,
      tipo: tipo as 'VENTA' | 'PRESTAMO',
      reciboNro: (res as any).recibo_nro || `REC-${cuota.id_cuota_real}`,
      clienteNombre: op.cliente?.nombre_completo || 'Cliente',
      clienteTelefono: op.cliente?.telefono,
      numeroCuota: cuota.numero_cuota,
      totalCuotas: op.cuotas?.length || 1,
      montoArs,
      montoUsd: Number(cuota.monto_usd || 0),
    });
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Clock className="w-8 h-8 text-[var(--text-primary-default,#FF6600)]" /> Cobranzas y Cuotas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cartera unificada de ventas financiadas y préstamos, en ARS y USD.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Saldo pendiente</p>
          <DualMoney usd={totalPendienteUsd} rate={dolarActual} primaryClassName="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Operaciones abiertas</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{cartera.length}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${operacionesEnMora ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'}`}>
          <p className={`text-xs font-black uppercase tracking-wider ${operacionesEnMora ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>En mora</p>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${operacionesEnMora ? 'text-red-900 dark:text-red-200' : 'text-emerald-900 dark:text-emerald-200'}`}>{operacionesEnMora}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente, DNI, patente, vehículo o número de operación..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5">Cliente / Operación</th>
                <th className="text-left px-5 py-3.5">Saldo</th>
                <th className="text-left px-5 py-3.5">Próximo vencimiento</th>
                <th className="text-center px-5 py-3.5">Cuotas</th>
                <th className="text-right px-5 py-3.5">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {cartera.map(op => (
                <Fragment key={op.id_operacion}>
                  <tr
                    onClick={() => setExpanded(expanded === op.id_operacion ? null : op.id_operacion)}
                    className={`cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${op.resumen.enMora ? 'bg-red-50/25 dark:bg-red-950/20' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900 dark:text-slate-100">{op.cliente?.nombre_completo}</p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1">
                        {op.tipo_operacion === 'VENTA' ? <Car className="w-3.5 h-3.5" /> : <HandCoins className="w-3.5 h-3.5" />}
                        {op.detalle_operacion}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <DualMoney usd={op.resumen.deudaUsd} rate={dolarActual} compact primaryClassName="font-black text-slate-900 dark:text-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      {op.resumen.proximoVto ? (
                        <span className={`font-bold flex items-center gap-2 ${op.resumen.enMora ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          <Calendar className="w-4 h-4" />
                          {op.resumen.proximoVto.toLocaleDateString('es-AR')}
                          {op.resumen.enMora && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Finalizado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                        {op.cuotas.length - op.resumen.cantidadPendiente} / {op.cuotas.length}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {op.cliente?.telefono && (
                          <button
                            onClick={() => {
                              const proximaCuota = op.cuotas.find((c: any) => c.estado === 'PENDIENTE') || op.cuotas[0];
                              setCuotaWhatsApp({
                                cliente: {
                                  nombre: op.cliente.nombre_completo,
                                  telefono: op.cliente.telefono,
                                  dni: op.cliente.dni,
                                },
                                cuota: proximaCuota,
                              });
                            }}
                            title="Enviar aviso por WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setExpanded(expanded === op.id_operacion ? null : op.id_operacion)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {expanded === op.id_operacion ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === op.id_operacion && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/80 dark:bg-slate-800/40 p-4 sm:p-5 border-y border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {op.cuotas.map((c: any) => {
                            const vencida = c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < hoy;
                            const currentArs = Number(c.monto_usd || 0) * dolarActual;
                            const paidArs = Number(c.monto_pagado_ars || 0);
                            return (
                              <div
                                key={c.id_cuota_real}
                                className={`rounded-xl border p-4 bg-white dark:bg-slate-900 shadow-sm ${
                                  vencida
                                    ? 'border-red-200 dark:border-red-800/60'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Cuota #{c.numero_cuota}</p>
                                    <p className={`text-sm font-bold ${vencida ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      Vto. {new Date(c.fecha_vto_str).toLocaleDateString('es-AR')}
                                    </p>
                                  </div>
                                  {c.estado === 'PAGADA' ? (
                                    <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                                  ) : vencida ? (
                                    <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
                                  ) : (
                                    <Clock className="text-slate-300 dark:text-slate-600 w-5 h-5 shrink-0" />
                                  )}
                                </div>
                                <div className="my-3">
                                  <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">
                                    {c.estado === 'PAGADA' ? 'Importe cobrado' : 'Importe a valor de hoy'}
                                  </p>
                                  <DualMoney
                                    ars={c.estado === 'PAGADA' && paidArs > 0 ? paidArs : currentArs}
                                    usd={c.monto_usd}
                                    rate={c.cotizacion_pago || dolarActual}
                                    primaryClassName="text-xl font-black text-slate-900 dark:text-slate-100"
                                  />
                                </div>
                                {c.estado === 'PENDIENTE' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={isSubmitting}
                                      onClick={() => cobrar(c, op.tipo_operacion, op)}
                                      className="flex-1 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                                    >
                                      <Banknote className="w-4 h-4" /> Cobrar
                                    </button>
                                    {op.cliente?.telefono && (
                                      <button
                                        onClick={() => setCuotaWhatsApp({
                                          cliente: {
                                            nombre: op.cliente.nombre_completo,
                                            telefono: op.cliente.telefono,
                                            dni: op.cliente.dni,
                                          },
                                          cuota: c,
                                        })}
                                        title="Aviso WhatsApp para esta cuota"
                                        className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                      Cobrada {c.fecha_pago_str ? new Date(c.fecha_pago_str).toLocaleDateString('es-AR') : ''}
                                    </p>
                                    <button
                                      onClick={() => window.open(`/documentos/recibo-cuota/${c.id_cuota_real}?tipo=${op.tipo_operacion}`, '_blank')}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                                      Recibo
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {cartera.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    No hay operaciones para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reciboPrompt && (
        <ModalPreguntarImprimirRecibo
          isOpen={!!reciboPrompt}
          onClose={() => setReciboPrompt(null)}
          idCuota={reciboPrompt.idCuota}
          tipo={reciboPrompt.tipo}
          reciboNro={reciboPrompt.reciboNro}
          clienteNombre={reciboPrompt.clienteNombre}
          clienteTelefono={reciboPrompt.clienteTelefono}
          numeroCuota={reciboPrompt.numeroCuota}
          totalCuotas={reciboPrompt.totalCuotas}
          montoArs={reciboPrompt.montoArs}
          montoUsd={reciboPrompt.montoUsd}
        />
      )}

      {cuotaWhatsApp && (
        <ModalWhatsAppRecordatorio
          isOpen={!!cuotaWhatsApp}
          onClose={() => setCuotaWhatsApp(null)}
          cliente={cuotaWhatsApp.cliente}
          cuota={{
            numero_cuota: cuotaWhatsApp.cuota.numero_cuota,
            fecha_vencimiento: cuotaWhatsApp.cuota.fecha_vto_str || cuotaWhatsApp.cuota.fecha_vencimiento,
            monto_usd: cuotaWhatsApp.cuota.monto_usd,
            monto_ars: Number(cuotaWhatsApp.cuota.monto_usd || 0) * dolarActual,
          }}
          dolarActual={dolarActual}
          tenantName={tenantName}
        />
      )}
    </div>
  );
}
