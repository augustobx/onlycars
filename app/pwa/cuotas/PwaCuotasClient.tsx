'use client';

import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  DollarSign,
  Loader2,
  Check,
  X,
  FileText,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import ModalWhatsAppRecordatorio from '@/components/prestamos/ModalWhatsAppRecordatorio';
import { registrarPagoCuota, registrarPagoCuotaPrestamo } from '@/actions/cuotas';
import { useRouter } from 'next/navigation';

export interface PwaCuotaItem {
  id_cuota_real: number;
  tipo_origen: 'VENTA' | 'PRESTAMO';
  id_operacion: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_dni: string;
  detalle_unidad: string;
  numero_cuota: number;
  total_cuotas: number;
  monto_usd: number;
  monto_pagado_ars: number | null;
  cotizacion_pago: number | null;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: string;
  recibo_nro: string | null;
}

export default function PwaCuotasClient({
  cuotasIniciales,
  dolarActual,
  tenantName,
  tenantCuit,
}: {
  cuotasIniciales: PwaCuotaItem[];
  dolarActual: number;
  tenantName: string;
  tenantCuit?: string;
}) {
  const router = useRouter();
  const [cuotas, setCuotas] = useState(cuotasIniciales);
  const [filtro, setFiltro] = useState<'TODAS' | 'VENCE_HOY' | 'VENCIDAS' | 'PENDIENTES' | 'PAGADAS'>('VENCIDAS');
  const [busqueda, setBusqueda] = useState('');

  // Modal de aviso WhatsApp prearmado
  const [cuotaAvisar, setCuotaAvisar] = useState<any | null>(null);

  // Modal de cobro rápido
  const [cuotaACobrar, setCuotaACobrar] = useState<PwaCuotaItem | null>(null);
  const [cotizacionDia, setCotizacionDia] = useState(String(dolarActual));
  const [montoCobradoArs, setMontoCobradoArs] = useState('');
  const [procesando, setProcesando] = useState(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Cuotas enriquecidas con flag de vencida, vence hoy y días de atraso
  const cuotasCalculadas = useMemo(() => {
    return cuotas.map((c) => {
      const vtoDate = new Date(c.fecha_vencimiento);
      vtoDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((hoy.getTime() - vtoDate.getTime()) / (1000 * 60 * 60 * 24));
      const isVencida = c.estado === 'PENDIENTE' && diffDays > 0;
      const isHoy = c.estado === 'PENDIENTE' && diffDays === 0;
      return { ...c, isVencida, isHoy, diasMora: Math.max(0, diffDays) };
    });
  }, [cuotas, hoy]);

  // Contadores
  const totalVencidas = useMemo(() => cuotasCalculadas.filter((c) => c.isVencida).length, [cuotasCalculadas]);
  const totalVenceHoy = useMemo(() => cuotasCalculadas.filter((c) => c.isHoy).length, [cuotasCalculadas]);
  const totalPendientes = useMemo(() => cuotasCalculadas.filter((c) => c.estado === 'PENDIENTE').length, [cuotasCalculadas]);
  const totalPagadas = useMemo(() => cuotasCalculadas.filter((c) => c.estado === 'PAGADA').length, [cuotasCalculadas]);

  // Suma a cobrar (pendientes) en USD
  const totalACobrarUsd = useMemo(
    () => cuotasCalculadas.filter((c) => c.estado === 'PENDIENTE').reduce((sum, c) => sum + c.monto_usd, 0),
    [cuotasCalculadas]
  );

  // Filtrado
  const cuotasFiltradas = useMemo(() => {
    let list = cuotasCalculadas;
    if (filtro === 'VENCE_HOY') list = list.filter((c) => c.isHoy);
    if (filtro === 'VENCIDAS') list = list.filter((c) => c.isVencida);
    if (filtro === 'PENDIENTES') list = list.filter((c) => c.estado === 'PENDIENTE' && !c.isVencida && !c.isHoy);
    if (filtro === 'PAGADAS') list = list.filter((c) => c.estado === 'PAGADA');

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.cliente_nombre.toLowerCase().includes(term) ||
          c.cliente_dni.toLowerCase().includes(term) ||
          c.detalle_unidad.toLowerCase().includes(term) ||
          c.id_operacion.toLowerCase().includes(term)
      );
    }
    return list;
  }, [cuotasCalculadas, filtro, busqueda]);

  const abrirModalCobro = (item: PwaCuotaItem) => {
    setCuotaACobrar(item);
    const rate = Number(cotizacionDia) || dolarActual;
    setMontoCobradoArs(String(Math.round(item.monto_usd * rate)));
  };

  const confirmarCobro = async () => {
    if (!cuotaACobrar) return;
    const montoArs = Number(montoCobradoArs);
    const rate = Number(cotizacionDia);
    if (montoArs <= 0 || rate <= 0) return alert('Verificá monto y cotización.');

    setProcesando(true);
    let res;
    if (cuotaACobrar.tipo_origen === 'VENTA') {
      res = await registrarPagoCuota(cuotaACobrar.id_cuota_real, {
        monto_cobrado_ars: montoArs,
        cotizacion_dia: rate,
      });
    } else {
      res = await registrarPagoCuotaPrestamo(cuotaACobrar.id_cuota_real, {
        monto_cobrado_ars: montoArs,
        cotizacion_dia: rate,
      });
    }
    setProcesando(false);

    if (!res.success) {
      alert(res.error || 'No se pudo procesar el cobro.');
      return;
    }

    // Actualizar localmente
    setCuotas((prev) =>
      prev.map((c) =>
        c.id_cuota_real === cuotaACobrar.id_cuota_real && c.tipo_origen === cuotaACobrar.tipo_origen
          ? {
              ...c,
              estado: 'PAGADA',
              monto_pagado_ars: montoArs,
              cotizacion_pago: rate,
              fecha_pago: new Date().toISOString(),
              recibo_nro: res.recibo_nro || null,
            }
          : c
      )
    );

    setCuotaACobrar(null);
    router.refresh();
  };

  const limpiarTelefono = (tel: string) => tel.replace(/\D/g, '');

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 pb-24 select-none">
      {/* HEADER MÓVIL CON PROTECCIÓN DE NOTCH / DYNAMIC ISLAND EN IPHONE */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 pb-3 shadow-xs"
        style={{
          paddingTop: 'max(14px, calc(env(safe-area-inset-top, 0px) + 12px))',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Revisión de Cuotas</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{tenantName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Dólar Hoy</span>
            <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              $ {dolarActual.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
            <p className="text-[9px] uppercase font-black text-slate-400">A Cobrar</p>
            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">$ {Math.round(totalACobrarUsd * dolarActual).toLocaleString('es-AR')}</p>
            <p className="text-[9px] font-bold text-slate-400 font-mono">U$S {Math.round(totalACobrarUsd).toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-red-50 p-2 rounded-xl text-center border border-red-100">
            <p className="text-[9px] uppercase font-black text-red-600">Vencidas</p>
            <p className="text-xs font-black text-red-700 font-mono mt-0.5">{totalVencidas}</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl text-center border border-emerald-100">
            <p className="text-[9px] uppercase font-black text-emerald-600">Pagadas</p>
            <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">{totalPagadas}</p>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, DNI o unidad..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* TABS DE FILTRO */}
        <div className="flex gap-1 mt-2.5 overflow-x-auto no-scrollbar">
          {totalVenceHoy > 0 && (
            <button
              onClick={() => setFiltro('VENCE_HOY')}
              className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
                filtro === 'VENCE_HOY' ? 'bg-amber-600 text-white shadow-xs animate-pulse' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              ⏰ Vencen Hoy ({totalVenceHoy})
            </button>
          )}
          <button
            onClick={() => setFiltro('VENCIDAS')}
            className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
              filtro === 'VENCIDAS' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Vencidas ({totalVencidas})
          </button>
          <button
            onClick={() => setFiltro('PENDIENTES')}
            className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
              filtro === 'PENDIENTES' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            A vencer ({totalPendientes - totalVencidas - totalVenceHoy})
          </button>
          <button
            onClick={() => setFiltro('TODAS')}
            className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
              filtro === 'TODAS' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Todas ({cuotas.length})
          </button>
          <button
            onClick={() => setFiltro('PAGADAS')}
            className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
              filtro === 'PAGADAS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Cobradas ({totalPagadas})
          </button>
        </div>
      </div>

      {/* LISTADO DE CUOTAS (TARJETAS MÓVILES) */}
      <div className="p-3 space-y-3">
        {cuotasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No se encontraron cuotas</p>
            <p className="text-xs text-slate-400 mt-1">Probá cambiando el filtro o la búsqueda.</p>
          </div>
        ) : (
          cuotasFiltradas.map((c) => {
            const vtoDate = new Date(c.fecha_vencimiento);
            const fechaFormateada = vtoDate.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const montoArsEstimado = Math.round(c.monto_usd * dolarActual);
            const telLimpio = limpiarTelefono(c.cliente_telefono);

            const mensajeWp = encodeURIComponent(
              `Hola ${c.cliente_nombre}, te escribimos de ${tenantName} recordándote el vencimiento de la cuota ${c.numero_cuota}/${c.total_cuotas} por $ ${montoArsEstimado.toLocaleString('es-AR')} (U$S ${c.monto_usd}). ¿Te gustaría coordinar el pago hoy?`
            );

            return (
              <div
                key={`${c.tipo_origen}-${c.id_cuota_real}`}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                  c.isVencida ? 'border-red-300 bg-red-50/20' : c.estado === 'PAGADA' ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                {/* ENCABEZADO DE TARJETA */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        c.tipo_origen === 'VENTA' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {c.tipo_origen === 'VENTA' ? 'Vehículo' : 'Préstamo'} · {c.id_operacion}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm mt-1">{c.cliente_nombre}</h3>
                    {c.cliente_dni && <p className="text-[10px] text-slate-400 font-medium">DNI/CUIT: {c.cliente_dni}</p>}
                  </div>

                  {c.estado === 'PAGADA' ? (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Cobrada
                    </span>
                  ) : c.isVencida ? (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-full shrink-0">
                      <AlertCircle className="w-3 h-3" /> Vencida
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                      Pendiente
                    </span>
                  )}
                </div>

                {/* DETALLE Y FECHA */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{c.detalle_unidad}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Cuota {c.numero_cuota} de {c.total_cuotas}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Vencimiento</span>
                    <span className={`font-mono text-xs font-black ${c.isVencida ? 'text-red-700 font-bold' : 'text-slate-800'}`}>
                      {fechaFormateada}
                    </span>
                  </div>
                </div>

                {/* IMPORTES (ARS EN FOCO, USD SECUNDARIO) */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">
                      {c.estado === 'PAGADA' ? 'Importe Pagado' : 'Importe a Cobrar'}
                    </span>
                    <strong className="text-base font-black text-slate-900 font-mono">
                      $ {(c.monto_pagado_ars || montoArsEstimado).toLocaleString('es-AR')}
                    </strong>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      ≈ U$S {c.monto_usd.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-slate-400 block">
                      Ref. Contable
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                      U$S {c.monto_usd.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {telLimpio && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCuotaAvisar(c)}
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-95 transition-all"
                        title="Avisos y Plantillas de WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <a
                        href={`tel:${telLimpio}`}
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  {c.estado === 'PENDIENTE' ? (
                    <button
                      onClick={() => abrirModalCobro(c)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <DollarSign className="w-4 h-4" /> Cobrar Cuota
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-end text-[11px] font-bold text-slate-500 gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.recibo_nro || 'Cobrada'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL MÓVIL DE COBRO (BOTTOM SHEET / DIALOG) */}
      {cuotaACobrar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Registrar Cobro de Cuota</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {cuotaACobrar.cliente_nombre} · Cuota {cuotaACobrar.numero_cuota}/{cuotaACobrar.total_cuotas}
                </p>
              </div>
              <button
                onClick={() => setCuotaACobrar(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Monto pactado:</span>
                <div className="text-right">
                  <strong className="text-emerald-700 font-mono font-black text-sm block">
                    $ {Math.round(cuotaACobrar.monto_usd * (Number(cotizacionDia) || dolarActual)).toLocaleString('es-AR')}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-mono">≈ U$S {cuotaACobrar.monto_usd}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operación:</span>
                <strong className="text-slate-800">{cuotaACobrar.id_operacion}</strong>
              </div>
            </div>

            {/* COTIZACIÓN DÓLAR */}
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1">
                Cotización Dólar del Cobro ($)
              </span>
              <input
                type="number"
                value={cotizacionDia}
                onChange={(e) => {
                  setCotizacionDia(e.target.value);
                  const rate = Number(e.target.value) || 0;
                  if (rate > 0) {
                    setMontoCobradoArs(String(Math.round(cuotaACobrar.monto_usd * rate)));
                  }
                }}
                className="w-full p-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            {/* MONTO EN PESOS RECIBIDO */}
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1">
                Monto Recibido en Pesos (ARS)
              </span>
              <input
                type="number"
                value={montoCobradoArs}
                onChange={(e) => setMontoCobradoArs(e.target.value)}
                className="w-full p-3 text-lg font-mono font-black border border-emerald-400 bg-emerald-50/30 text-emerald-950 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCuotaACobrar(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCobro}
                disabled={procesando}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE WHATSAPP CON PLANTILLAS PREARMADAS */}
      {cuotaAvisar && (
        <ModalWhatsAppRecordatorio
          isOpen={!!cuotaAvisar}
          onClose={() => setCuotaAvisar(null)}
          cliente={{
            nombre: cuotaAvisar.cliente_nombre,
            telefono: cuotaAvisar.cliente_telefono,
            dni: cuotaAvisar.cliente_dni,
          }}
          cuota={{
            numero_cuota: cuotaAvisar.numero_cuota,
            total_cuotas: cuotaAvisar.total_cuotas,
            monto_usd: cuotaAvisar.monto_usd,
            monto_ars: cuotaAvisar.monto_pagado_ars || Math.round(cuotaAvisar.monto_usd * dolarActual),
            fecha_vencimiento: cuotaAvisar.fecha_vencimiento,
            id_operacion: cuotaAvisar.id_operacion,
            dias_mora: cuotaAvisar.diasMora,
            isVencida: cuotaAvisar.isVencida,
            isHoy: cuotaAvisar.isHoy,
          }}
          tenantName={tenantName}
          tenantCuit={tenantCuit}
        />
      )}

      {/* PWA INSTALL PROMPT (ADMIN) */}
      <PwaInstallPrompt appType="admin" appName={tenantName} />

      {/* BOTTOM NAV BAR */}
      <PwaBottomNav active="cuotas" />
    </div>
  );
}
