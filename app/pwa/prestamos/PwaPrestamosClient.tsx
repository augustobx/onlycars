'use client';

import { useMemo, useState } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Percent,
  Calculator,
  ArrowRight,
  DollarSign,
  Calendar,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import { registrarPrestamo } from '@/actions/prestamos';
import { registrarPagoCuotaPrestamo } from '@/actions/cuotas';
import { useRouter } from 'next/navigation';

export interface PwaPrestamoItem {
  id_prestamo: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_dni: string;
  cliente_telefono: string;
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar: number;
  fecha_prestamo: string;
  estado: string;
  cuotas_totales: number;
  cuotas_pagadas: number;
  cuotas: Array<{
    id_cuota: number;
    numero_cuota: number;
    monto_usd: number;
    monto_pagado_ars: number | null;
    estado: string;
    fecha_vencimiento: string;
    recibo_nro: string | null;
  }>;
}

export default function PwaPrestamosClient({
  prestamosIniciales,
  clientes,
  dolarActual,
  tenantName,
  initialTab = 'cartera',
}: {
  prestamosIniciales: PwaPrestamoItem[];
  clientes: Array<{
    id_cliente: number;
    nombre_completo: string;
    dni: string | null;
    cuit_cuil: string | null;
    telefono: string | null;
  }>;
  dolarActual: number;
  tenantName: string;
  initialTab?: 'cartera' | 'simulador';
}) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'cartera' | 'simulador'>(initialTab);
  const [prestamos, setPrestamos] = useState(prestamosIniciales);
  const [filtro, setFiltro] = useState<'ACTIVOS' | 'TODOS' | 'FINALIZADOS'>('ACTIVOS');
  const [busqueda, setBusqueda] = useState('');
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  // Estado del Cotizador y Generador de Préstamos
  const [modalNuevo, setModalNuevo] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monedaInput, setMonedaInput] = useState<'ARS' | 'USD'>('ARS');
  const [montoInput, setMontoInput] = useState('');
  const [recargoPct, setRecargoPct] = useState('30');
  const [cantidadCuotas, setCantidadCuotas] = useState(12);
  const [primerVencimiento, setPrimerVencimiento] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [guardando, setGuardando] = useState(false);

  // Cobro rápido dentro de cuotas expandidas
  const [cuotaCobrando, setCuotaCobrando] = useState<{ id_cuota: number; monto_usd: number; cliente_nombre: string } | null>(null);
  const [cotizacionCobro, setCotizacionCobro] = useState(String(dolarActual));
  const [montoCobroArs, setMontoCobroArs] = useState('');
  const [procesandoCobro, setProcesandoCobro] = useState(false);

  // Métricas
  const totalCapitalColocadoUsd = useMemo(
    () => prestamos.filter((p) => p.estado === 'ACTIVO').reduce((sum, p) => sum + p.capital_entregado_usd, 0),
    [prestamos]
  );
  const totalADevolverUsd = useMemo(
    () => prestamos.filter((p) => p.estado === 'ACTIVO').reduce((sum, p) => sum + p.total_devolver_usd, 0),
    [prestamos]
  );
  const totalActivos = useMemo(() => prestamos.filter((p) => p.estado === 'ACTIVO').length, [prestamos]);

  // Filtrado de listado
  const prestamosFiltrados = useMemo(() => {
    let list = prestamos;
    if (filtro === 'ACTIVOS') list = list.filter((p) => p.estado === 'ACTIVO');
    if (filtro === 'FINALIZADOS') list = list.filter((p) => p.estado === 'FINALIZADO');

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.cliente_nombre.toLowerCase().includes(term) ||
          p.cliente_dni.toLowerCase().includes(term) ||
          String(p.id_prestamo).includes(term)
      );
    }
    return list;
  }, [prestamos, filtro, busqueda]);

  // Cálculo del simulador inteligente (Monto en ARS o USD, % libre y cuotas)
  const sim = useMemo(() => {
    const monto = Number(montoInput) || 0;
    let capUsd = 0;
    let capArs = 0;

    if (monedaInput === 'ARS') {
      capArs = monto;
      capUsd = dolarActual > 0 ? capArs / dolarActual : 0;
    } else {
      capUsd = monto;
      capArs = capUsd * dolarActual;
    }

    const recargo = Math.max(0, Number(recargoPct) || 0) / 100;
    const totUsd = capUsd * (1 + recargo);
    const totArs = capArs * (1 + recargo);
    const cuotas = Math.max(1, Number(cantidadCuotas) || 1);
    const cuotaUsd = totUsd / cuotas;
    const cuotaArs = totArs / cuotas;
    const interesUsd = Math.max(0, totUsd - capUsd);
    const interesArs = Math.max(0, totArs - capArs);

    return { capUsd, capArs, totUsd, totArs, cuotaUsd, cuotaArs, interesUsd, interesArs };
  }, [montoInput, monedaInput, recargoPct, cantidadCuotas, dolarActual]);

  const confirmarNuevoPrestamo = async () => {
    if (!clienteSeleccionado) return alert('Seleccioná un cliente.');
    if (sim.capUsd <= 0) return alert('Ingresá el capital a prestar.');
    if (!primerVencimiento) return alert('Indicá la fecha del primer vencimiento.');

    setGuardando(true);
    const [y, m, d] = primerVencimiento.split('-').map(Number);
    const cuotas = Array.from({ length: Math.max(1, cantidadCuotas) }).map((_, index) => {
      const date = new Date(Date.UTC(y, m - 1 + index, d, 12));
      return {
        numero_cuota: index + 1,
        monto_usd: Number(sim.cuotaUsd.toFixed(2)),
        fecha_vencimiento: date.toISOString(),
      };
    });

    const res = await registrarPrestamo({
      id_cliente: Number(clienteSeleccionado),
      capital_entregado_usd: Number(sim.capUsd.toFixed(2)),
      total_devolver_usd: Number(sim.totUsd.toFixed(2)),
      cotizacion_dolar: dolarActual,
      cuotas,
    });
    setGuardando(false);

    if (!res.success) {
      alert(res.error || 'No se pudo generar el préstamo.');
      return;
    }

    setModalNuevo(false);
    setMontoInput('');
    setClienteSeleccionado('');
    router.refresh();
  };

  const ejecutarCobroCuota = async () => {
    if (!cuotaCobrando) return;
    const montoArs = Number(montoCobroArs);
    const rate = Number(cotizacionCobro);
    if (montoArs <= 0 || rate <= 0) return alert('Verificá monto y cotización.');

    setProcesandoCobro(true);
    const res = await registrarPagoCuotaPrestamo(cuotaCobrando.id_cuota, {
      monto_cobrado_ars: montoArs,
      cotizacion_dia: rate,
    });
    setProcesandoCobro(false);

    if (!res.success) {
      alert(res.error || 'No se pudo registrar el cobro.');
      return;
    }

    // Actualizar estado local
    setPrestamos((prev) =>
      prev.map((p) => {
        const tieneCuota = p.cuotas.some((c) => c.id_cuota === cuotaCobrando.id_cuota);
        if (!tieneCuota) return p;
        const nuevasCuotas = p.cuotas.map((c) =>
          c.id_cuota === cuotaCobrando.id_cuota
            ? { ...c, estado: 'PAGADA', monto_pagado_ars: montoArs, recibo_nro: res.recibo_nro || null }
            : c
        );
        const pagadas = nuevasCuotas.filter((c) => c.estado === 'PAGADA').length;
        const estadoNuevo = pagadas === nuevasCuotas.length ? 'FINALIZADO' : p.estado;
        return { ...p, cuotas: nuevasCuotas, cuotas_pagadas: pagadas, estado: estadoNuevo };
      })
    );

    setCuotaCobrando(null);
  };

  const limpiarTelefono = (tel: string) => tel.replace(/\D/g, '');

  const renderCalculadorControls = (showClientSelect: boolean = true) => (
    <div className="space-y-3.5">
      {showClientSelect && (
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1">
            Cliente Destinatario *
          </span>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">-- Seleccionar cliente existente --</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre_completo} {c.dni ? `(DNI: ${c.dni})` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* MONEDA Y MONTO DEL PRÉSTAMO */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Capital a Prestar *
          </span>
          <div className="flex rounded-lg p-0.5 bg-slate-200 text-[10px] font-black">
            <button
              type="button"
              onClick={() => setMonedaInput('ARS')}
              className={`px-2.5 py-1 rounded-md transition ${
                monedaInput === 'ARS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              $ Pesos
            </button>
            <button
              type="button"
              onClick={() => setMonedaInput('USD')}
              className={`px-2.5 py-1 rounded-md transition ${
                monedaInput === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              U$S Dólares
            </button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-3 text-sm font-black text-slate-400">
            {monedaInput === 'ARS' ? '$' : 'U$S'}
          </span>
          <input
            type="number"
            placeholder={monedaInput === 'ARS' ? 'Ej: 500000' : 'Ej: 1000'}
            value={montoInput}
            onChange={(e) => setMontoInput(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 text-base font-mono font-black border border-emerald-400 bg-emerald-50/20 text-emerald-950 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 px-0.5">
          <span>Referencia Cambiaria:</span>
          <span className="font-mono text-emerald-800 font-black">
            {monedaInput === 'ARS'
              ? `≈ U$S ${sim.capUsd.toFixed(2)} USD (TC $${dolarActual.toLocaleString('es-AR')})`
              : `≈ $ ${Math.round(sim.capArs).toLocaleString('es-AR')} ARS (TC $${dolarActual.toLocaleString('es-AR')})`}
          </span>
        </div>
      </div>

      {/* % INTERÉS / RECARGO */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            % Interés / Recargo Pactado
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="any"
              min="0"
              max="500"
              value={recargoPct}
              onChange={(e) => setRecargoPct(e.target.value)}
              className="w-16 px-2 py-1 text-right text-xs font-mono font-black border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <span className="text-xs font-black text-slate-500">%</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {['15', '20', '30', '40', '50', '60', '80', '100'].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setRecargoPct(pct)}
              className={`py-1 rounded-lg text-xs font-bold transition ${
                recargoPct === pct
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              +{pct}%
            </button>
          ))}
        </div>
      </div>

      {/* PLAZO EN CUOTAS */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Plazo en Cuotas Mensuales
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="120"
              value={cantidadCuotas}
              onChange={(e) => setCantidadCuotas(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-right text-xs font-mono font-black border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <span className="text-xs font-black text-slate-500">cuotas</span>
          </div>
        </div>

        <select
          value={cantidadCuotas}
          onChange={(e) => setCantidadCuotas(Number(e.target.value))}
          className="w-full p-2 text-xs font-bold border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="1">1 cuota (Pago único · 30 días)</option>
          <option value="2">2 cuotas mensuales (60 días)</option>
          <option value="3">3 cuotas mensuales (Trimestral)</option>
          <option value="4">4 cuotas mensuales</option>
          <option value="5">5 cuotas mensuales</option>
          <option value="6">6 cuotas mensuales (Semestral)</option>
          <option value="9">9 cuotas mensuales</option>
          <option value="10">10 cuotas mensuales</option>
          <option value="12">12 cuotas mensuales (1 año)</option>
          <option value="15">15 cuotas mensuales</option>
          <option value="18">18 cuotas mensuales (1 año y medio)</option>
          <option value="24">24 cuotas mensuales (2 años)</option>
          <option value="30">30 cuotas mensuales (2 años y medio)</option>
          <option value="36">36 cuotas mensuales (3 años)</option>
          <option value="48">48 cuotas mensuales (4 años)</option>
          <option value="60">60 cuotas mensuales (5 años)</option>
        </select>

        <div className="grid grid-cols-6 gap-1 mt-1">
          {[3, 6, 12, 18, 24, 36].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCantidadCuotas(n)}
              className={`py-1 rounded-lg text-[11px] font-black transition ${
                cantidadCuotas === n
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}m
            </button>
          ))}
        </div>
      </div>

      {/* PRIMER VENCIMIENTO */}
      {showClientSelect && (
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1">
            Primer Vencimiento
          </span>
          <input
            type="date"
            value={primerVencimiento}
            onChange={(e) => setPrimerVencimiento(e.target.value)}
            className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </label>
      )}

      {/* RESUMEN FINANCIERO EN VIVO */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300/80 rounded-2xl p-4 space-y-2.5 text-xs shadow-xs">
        <div className="flex justify-between items-baseline border-b border-emerald-200/80 pb-2">
          <div>
            <span className="text-emerald-900 font-bold block">Cuota Mensual Estimada:</span>
            <span className="text-[10px] text-emerald-700">{cantidadCuotas} cuotas consecutivas</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-black text-emerald-950 text-base block">
              $ {Math.round(sim.cuotaArs).toLocaleString('es-AR')}
            </span>
            <span className="font-mono text-[11px] text-emerald-700 font-bold">
              U$S {sim.cuotaUsd.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
            <span className="text-slate-500 uppercase font-black text-[9px] block">Capital</span>
            <span className="font-black text-slate-800 font-mono block">$ {Math.round(sim.capArs).toLocaleString('es-AR')}</span>
            <span className="text-slate-500 text-[10px] font-mono">U$S {sim.capUsd.toFixed(2)}</span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 uppercase font-black text-[9px] block">Interés (+{recargoPct}%)</span>
            <span className="font-black text-emerald-800 font-mono block">$ {Math.round(sim.interesArs).toLocaleString('es-AR')}</span>
            <span className="text-emerald-600 text-[10px] font-mono">U$S {sim.interesUsd.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 text-[11px] text-slate-700 border-t border-emerald-200/60 font-medium">
          <span>Total final pactado:</span>
          <span className="font-black text-slate-900 font-mono">
            $ {Math.round(sim.totArs).toLocaleString('es-AR')} · U$S {sim.totUsd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Préstamos Móvil</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{tenantName}</p>
            </div>
          </div>

          <button
            onClick={() => setModalNuevo(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Generar Préstamo
          </button>
        </div>

        {/* SELECTOR DE VISTA: CARTERA VS COTIZADOR */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-black mt-2">
          <button
            type="button"
            onClick={() => setActiveView('cartera')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'cartera'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" /> Cartera ({prestamos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('simulador')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'simulador'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Cotizador de Crédito
          </button>
        </div>

        {activeView === 'cartera' && (
          <>
            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                <p className="text-[9px] uppercase font-black text-slate-400">Prestado</p>
                <p className="text-xs font-black text-slate-900 font-mono mt-0.5">U$S {Math.round(totalCapitalColocadoUsd).toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl text-center border border-emerald-100">
                <p className="text-[9px] uppercase font-black text-emerald-600">A Cobrar</p>
                <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">U$S {Math.round(totalADevolverUsd).toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100">
                <p className="text-[9px] uppercase font-black text-indigo-600">Activos</p>
                <p className="text-xs font-black text-indigo-700 font-mono mt-0.5">{totalActivos}</p>
              </div>
            </div>

            {/* BUSCADOR */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente o ID de préstamo..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* FILTROS */}
            <div className="flex gap-1 mt-2.5">
              <button
                onClick={() => setFiltro('ACTIVOS')}
                className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                  filtro === 'ACTIVOS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Activos ({prestamos.filter((p) => p.estado === 'ACTIVO').length})
              </button>
              <button
                onClick={() => setFiltro('TODOS')}
                className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                  filtro === 'TODOS' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todos ({prestamos.length})
              </button>
              <button
                onClick={() => setFiltro('FINALIZADOS')}
                className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                  filtro === 'FINALIZADOS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Finalizados ({prestamos.filter((p) => p.estado === 'FINALIZADO').length})
              </button>
            </div>
          </>
        )}
      </div>

      {/* VISTA SIMULADOR / COTIZADOR MÓVIL */}
      {activeView === 'simulador' && (
        <div className="p-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" /> Cotizador y Simulador de Créditos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulá planes de pago en pesos o dólares, recargo libre y cuotas adaptables.
              </p>
            </div>

            {renderCalculadorControls(false)}

            <button
              type="button"
              onClick={() => setModalNuevo(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-4"
            >
              <Plus className="w-4 h-4" /> Emitir Préstamo con esta Simulación
            </button>
          </div>
        </div>
      )}

      {/* LISTADO DE PRÉSTAMOS */}
      {activeView === 'cartera' && (
        <div className="p-3 space-y-3">
        {prestamosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <HandCoins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No hay préstamos para mostrar</p>
            <p className="text-xs text-slate-400 mt-1">Podés crear uno nuevo con el botón superior.</p>
          </div>
        ) : (
          prestamosFiltrados.map((p) => {
            const fechaFormateada = new Date(p.fecha_prestamo).toLocaleDateString('es-AR');
            const pctProgreso = p.cuotas_totales > 0 ? (p.cuotas_pagadas / p.cuotas_totales) * 100 : 0;
            const telLimpio = limpiarTelefono(p.cliente_telefono);
            const expandido = expandidoId === p.id_prestamo;

            return (
              <div
                key={p.id_prestamo}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 transition-all"
              >
                {/* ENCABEZADO DE TARJETA */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      PREST-{p.id_prestamo} · {fechaFormateada}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm mt-1">{p.cliente_nombre}</h3>
                    {p.cliente_dni && <p className="text-[10px] text-slate-400 font-medium">DNI/CUIT: {p.cliente_dni}</p>}
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      p.estado === 'ACTIVO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.estado}
                  </span>
                </div>

                {/* CAPITAL Y TOTAL */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Capital Entregado</span>
                    <strong className="text-slate-900 font-mono text-sm">U$S {p.capital_entregado_usd.toLocaleString('es-AR')}</strong>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      $ {Math.round(p.capital_entregado_usd * p.cotizacion_dolar).toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Total a Reintegrar</span>
                    <strong className="text-emerald-700 font-mono text-sm">U$S {p.total_devolver_usd.toLocaleString('es-AR')}</strong>
                    <span className="text-[10px] text-emerald-600 block font-mono">
                      $ {Math.round(p.total_devolver_usd * p.cotizacion_dolar).toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                </div>

                {/* BARRA DE PROGRESO DE CUOTAS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Progreso de amortización</span>
                    <span>
                      {p.cuotas_pagadas} de {p.cuotas_totales} cuotas
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${pctProgreso}%` }}
                    />
                  </div>
                </div>

                {/* ACCIONES DE TARJETA */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {telLimpio && (
                    <a
                      href={`https://wa.me/${telLimpio}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-95"
                      title="WhatsApp al cliente"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  <a
                    href={`/documentos/prestamo/${p.id_prestamo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ver Boleto
                  </a>

                  <button
                    onClick={() => setExpandidoId(expandido ? null : p.id_prestamo)}
                    className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Cuotas</span>
                    {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* LISTADO EXPANDIBLE DE CUOTAS DEL PRÉSTAMO */}
                {expandido && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 animate-in fade-in">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                      Cronograma de cuotas
                    </p>
                    {p.cuotas.map((c) => {
                      const vto = new Date(c.fecha_vencimiento).toLocaleDateString('es-AR');
                      return (
                        <div
                          key={c.id_cuota}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100"
                        >
                          <div>
                            <span className="font-bold text-slate-800">Cuota {c.numero_cuota}</span>
                            <span className="text-[10px] text-slate-500 block">Vto: {vto}</span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900">U$S {c.monto_usd}</span>
                            {c.estado === 'PAGADA' ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Pagada
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setCuotaCobrando({
                                    id_cuota: c.id_cuota,
                                    monto_usd: c.monto_usd,
                                    cliente_nombre: p.cliente_nombre,
                                  });
                                  setMontoCobroArs(String(Math.round(c.monto_usd * dolarActual)));
                                }}
                                className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded shadow-xs active:scale-95"
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* MODAL MÓVIL: GENERAR PRÉSTAMO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Generar Nuevo Préstamo</h3>
                <p className="text-xs text-slate-500 font-semibold">Financiación dineraria en minutos</p>
              </div>
              <button onClick={() => setModalNuevo(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderCalculadorControls(true)}

            {/* BOTONES */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarNuevoPrestamo}
                disabled={guardando}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar y Emitir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRO RÁPIDO DENTRO DE PRÉSTAMOS */}
      {cuotaCobrando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm">Cobrar Cuota de Préstamo</h3>
              <button onClick={() => setCuotaCobrando(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Cliente: <strong>{cuotaCobrando.cliente_nombre}</strong> · Importe pactado: <strong>U$S {cuotaCobrando.monto_usd}</strong>
            </p>
            <label className="block">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Cotización Dólar ($)</span>
              <input
                type="number"
                value={cotizacionCobro}
                onChange={(e) => {
                  setCotizacionCobro(e.target.value);
                  const rate = Number(e.target.value) || 0;
                  setMontoCobroArs(String(Math.round(cuotaCobrando.monto_usd * rate)));
                }}
                className="w-full p-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Total Pesos Recibido ($)</span>
              <input
                type="number"
                value={montoCobroArs}
                onChange={(e) => setMontoCobroArs(e.target.value)}
                className="w-full p-2.5 text-base font-mono font-black border border-emerald-400 rounded-xl bg-emerald-50/30 text-emerald-950"
              />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setCuotaCobrando(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button
                onClick={ejecutarCobroCuota}
                disabled={procesandoCobro}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1"
              >
                {procesandoCobro ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA INSTALL PROMPT (ADMIN) */}
      <PwaInstallPrompt appType="admin" appName={tenantName} />

      {/* BOTTOM NAV BAR */}
      <PwaBottomNav active="prestamos" />
    </div>
  );
}
