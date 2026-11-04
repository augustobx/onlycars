'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sliders,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2,
  DollarSign,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { actualizarPlanPrestamo, eliminarPrestamo } from '@/actions/prestamos';

export interface CuotaItem {
  id_cuota?: number;
  numero_cuota: number;
  monto_usd: number;
  monto_pagado_ars?: number | null;
  fecha_vencimiento: string;
  estado: string;
  recibo_nro?: string | null;
}

export interface PrestamoEditable {
  id_prestamo: number;
  id_cliente?: number;
  cliente?: {
    nombre_completo: string;
    dni?: string | null;
    telefono?: string | null;
  };
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar_prestamo: number;
  fecha_prestamo?: string | Date;
  cuotas: CuotaItem[];
}

export type FrecuenciaPlan = 'MENSUAL' | 'SEMANAL' | 'DIARIA' | 'QUINCENAL';

export default function ModalEditarPlanPrestamo({
  isOpen,
  onClose,
  prestamo,
  dolarActual,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  prestamo: PrestamoEditable | null;
  dolarActual: number;
  onSuccess?: () => void;
}) {
  const rate = Number(prestamo?.cotizacion_dolar_prestamo || dolarActual) || 1400;

  // Detección inicial de frecuencia basada en diferencia de días entre cuota 1 y 2
  const initialFrecuencia: FrecuenciaPlan = useMemo(() => {
    if (!prestamo?.cuotas || prestamo.cuotas.length < 2) return 'MENSUAL';
    const d1 = new Date(prestamo.cuotas[0].fecha_vencimiento).getTime();
    const d2 = new Date(prestamo.cuotas[1].fecha_vencimiento).getTime();
    const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'DIARIA';
    if (diffDays >= 6 && diffDays <= 8) return 'SEMANAL';
    if (diffDays >= 13 && diffDays <= 16) return 'QUINCENAL';
    return 'MENSUAL';
  }, [prestamo]);

  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [capitalInput, setCapitalInput] = useState('');
  const [recargoPct, setRecargoPct] = useState('30');
  const [cantidadCuotas, setCantidadCuotas] = useState(12);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPlan>('MENSUAL');
  const [primerVencimiento, setPrimerVencimiento] = useState('');
  const [cuotasPreview, setCuotasPreview] = useState<CuotaItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Identificar cuotas ya pagadas
  const cuotasPagadas = useMemo(() => {
    return prestamo?.cuotas?.filter((c) => c.estado === 'PAGADA') || [];
  }, [prestamo]);

  const tienePagadas = cuotasPagadas.length > 0;

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && prestamo) {
      const capUsd = Number(prestamo.capital_entregado_usd || 0);
      const totUsd = Number(prestamo.total_devolver_usd || 0);
      const capArs = Math.round(capUsd * rate);

      setCapitalInput(String(capArs));
      setMoneda('ARS');

      const recargoCalculado = capUsd > 0 ? Math.round(((totUsd - capUsd) / capUsd) * 100) : 30;
      setRecargoPct(String(Math.max(0, recargoCalculado)));
      setCantidadCuotas(prestamo.cuotas?.length || 12);
      setFrecuencia(initialFrecuencia);

      // Primer vencimiento
      if (prestamo.cuotas?.[0]?.fecha_vencimiento) {
        setPrimerVencimiento(
          new Date(prestamo.cuotas[0].fecha_vencimiento).toISOString().slice(0, 10)
        );
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        setPrimerVencimiento(d.toISOString().slice(0, 10));
      }

      setErrorMsg('');
    }
  }, [isOpen, prestamo, rate, initialFrecuencia]);

  // Recalcular cuotas cuando cambian los parámetros
  useEffect(() => {
    if (!isOpen || !prestamo || !primerVencimiento) return;

    const montoVal = Number(capitalInput) || 0;
    const capUsd = moneda === 'ARS' ? (rate > 0 ? montoVal / rate : 0) : montoVal;
    const rec = Math.max(0, Number(recargoPct) || 0) / 100;
    const totUsd = capUsd * (1 + rec);
    const nCuotas = Math.max(1, Number(cantidadCuotas) || 1);

    const [y, m, d] = primerVencimiento.split('-').map(Number);
    const baseDate = new Date(Date.UTC(y, m - 1, d, 12));

    if (!tienePagadas) {
      // Reestructuración completa libre
      const cuotaUsd = Math.round((totUsd / nCuotas) * 100) / 100;
      const preview: CuotaItem[] = Array.from({ length: nCuotas }).map((_, idx) => {
        let vtoDate: Date;
        if (frecuencia === 'DIARIA') {
          vtoDate = new Date(baseDate.getTime() + idx * 24 * 60 * 60 * 1000);
        } else if (frecuencia === 'SEMANAL') {
          vtoDate = new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000);
        } else if (frecuencia === 'QUINCENAL') {
          vtoDate = new Date(baseDate.getTime() + idx * 14 * 24 * 60 * 60 * 1000);
        } else {
          vtoDate = new Date(Date.UTC(y, m - 1 + idx, d, 12));
        }

        return {
          numero_cuota: idx + 1,
          monto_usd: cuotaUsd,
          fecha_vencimiento: vtoDate.toISOString(),
          estado: 'PENDIENTE',
        };
      });
      setCuotasPreview(preview);
    } else {
      // Tiene cuotas pagadas: conservar pagadas y generar el resto
      const pagadas = prestamo.cuotas.filter((c) => c.estado === 'PAGADA');
      const montoPagadoUsd = pagadas.reduce((s, c) => s + Number(c.monto_usd || 0), 0);
      const remanenteUsd = Math.max(0, totUsd - montoPagadoUsd);
      const cuotasRestantesCount = Math.max(1, nCuotas - pagadas.length);
      const cuotaRemanenteUsd = Math.round((remanenteUsd / cuotasRestantesCount) * 100) / 100;

      const nuevasPendientes: CuotaItem[] = Array.from({ length: cuotasRestantesCount }).map((_, idx) => {
        const offsetIndex = pagadas.length + idx;
        let vtoDate: Date;
        if (frecuencia === 'DIARIA') {
          vtoDate = new Date(baseDate.getTime() + offsetIndex * 24 * 60 * 60 * 1000);
        } else if (frecuencia === 'SEMANAL') {
          vtoDate = new Date(baseDate.getTime() + offsetIndex * 7 * 24 * 60 * 60 * 1000);
        } else if (frecuencia === 'QUINCENAL') {
          vtoDate = new Date(baseDate.getTime() + offsetIndex * 14 * 24 * 60 * 60 * 1000);
        } else {
          vtoDate = new Date(Date.UTC(y, m - 1 + offsetIndex, d, 12));
        }

        return {
          numero_cuota: offsetIndex + 1,
          monto_usd: cuotaRemanenteUsd,
          fecha_vencimiento: vtoDate.toISOString(),
          estado: 'PENDIENTE',
        };
      });

      setCuotasPreview([...pagadas, ...nuevasPendientes]);
    }
  }, [isOpen, prestamo, capitalInput, recargoPct, cantidadCuotas, frecuencia, primerVencimiento, moneda, rate, tienePagadas]);

  if (!isOpen || !prestamo) return null;

  const montoVal = Number(capitalInput) || 0;
  const capUsdCalc = moneda === 'ARS' ? (rate > 0 ? montoVal / rate : 0) : montoVal;
  const capArsCalc = moneda === 'ARS' ? montoVal : capUsdCalc * rate;
  const recCalc = Math.max(0, Number(recargoPct) || 0) / 100;
  const totUsdCalc = capUsdCalc * (1 + recCalc);
  const totArsCalc = capArsCalc * (1 + recCalc);

  const handleGuardar = async () => {
    if (capUsdCalc <= 0) {
      setErrorMsg('Ingresá un capital válido.');
      return;
    }
    if (cuotasPreview.length === 0) {
      setErrorMsg('El plan debe contener al menos 1 cuota.');
      return;
    }

    setGuardando(true);
    setErrorMsg('');

    const res = await actualizarPlanPrestamo({
      id_prestamo: prestamo.id_prestamo,
      capital_entregado_usd: Number(capUsdCalc.toFixed(2)),
      total_devolver_usd: Number(totUsdCalc.toFixed(2)),
      cotizacion_dolar: rate,
      cuotas: cuotasPreview.map((c) => ({
        id_cuota: c.id_cuota,
        numero_cuota: c.numero_cuota,
        monto_usd: Number(c.monto_usd),
        fecha_vencimiento: c.fecha_vencimiento,
        estado: c.estado,
      })),
    });

    setGuardando(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Error al actualizar el préstamo.');
      return;
    }

    onSuccess?.();
    onClose();
  };

  const handleEliminarPrestamo = async () => {
    if (tienePagadas) {
      alert('No podés eliminar un préstamo que ya tiene cuotas pagadas.');
      return;
    }
    const seguro = confirm(
      `¿Estás seguro de eliminar por completo el Préstamo #${prestamo.id_prestamo}? Esta acción no se puede deshacer.`
    );
    if (!seguro) return;

    setEliminando(true);
    setErrorMsg('');
    const res = await eliminarPrestamo(prestamo.id_prestamo);
    setEliminando(false);

    if (!res.success) {
      setErrorMsg(res.error || 'No se pudo eliminar el préstamo.');
      return;
    }

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* ENCABEZADO */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-default,#FF6600)]/10 text-[var(--color-primary-default,#FF6600)] border border-[var(--color-primary-default,#FF6600)]/20 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-[var(--color-primary-default,#FF6600)] block">
                Reestructuración & Edición de Plan
              </span>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight">
                Préstamo #{prestamo.id_prestamo} · {prestamo.cliente?.nombre_completo || 'Cliente'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL MODAL (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ESTADO DE CUOTAS COBRADAS */}
          {tienePagadas ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-black flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Atención: Préstamo con {cuotasPagadas.length} cuota(s) ya cobrada(s)
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Las cuotas pagadas se mantendrán intactas para proteger los recibos y asientos de caja.
                El nuevo plan y cantidad de cuotas reamortizará el saldo restante pendiente.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[11px] font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sin cobros registrados aún: podés cambiar cantidad de cuotas, frecuencia, fechas y capital libremente.</span>
            </div>
          )}

          {/* CAPITAL Y MONEDA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Capital Entregado
              </label>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                <button
                  type="button"
                  onClick={() => {
                    if (moneda !== 'ARS') {
                      setMoneda('ARS');
                      setCapitalInput(String(Math.round(capArsCalc)));
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded-md transition ${
                    moneda === 'ARS'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  ARS ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (moneda !== 'USD') {
                      setMoneda('USD');
                      setCapitalInput(String(Number(capUsdCalc.toFixed(2))));
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded-md transition ${
                    moneda === 'USD'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  USD (U$S)
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 font-black text-slate-400">
                {moneda === 'ARS' ? '$' : 'U$S'}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                placeholder="Monto de capital..."
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Ref: {moneda === 'ARS' ? `≈ U$S ${capUsdCalc.toFixed(2)}` : `≈ $ ${Math.round(capArsCalc).toLocaleString('es-AR')}`} (TC: $ {rate})
            </p>
          </div>

          {/* RECARGO / INTERÉS Y CANTIDAD DE CUOTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Recargo / Interés Total (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={recargoPct}
                  onChange={(e) => setRecargoPct(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                />
                <span className="absolute right-3 top-2.5 font-black text-slate-400">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Cantidad de Cuotas
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={cantidadCuotas}
                onChange={(e) => setCantidadCuotas(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
              />
            </div>
          </div>

          {/* SELECTOR DE FRECUENCIA DE PAGO (DIARIA, SEMANAL, MENSUAL, QUINCENAL) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Frecuencia de las Cuotas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'MENSUAL', label: '📅 Mensual', desc: 'Cada 30 días' },
                { id: 'SEMANAL', label: '🗓️ Semanal', desc: 'Cada 7 días' },
                { id: 'DIARIA', label: '⏱️ Diaria', desc: 'Cada 1 día' },
                { id: 'QUINCENAL', label: '📆 Quincenal', desc: 'Cada 14 días' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrecuencia(f.id as FrecuenciaPlan)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    frecuencia === f.id
                      ? 'border-[var(--color-primary-default,#FF6600)] bg-[var(--color-primary-default,#FF6600)]/10 text-[var(--color-primary-default,#FF6600)] font-black shadow-xs ring-1 ring-[var(--color-primary-default,#FF6600)]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[11px] font-black leading-tight">{f.label}</span>
                  <span className="block text-[9px] opacity-70 font-medium">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PRIMER VENCIMIENTO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Fecha del Primer Vencimiento
            </label>
            <input
              type="date"
              value={primerVencimiento}
              onChange={(e) => setPrimerVencimiento(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
            />
          </div>

          {/* TOTALES EN VIVO */}
          <div className="bg-slate-950 text-white rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-3 text-center border border-slate-800">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Capital a Entregar</span>
              <strong className="text-sm font-black text-white block">$ {Math.round(capArsCalc).toLocaleString('es-AR')}</strong>
              <span className="text-[9px] text-slate-400 font-mono">U$S {capUsdCalc.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total a Devolver</span>
              <strong className="text-sm font-black text-emerald-400 block">$ {Math.round(totArsCalc).toLocaleString('es-AR')}</strong>
              <span className="text-[9px] text-emerald-300 font-mono">U$S {totUsdCalc.toFixed(2)}</span>
            </div>
          </div>

          {/* VISTA PREVIA DEL CRONOGRAMA RECALCULADO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Nuevo Cronograma ({cuotasPreview.length} cuotas {frecuencia.toLowerCase()}s)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {cuotasPreview.length} cuotas consecutivas
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {cuotasPreview.map((c) => {
                const isPagada = c.estado === 'PAGADA';
                const ars = Math.round(c.monto_usd * rate);
                const fechaStr = new Date(c.fecha_vencimiento).toLocaleDateString('es-AR');
                return (
                  <div
                    key={c.numero_cuota}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs ${
                      isPagada ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-slate-100">#{c.numero_cuota}</span>
                      <span className="text-slate-500 text-[11px] font-medium">{fechaStr}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 dark:text-slate-100 block leading-tight">
                          $ {ars.toLocaleString('es-AR')}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 block leading-tight">
                          U$S {Number(c.monto_usd).toFixed(2)}
                        </span>
                      </div>
                      <span
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isPagada
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isPagada ? 'PAGADA' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ZONA DE PELIGRO: ELIMINAR PRÉSTAMO (SOLO SI NO TIENE PAGOS) */}
          {!tienePagadas && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">¿El préstamo se generó por error?</span>
              <button
                type="button"
                onClick={handleEliminarPrestamo}
                disabled={eliminando || guardando}
                className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Eliminar Préstamo</span>
              </button>
            </div>
          )}
        </div>

        {/* PIE DE ACCIONES (FOOTER FIJO SIEMPRE VISIBLE) */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando || eliminando}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || eliminando || capUsdCalc <= 0}
            className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando Plan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Nuevo Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

