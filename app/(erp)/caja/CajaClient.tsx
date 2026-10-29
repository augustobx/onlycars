'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { registrarMovimiento } from '@/actions/caja';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Loader2,
  X,
  Receipt,
  HandCoins,
  BadgeDollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  CircleDollarSign,
  Filter,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import SearchCombobox from '@/components/common/SearchCombobox';

export default function CajaClient({
  transacciones,
  vehiculos,
  dolarActual,
  isFinancialOnly = false,
}: {
  transacciones: any[];
  vehiculos: any[];
  dolarActual: number;
  isFinancialOnly?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMes, setFiltroMes] = useState('este_mes');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Gastos Operativos');
  const [tipoMov, setTipoMov] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [monto, setMonto] = useState({ ars: '', usd: '' });
  const [vehiculoId, setVehiculoId] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const txFiltradas = useMemo(() => {
    const now = new Date();
    return transacciones.filter((tx) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${tx.concepto || ''} ${tx.categoria || ''} ${tx.referencia || ''}`
          .toLowerCase()
          .includes(q);

      const date = new Date(tx.fecha_str);
      const matchesMonth =
        filtroMes !== 'este_mes' ||
        (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());

      let matchesCat = true;
      if (categoriaFiltro === 'COBROS') {
        matchesCat = tx.categoria === 'Cobro Préstamo' || tx.categoria === 'Cobro Financiación';
      } else if (categoriaFiltro === 'DESEMBOLSOS') {
        matchesCat = tx.categoria === 'Préstamo Otorgado';
      } else if (categoriaFiltro === 'OPERATIVOS') {
        matchesCat = tx.tipo === 'EGRESO' && tx.categoria !== 'Préstamo Otorgado';
      } else if (categoriaFiltro === 'INGRESOS') {
        matchesCat = tx.tipo === 'INGRESO';
      } else if (categoriaFiltro === 'EGRESOS') {
        matchesCat = tx.tipo === 'EGRESO';
      }

      return matchesSearch && matchesMonth && matchesCat;
    });
  }, [transacciones, searchTerm, filtroMes, categoriaFiltro]);

  // Cálculos desglosados y transparentes
  const totalIngresosArs = useMemo(
    () => txFiltradas.filter((t) => t.tipo === 'INGRESO').reduce((acc, t) => acc + Number(t.monto_ars || 0), 0),
    [txFiltradas]
  );
  const totalIngresosUsd = useMemo(
    () => txFiltradas.filter((t) => t.tipo === 'INGRESO').reduce((acc, t) => acc + Number(t.monto_usd || 0), 0),
    [txFiltradas]
  );

  const totalEgresosArs = useMemo(
    () => txFiltradas.filter((t) => t.tipo === 'EGRESO').reduce((acc, t) => acc + Number(t.monto_ars || 0), 0),
    [txFiltradas]
  );
  const totalEgresosUsd = useMemo(
    () => txFiltradas.filter((t) => t.tipo === 'EGRESO').reduce((acc, t) => acc + Number(t.monto_usd || 0), 0),
    [txFiltradas]
  );

  const saldoNetoArs = totalIngresosArs - totalEgresosArs;
  const saldoNetoUsd = totalIngresosUsd - totalEgresosUsd;

  // Cobranzas de préstamos
  const cobranzasCuotas = useMemo(
    () => txFiltradas.filter((t) => t.categoria === 'Cobro Préstamo' || t.categoria === 'Cobro Financiación'),
    [txFiltradas]
  );
  const cobranzasArs = cobranzasCuotas.reduce((acc, t) => acc + Number(t.monto_ars || 0), 0);
  const cobranzasUsd = cobranzasCuotas.reduce((acc, t) => acc + Number(t.monto_usd || 0), 0);

  // Desembolsos de préstamos
  const prestamosOtorgados = useMemo(
    () => txFiltradas.filter((t) => t.categoria === 'Préstamo Otorgado'),
    [txFiltradas]
  );
  const desembolsosArs = prestamosOtorgados.reduce((acc, t) => acc + Number(t.monto_ars || 0), 0);
  const desembolsosUsd = prestamosOtorgados.reduce((acc, t) => acc + Number(t.monto_usd || 0), 0);

  // Gastos operativos varios
  const gastosOperativos = useMemo(
    () => txFiltradas.filter((t) => t.tipo === 'EGRESO' && t.categoria !== 'Préstamo Otorgado'),
    [txFiltradas]
  );
  const gastosOperativosArs = gastosOperativos.reduce((acc, t) => acc + Number(t.monto_ars || 0), 0);
  const gastosOperativosUsd = gastosOperativos.reduce((acc, t) => acc + Number(t.monto_usd || 0), 0);

  // Valuación consolidada de la caja
  const valuacionConsolidadaArs = saldoNetoArs + saldoNetoUsd * dolarActual;
  const valuacionConsolidadaUsd = saldoNetoUsd + (dolarActual > 0 ? saldoNetoArs / dolarActual : 0);

  const vehicleOptions = vehiculos.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.label,
    description: v.description,
    searchText: `${v.label} ${v.description}`,
  }));

  const handleGuardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoArs = Number(monto.ars || 0);
    if (!concepto.trim() || montoArs <= 0) return alert('Completá concepto y monto.');
    setIsSubmitting(true);
    const res = await registrarMovimiento({
      descripcion: concepto.trim(),
      categoria,
      tipo: tipoMov,
      monto_ars: montoArs,
      cotizacion_dia: dolarActual,
      id_vehiculo: vehiculoId ? Number(vehiculoId) : undefined,
    });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el movimiento.');
    setIsModalOpen(false);
    setConcepto('');
    setMonto({ ars: '', usd: '' });
    setVehiculoId('');
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER DE CAJA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /> Control de Caja y Fondos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Arqueo de efectivo en Pesos y Dólares, cobranzas de cuotas, desembolsos y movimientos operativos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" /> Registrar movimiento
          </button>
        </div>
      </div>

      {/* 6 TARJETAS INFORMATIVAS INTELIGENTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. CAJA EN PESOS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Caja Efectivo (ARS)
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                saldoNetoArs >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {saldoNetoArs >= 0 ? 'POSITIVA' : 'DÉFICIT'}
            </span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${
              saldoNetoArs >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
            }`}
          >
            $ {Math.round(saldoNetoArs).toLocaleString('es-AR')}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              +${Math.round(totalIngresosArs).toLocaleString('es-AR')}
            </span>
            <span className="text-red-600 dark:text-red-400 font-bold">
              -${Math.round(totalEgresosArs).toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* 2. CAJA EN DÓLARES */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Caja Efectivo (USD Billete)
            </p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
              DIVISA
            </span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${
              saldoNetoUsd >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            U$S {saldoNetoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              +U$S {totalIngresosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-red-600 dark:text-red-400 font-bold">
              -U$S {totalEgresosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 3. COBRANZAS DE PRÉSTAMOS */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Cobranzas de Cuotas
            </p>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono mt-2">
            $ {Math.round(cobranzasArs).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
            U$S {cobranzasUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-2 font-medium">
            {cobranzasCuotas.length} cuotas cobradas en el período
          </p>
        </div>

        {/* 4. DESEMBOLSOS DE PRÉSTAMOS */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Desembolsos a Clientes
            </p>
            <HandCoins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono mt-2">
            U$S {desembolsosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono">
            $ {Math.round(desembolsosArs).toLocaleString('es-AR')}
          </p>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-2 font-medium">
            {prestamosOtorgados.length} créditos desembolsados
          </p>
        </div>

        {/* 5. GASTOS OPERATIVOS */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gastos Operativos & Retiros
            </p>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            $ {Math.round(gastosOperativosArs).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-slate-500 mt-1 font-mono">
            U$S {gastosOperativosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            {gastosOperativos.length} egresos generales registrados
          </p>
        </div>

        {/* 6. VALUACIÓN PATRIMONIAL TOTAL */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Posición Consolidada Total
            </p>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-2">
            $ {Math.round(valuacionConsolidadaArs).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-slate-400 mt-1 font-mono">
            ≈ U$S {Math.round(valuacionConsolidadaUsd).toLocaleString('es-AR')} al dólar ${dolarActual}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Patrimonio total disponible en caja (ARS + USD valuados)
          </p>
        </div>
      </div>

      {/* FILTROS RÁPIDOS Y TABLA DE MOVIMIENTOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, categoría o comprobante..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Píldoras de filtrado por categoría */}
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setCategoriaFiltro('TODOS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  categoriaFiltro === 'TODOS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('COBROS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  categoriaFiltro === 'COBROS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cobros
              </button>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('DESEMBOLSOS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  categoriaFiltro === 'DESEMBOLSOS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Desembolsos
              </button>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('OPERATIVOS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  categoriaFiltro === 'OPERATIVOS'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Gastos
              </button>
            </div>

            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
            >
              <option value="este_mes">Este mes</option>
              <option value="todos">Todo el historial</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 w-32">Fecha</th>
                <th className="text-left px-5 py-3.5">Concepto</th>
                <th className="text-left px-5 py-3.5">Categoría / Origen</th>
                <th className="text-center px-4 py-3.5 w-24">Tipo</th>
                <th className="text-right px-5 py-3.5 w-48">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {txFiltradas.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {new Date(tx.fecha_str).toLocaleDateString('es-AR')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{tx.concepto}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tx.id}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tx.categoria}
                    </span>
                    {tx.referencia && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tx.referencia}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        tx.tipo === 'INGRESO'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.tipo === 'INGRESO' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {tx.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold">
                    <DualMoney
                      ars={tx.monto_ars}
                      usd={tx.monto_usd}
                      rate={dolarActual}
                      compact
                      primaryClassName={`font-black text-sm ${
                        tx.tipo === 'INGRESO'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    />
                  </td>
                </tr>
              ))}
              {txFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    No hay movimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR MOVIMIENTO */}
      {mounted &&
        isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleGuardarMovimiento}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[var(--color-primary-default,#FF6600)]" />
                    Registrar Movimiento de Caja
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Asentá un ingreso o egreso manual al arqueo diario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTipoMov('EGRESO')}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    tipoMov === 'EGRESO'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  EGRESO (Gasto / Salida)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMov('INGRESO')}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    tipoMov === 'INGRESO'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  INGRESO (Entrada de Fondos)
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Concepto / Motivo
                  </span>
                  <input
                    required
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Pago de servicios, Retiro de socios, Librería..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Categoría
                    </span>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                    >
                      <option>Gastos Operativos</option>
                      <option>Sueldos y Comisiones</option>
                      <option>Servicios e Impuestos</option>
                      <option>Retiro de Socios</option>
                      <option>Aporte de Capital</option>
                      <option>Librería e Insumos</option>
                      <option>Mantenimiento Local</option>
                      <option>Otros</option>
                    </select>
                  </label>

                  {!isFinancialOnly && (
                    <SearchCombobox
                      label="Vincular a vehículo"
                      value={vehiculoId}
                      onChange={setVehiculoId}
                      options={vehicleOptions}
                      placeholder="Buscar marca, modelo o patente..."
                      helper="Opcional. Si es un egreso, se suma al costo de esa unidad."
                    />
                  )}
                </div>

                <DualCurrencyInput
                  label="Monto del Movimiento"
                  required
                  ars={monto.ars}
                  usd={monto.usd}
                  rate={dolarActual}
                  onChange={setMonto}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Asiento
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}
