'use client';

import { useMemo, useState } from 'react';
import {
  Wallet,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Receipt,
  HandCoins,
  TrendingDown,
  Calendar,
  Filter,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import { registrarMovimiento } from '@/actions/caja';
import { useRouter } from 'next/navigation';

export interface PwaTransaccionItem {
  id: string;
  fecha_str: string;
  concepto: string;
  categoria: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto_ars: number;
  monto_usd: number;
  referencia: string;
}

export default function PwaCajaClient({
  transaccionesIniciales,
  dolarActual,
  tenantName,
  isFinancialOnly,
}: {
  transaccionesIniciales: PwaTransaccionItem[];
  dolarActual: number;
  tenantName: string;
  isFinancialOnly: boolean;
}) {
  const router = useRouter();
  const [transacciones, setTransacciones] = useState(transaccionesIniciales);
  const [filtro, setFiltro] = useState<'TODOS' | 'INGRESO' | 'EGRESO' | 'COBRANZAS' | 'PRESTAMOS' | 'GASTOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Modal nuevo movimiento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [monedaInput, setMonedaInput] = useState<'ARS' | 'USD'>('ARS');
  const [montoInput, setMontoInput] = useState('');
  const [conceptoInput, setConceptoInput] = useState('');
  const [categoriaInput, setCategoriaInput] = useState('Gastos Operativos');
  const [guardando, setGuardando] = useState(false);

  // Totales y cálculos
  const totalIngresosArs = useMemo(
    () => transacciones.filter((t) => t.tipo === 'INGRESO').reduce((s, t) => s + (t.monto_ars || 0), 0),
    [transacciones]
  );
  const totalEgresosArs = useMemo(
    () => transacciones.filter((t) => t.tipo === 'EGRESO').reduce((s, t) => s + (t.monto_ars || 0), 0),
    [transacciones]
  );
  const saldoNetoArs = totalIngresosArs - totalEgresosArs;

  const totalIngresosUsd = useMemo(
    () => transacciones.filter((t) => t.tipo === 'INGRESO').reduce((s, t) => s + (t.monto_usd || 0), 0),
    [transacciones]
  );
  const totalEgresosUsd = useMemo(
    () => transacciones.filter((t) => t.tipo === 'EGRESO').reduce((s, t) => s + (t.monto_usd || 0), 0),
    [transacciones]
  );
  const saldoNetoUsd = totalIngresosUsd - totalEgresosUsd;

  // Cobranzas de cuotas
  const cobranzas = useMemo(
    () => transacciones.filter((t) => t.categoria.includes('Cobro')),
    [transacciones]
  );
  const cobranzasArs = useMemo(
    () => cobranzas.reduce((s, t) => s + (t.monto_ars || 0), 0),
    [cobranzas]
  );
  const cobranzasUsd = useMemo(
    () => cobranzas.reduce((s, t) => s + (t.monto_usd || 0), 0),
    [cobranzas]
  );

  // Desembolsos
  const desembolsos = useMemo(
    () => transacciones.filter((t) => t.categoria.includes('Préstamo Otorgado')),
    [transacciones]
  );
  const desembolsosArs = useMemo(
    () => desembolsos.reduce((s, t) => s + (t.monto_ars || 0), 0),
    [desembolsos]
  );
  const desembolsosUsd = useMemo(
    () => desembolsos.reduce((s, t) => s + (t.monto_usd || 0), 0),
    [desembolsos]
  );

  // Gastos
  const gastosOperativos = useMemo(
    () => transacciones.filter((t) => !t.categoria.includes('Cobro') && !t.categoria.includes('Préstamo') && !t.categoria.includes('Venta')),
    [transacciones]
  );
  const gastosArs = useMemo(
    () => gastosOperativos.reduce((s, t) => s + (t.monto_ars || 0), 0),
    [gastosOperativos]
  );

  // Filtrado de lista
  const transaccionesFiltradas = useMemo(() => {
    let list = transacciones;
    if (filtro === 'INGRESO') list = list.filter((t) => t.tipo === 'INGRESO');
    if (filtro === 'EGRESO') list = list.filter((t) => t.tipo === 'EGRESO');
    if (filtro === 'COBRANZAS') list = list.filter((t) => t.categoria.includes('Cobro'));
    if (filtro === 'PRESTAMOS') list = list.filter((t) => t.categoria.includes('Préstamo'));
    if (filtro === 'GASTOS') list = list.filter((t) => !t.categoria.includes('Cobro') && !t.categoria.includes('Préstamo'));

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.concepto.toLowerCase().includes(term) ||
          t.categoria.toLowerCase().includes(term) ||
          t.referencia.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term)
      );
    }
    return list;
  }, [transacciones, filtro, busqueda]);

  const guardarNuevoMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoInput);
    if (!monto || monto <= 0) {
      alert('Ingresá un monto válido mayor a 0');
      return;
    }
    if (!conceptoInput.trim()) {
      alert('Ingresá una descripción o concepto.');
      return;
    }

    const montoArs = monedaInput === 'ARS' ? monto : monto * dolarActual;

    setGuardando(true);
    const res = await registrarMovimiento({
      descripcion: conceptoInput.trim(),
      tipo: tipoMovimiento,
      monto_ars: montoArs,
      cotizacion_dia: dolarActual,
      categoria: categoriaInput,
    });
    setGuardando(false);

    if (res.success) {
      setModalAbierto(false);
      setMontoInput('');
      setConceptoInput('');
      router.refresh();
    } else {
      alert(res.error || 'Error al registrar movimiento.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 pb-24 select-none">
      {/* HEADER MÓVIL CON PROTECCIÓN DE NOTCH */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 pb-3 shadow-xs"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-wider text-purple-700 block leading-none">
                Caja y Finanzas
              </span>
              <h1 className="text-base font-black text-slate-900 leading-tight">Flujo de Fondos</h1>
            </div>
          </div>

          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* MÉTRICAS RÁPIDAS SUPERIORES (ARS EN FOCO, USD SECUNDARIO) */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left">
            <span className="text-[9px] uppercase font-black text-slate-400 block">Saldo Neto ARS</span>
            <p
              className={`font-mono text-base font-black ${
                saldoNetoArs >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              $ {Math.round(saldoNetoArs).toLocaleString('es-AR')}
            </p>
            <div className="flex items-center justify-between text-[9px] font-mono mt-1 pt-1 border-t border-slate-100 text-slate-400">
              <span className="text-emerald-600 font-bold">+${Math.round(totalIngresosArs).toLocaleString('es-AR')}</span>
              <span className="text-red-500 font-bold">-${Math.round(totalEgresosArs).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-black text-blue-700 block">Caja USD</span>
              <span className="text-[8px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">TC ${dolarActual}</span>
            </div>
            <p className="font-mono text-base font-black text-blue-900 mt-0.5">
              U$S {saldoNetoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-mono text-blue-600 font-bold mt-1">
              ≈ $ {Math.round(saldoNetoUsd * dolarActual).toLocaleString('es-AR')} ARS
            </p>
          </div>
        </div>

        {/* TARJETAS SECUNDARIAS: COBRANZAS VS DESEMBOLSOS */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[8.5px] uppercase font-black text-emerald-700 block">Cobranzas</span>
              <span className="font-mono text-xs font-black text-emerald-950 block">
                $ {Math.round(cobranzasArs).toLocaleString('es-AR')}
              </span>
              <span className="text-[9px] font-mono text-emerald-600">
                U$S {Math.round(cobranzasUsd).toLocaleString('es-AR')}
              </span>
            </div>
            <Receipt className="w-5 h-5 text-emerald-500/40 shrink-0" />
          </div>

          <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[8.5px] uppercase font-black text-amber-700 block">Desembolsos</span>
              <span className="font-mono text-xs font-black text-amber-950 block">
                $ {Math.round(desembolsosArs).toLocaleString('es-AR')}
              </span>
              <span className="text-[9px] font-mono text-amber-600">
                U$S {Math.round(desembolsosUsd).toLocaleString('es-AR')}
              </span>
            </div>
            <HandCoins className="w-5 h-5 text-amber-500/40 shrink-0" />
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto o categoría..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* FILTROS HORIZONTALES */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'INGRESO', label: 'Ingresos' },
            { id: 'EGRESO', label: 'Egresos' },
            { id: 'COBRANZAS', label: 'Cobranzas' },
            { id: 'PRESTAMOS', label: 'Préstamos' },
            { id: 'GASTOS', label: 'Gastos' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-black shrink-0 transition ${
                filtro === f.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE MOVIMIENTOS */}
      <div className="p-3 space-y-2.5">
        {transaccionesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No hay movimientos en este filtro</p>
            <p className="text-xs text-slate-400 mt-1">Podés registrar un nuevo ingreso o egreso.</p>
          </div>
        ) : (
          transaccionesFiltradas.map((t) => {
            const isIngreso = t.tipo === 'INGRESO';
            const fecha = new Date(t.fecha_str).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIngreso
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isIngreso ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t.categoria}
                      </span>
                      <span className="text-[9px] text-slate-300">·</span>
                      <span className="text-[9px] text-slate-400 font-mono">{fecha}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{t.concepto}</p>
                    {t.referencia && (
                      <p className="text-[10px] text-slate-400 truncate">{t.referencia}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-black text-sm block ${
                      isIngreso ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isIngreso ? '+' : '-'}$ {Math.round(t.monto_ars).toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    U$S {t.monto_usd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL BOTTOM-SHEET: NUEVO MOVIMIENTO RÁPIDO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <form
            onSubmit={guardarNuevoMovimiento}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm">Registrar Movimiento de Caja</h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TIPO: INGRESO O EGRESO */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTipoMovimiento('INGRESO')}
                className={`py-2 rounded-lg text-xs font-black transition ${
                  tipoMovimiento === 'INGRESO'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Ingreso de Fondos
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimiento('EGRESO')}
                className={`py-2 rounded-lg text-xs font-black transition ${
                  tipoMovimiento === 'EGRESO'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Egreso / Gasto
              </button>
            </div>

            {/* MONEDA Y MONTO */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-600">Importe *</span>
                <div className="flex rounded-lg p-0.5 bg-slate-200 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setMonedaInput('ARS')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      monedaInput === 'ARS' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    $ Pesos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonedaInput('USD')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      monedaInput === 'USD' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
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
                  step="any"
                  required
                  placeholder={monedaInput === 'ARS' ? 'Ej: 50000' : 'Ej: 50'}
                  value={montoInput}
                  onChange={(e) => setMontoInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-base font-mono font-black border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                <span>Equivalente:</span>
                <span className="font-mono text-purple-700">
                  {monedaInput === 'ARS'
                    ? `≈ U$S ${(Number(montoInput || 0) / dolarActual).toFixed(2)} USD`
                    : `≈ $ ${(Number(montoInput || 0) * dolarActual).toLocaleString('es-AR')} ARS`}
                </span>
              </div>
            </div>

            {/* CATEGORÍA */}
            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Categoría</span>
              <select
                value={categoriaInput}
                onChange={(e) => setCategoriaInput(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Gastos Operativos">Gastos Operativos Generales</option>
                <option value="Retiro de Socios">Retiro de Socios / Ganancias</option>
                <option value="Servicios e Impuestos">Servicios, Luz, Internet o Impuestos</option>
                <option value="Combustible y Viáticos">Combustible y Viáticos</option>
                <option value="Mantenimiento y Limpieza">Mantenimiento y Limpieza</option>
                <option value="Publicidad y Marketing">Publicidad y Marketing</option>
                <option value="Aporte de Capital">Aporte de Capital</option>
                <option value="Otros Movimientos">Otros Movimientos</option>
              </select>
            </label>

            {/* CONCEPTO */}
            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">
                Concepto / Descripción *
              </span>
              <input
                type="text"
                required
                placeholder="Ej: Pago de flete, compras de insumos, etc."
                value={conceptoInput}
                onChange={(e) => setConceptoInput(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Registrar en Caja</span>
            </button>
          </form>
        </div>
      )}

      <PwaInstallPrompt />
      <PwaBottomNav active="caja" />
    </div>
  );
}

