'use client';

import { useMemo, useState } from 'react';
import {
  TrendingUp,
  HandCoins,
  Receipt,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  BarChart3,
  ArrowRight,
  PieChart,
  Percent,
  CircleDollarSign,
  Clock,
  Layers,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function PrestamosMetricasView({
  prestamos,
  dolarActual,
}: {
  prestamos: any[];
  dolarActual: number;
}) {
  const [rangoPredefinido, setRangoPredefinido] = useState<string>('TODO');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'FINALIZADOS'>('TODOS');
  const [filtroMora, setFiltroMora] = useState<'TODOS' | 'AL_DIA' | 'EN_MORA'>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  const ahora = new Date();

  // 1. Filtrado dinámico de préstamos
  const prestamosFiltrados = useMemo(() => {
    return prestamos.filter((p) => {
      const fechaP = new Date(p.fecha_str || p.fecha_prestamo);

      // Filtro de fechas predefinidas
      if (rangoPredefinido === 'ESTE_MES') {
        if (fechaP.getMonth() !== ahora.getMonth() || fechaP.getFullYear() !== ahora.getFullYear()) return false;
      } else if (rangoPredefinido === 'MES_ANTERIOR') {
        const mesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        if (fechaP.getMonth() !== mesAnt.getMonth() || fechaP.getFullYear() !== mesAnt.getFullYear()) return false;
      } else if (rangoPredefinido === 'ULTIMOS_30') {
        const limite = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (fechaP < limite) return false;
      } else if (rangoPredefinido === 'ULTIMOS_90') {
        const limite = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (fechaP < limite) return false;
      } else if (rangoPredefinido === 'ESTE_ANIO') {
        if (fechaP.getFullYear() !== ahora.getFullYear()) return false;
      } else if (rangoPredefinido === 'CUSTOM') {
        if (fechaDesde && fechaP < new Date(`${fechaDesde}T00:00:00`)) return false;
        if (fechaHasta && fechaP > new Date(`${fechaHasta}T23:59:59`)) return false;
      }

      // Filtro de estado
      const finalizado = p.cuotas.length > 0 && p.cuotas.every((c: any) => c.estado === 'PAGADA');
      if (filtroEstado === 'ACTIVOS' && finalizado) return false;
      if (filtroEstado === 'FINALIZADOS' && !finalizado) return false;

      // Filtro de mora
      const tieneCuotasVencidas = p.cuotas.some(
        (c: any) => c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str || c.fecha_vencimiento) < ahora
      );
      if (filtroMora === 'AL_DIA' && tieneCuotasVencidas) return false;
      if (filtroMora === 'EN_MORA' && !tieneCuotasVencidas) return false;

      // Filtro de búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const texto = `${p.cliente?.nombre_completo || ''} ${p.cliente?.dni || ''} ${p.id_prestamo}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }

      return true;
    });
  }, [prestamos, rangoPredefinido, fechaDesde, fechaHasta, filtroEstado, filtroMora, busqueda, ahora]);

  // 2. Métricas agregadas
  const metricas = useMemo(() => {
    let capitalColocadoUsd = 0;
    let totalDevolverUsd = 0;
    let capitalCobradoUsd = 0;
    let capitalCobradoArs = 0;
    let cuotasTotales = 0;
    let cuotasPagadas = 0;
    let cuotasVencidas = 0;
    let montoMoraUsd = 0;
    let discrepanciasDetectadas = 0;

    prestamosFiltrados.forEach((p) => {
      const cap = Number(p.capital_entregado_usd || 0);
      const tot = Number(p.total_devolver_usd || 0);
      capitalColocadoUsd += cap;
      totalDevolverUsd += tot;

      // Validación de integridad matemática:
      // ¿La suma de las cuotas coincide con el total_devolver_usd?
      const sumaCuotas = p.cuotas.reduce((sum: number, c: any) => sum + Number(c.monto_usd || 0), 0);
      if (Math.abs(sumaCuotas - tot) > 0.05) {
        discrepanciasDetectadas++;
      }

      p.cuotas.forEach((c: any) => {
        cuotasTotales++;
        const montoCuotaUsd = Number(c.monto_usd || 0);
        if (c.estado === 'PAGADA') {
          cuotasPagadas++;
          capitalCobradoUsd += montoCuotaUsd;
          const pagadoArs = Number(c.monto_pagado_ars || 0);
          capitalCobradoArs += pagadoArs > 0 ? pagadoArs : montoCuotaUsd * Number(c.cotizacion_pago || dolarActual);
        } else if (c.estado === 'PENDIENTE') {
          const vto = new Date(c.fecha_vto_str || c.fecha_vencimiento);
          if (vto < ahora) {
            cuotasVencidas++;
            montoMoraUsd += montoCuotaUsd;
          }
        }
      });
    });

    const gananciaPactadaUsd = Math.max(0, totalDevolverUsd - capitalColocadoUsd);
    const margenPactadoPct = capitalColocadoUsd > 0 ? (gananciaPactadaUsd / capitalColocadoUsd) * 100 : 0;
    const saldoPendienteUsd = Math.max(0, totalDevolverUsd - capitalCobradoUsd);
    const avanceCobranzaPct = totalDevolverUsd > 0 ? (capitalCobradoUsd / totalDevolverUsd) * 100 : 0;
    const gananciaRealCobradaUsd = capitalCobradoUsd * (gananciaPactadaUsd / (totalDevolverUsd || 1));

    const ticketPromedioUsd =
      prestamosFiltrados.length > 0 ? capitalColocadoUsd / prestamosFiltrados.length : 0;
    const plazoPromedioCuotas =
      prestamosFiltrados.length > 0 ? cuotasTotales / prestamosFiltrados.length : 0;
    const tasaMoraPct = cuotasTotales > 0 ? (cuotasVencidas / (cuotasTotales - cuotasPagadas || 1)) * 100 : 0;

    return {
      capitalColocadoUsd,
      capitalColocadoArs: capitalColocadoUsd * dolarActual,
      totalDevolverUsd,
      totalDevolverArs: totalDevolverUsd * dolarActual,
      gananciaPactadaUsd,
      gananciaPactadaArs: gananciaPactadaUsd * dolarActual,
      margenPactadoPct,
      capitalCobradoUsd,
      capitalCobradoArs,
      saldoPendienteUsd,
      saldoPendienteArs: saldoPendienteUsd * dolarActual,
      avanceCobranzaPct,
      gananciaRealCobradaUsd,
      cuotasTotales,
      cuotasPagadas,
      cuotasVencidas,
      montoMoraUsd,
      montoMoraArs: montoMoraUsd * dolarActual,
      tasaMoraPct,
      ticketPromedioUsd,
      plazoPromedioCuotas,
      discrepanciasDetectadas,
    };
  }, [prestamosFiltrados, dolarActual, ahora]);

  // 3. Proyección de cobranzas para los próximos 6 meses
  const proyeccionMeses = useMemo(() => {
    const meses: Array<{ label: string; mes: number; anio: number; usd: number; cuotasCount: number }> = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
      const nombreMes = d.toLocaleString('es-AR', { month: 'short' });
      meses.push({
        label: `${nombreMes.toUpperCase()} ${d.getFullYear()}`,
        mes: d.getMonth(),
        anio: d.getFullYear(),
        usd: 0,
        cuotasCount: 0,
      });
    }

    prestamos.forEach((p) => {
      p.cuotas.forEach((c: any) => {
        if (c.estado === 'PENDIENTE') {
          const vto = new Date(c.fecha_vto_str || c.fecha_vencimiento);
          const idx = meses.findIndex((m) => m.mes === vto.getMonth() && m.anio === vto.getFullYear());
          if (idx !== -1) {
            meses[idx].usd += Number(c.monto_usd || 0);
            meses[idx].cuotasCount++;
          }
        }
      });
    });

    return meses;
  }, [prestamos, ahora]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* BARRA DE FILTROS INTELIGENTES */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Píldoras de rango temporal */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setRangoPredefinido('TODO')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'TODO'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Histórico Completo
            </button>
            <button
              onClick={() => setRangoPredefinido('ESTE_MES')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'ESTE_MES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setRangoPredefinido('MES_ANTERIOR')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'MES_ANTERIOR'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Mes Anterior
            </button>
            <button
              onClick={() => setRangoPredefinido('ULTIMOS_30')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'ULTIMOS_30'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => setRangoPredefinido('ULTIMOS_90')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'ULTIMOS_90'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Últimos 90 días
            </button>
            <button
              onClick={() => setRangoPredefinido('ESTE_ANIO')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'ESTE_ANIO'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Este Año
            </button>
            <button
              onClick={() => setRangoPredefinido('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                rangoPredefinido === 'CUSTOM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Rango de fechas custom */}
          {rangoPredefinido === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          )}
        </div>

        {/* Filtros secundarios: Estado, Mora y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, DNI o # préstamo..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="TODOS">Todos los estados (Activos + Finalizados)</option>
            <option value="ACTIVOS">Solo Préstamos Activos</option>
            <option value="FINALIZADOS">Solo Préstamos Cancelados al 100%</option>
          </select>

          <select
            value={filtroMora}
            onChange={(e) => setFiltroMora(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="TODOS">Toda la Cartera (Al día + En mora)</option>
            <option value="AL_DIA">Solo Préstamos al Día (0 mora)</option>
            <option value="EN_MORA">Solo Préstamos con Cuotas Vencidas</option>
          </select>
        </div>
      </div>

      {/* PANEL DE VALIDACIÓN Y INTEGRIDAD MATEMÁTICA */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          metricas.discrepanciasDetectadas === 0
            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              metricas.discrepanciasDetectadas === 0
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-amber-500 text-white shadow-sm'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm">
              {metricas.discrepanciasDetectadas === 0
                ? 'Validación Matemática de Cartera: 100% Consistente'
                : `Atención: ${metricas.discrepanciasDetectadas} préstamos con discrepancias en cuotas`}
            </h4>
            <p className="text-xs opacity-80 mt-0.5">
              {metricas.discrepanciasDetectadas === 0
                ? `${prestamosFiltrados.length} contratos auditados. Cada cronograma de cuotas cuadra con exactitud milimétrica.`
                : 'Se detectaron diferencias entre el total a devolver pactado y la suma del cronograma de cuotas.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono font-bold">
          <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-current">
            {prestamosFiltrados.length} Créditos
          </span>
          <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-current">
            {metricas.cuotasTotales} Cuotas
          </span>
        </div>
      </div>

      {/* 6 TARJETAS KPI PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. CAPITAL DESEMBOLSADO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Capital Desembolsado
            </span>
            <HandCoins className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            U$S {Math.round(metricas.capitalColocadoUsd).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
            ≈ $ {Math.round(metricas.capitalColocadoArs).toLocaleString('es-AR')} ARS
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Ticket Promedio:</span>
            <strong className="text-slate-900 dark:text-white font-mono">
              U$S {Math.round(metricas.ticketPromedioUsd).toLocaleString('es-AR')}
            </strong>
          </div>
        </div>

        {/* 2. TOTAL CONTRATADO A DEVOLVER */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Pactado a Devolver
            </span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            U$S {Math.round(metricas.totalDevolverUsd).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
            ≈ $ {Math.round(metricas.totalDevolverArs).toLocaleString('es-AR')} ARS
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Plazo Medio:</span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {metricas.plazoPromedioCuotas.toFixed(1)} cuotas
            </strong>
          </div>
        </div>

        {/* 3. MARGEN / GANANCIA PROYECTADA */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Rendimiento Financiero Pactado
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-200 font-mono">
              U$S {Math.round(metricas.gananciaPactadaUsd).toLocaleString('es-AR')}
            </p>
            <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
              +{metricas.margenPactadoPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
            ≈ $ {Math.round(metricas.gananciaPactadaArs).toLocaleString('es-AR')} ARS
          </p>
          <div className="mt-3 pt-2.5 border-t border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex justify-between">
            <span>Ganancia Real Cobrada:</span>
            <strong className="font-mono">
              U$S {Math.round(metricas.gananciaRealCobradaUsd).toLocaleString('es-AR')}
            </strong>
          </div>
        </div>

        {/* 4. RECUPERO EFECTIVO (COBRANZAS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Capital Recuperado
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              U$S {Math.round(metricas.capitalCobradoUsd).toLocaleString('es-AR')}
            </p>
            <span className="text-xs font-bold text-slate-500">
              ({metricas.avanceCobranzaPct.toFixed(1)}%)
            </span>
          </div>
          {/* Barra de progreso de amortización */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, metricas.avanceCobranzaPct)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
            <span>{metricas.cuotasPagadas} de {metricas.cuotasTotales} cuotas pagadas</span>
          </div>
        </div>

        {/* 5. SALDO EN CALLE POR COBRAR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Saldo Pendiente en Calle
            </span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-2">
            U$S {Math.round(metricas.saldoPendienteUsd).toLocaleString('es-AR')}
          </p>
          <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
            ≈ $ {Math.round(metricas.saldoPendienteArs).toLocaleString('es-AR')} ARS
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Cuotas por Vencer:</span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {metricas.cuotasTotales - metricas.cuotasPagadas}
            </strong>
          </div>
        </div>

        {/* 6. ÍNDICE DE MORA */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            metricas.cuotasVencidas > 0
              ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                metricas.cuotasVencidas > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-400'
              }`}
            >
              Mora e Incumplimiento
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${metricas.cuotasVencidas > 0 ? 'text-red-600' : 'text-slate-400'}`}
            />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p
              className={`text-2xl sm:text-3xl font-black font-mono ${
                metricas.cuotasVencidas > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              U$S {Math.round(metricas.montoMoraUsd).toLocaleString('es-AR')}
            </p>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-md ${
                metricas.cuotasVencidas > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metricas.tasaMoraPct.toFixed(1)}% mora
            </span>
          </div>
          <p className="text-xs font-bold text-red-600/80 dark:text-red-400/80 font-mono mt-0.5">
            ≈ $ {Math.round(metricas.montoMoraArs).toLocaleString('es-AR')} ARS
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] flex justify-between">
            <span className="text-slate-500">Cuotas Impagas Vencidas:</span>
            <strong className="font-mono text-red-600 dark:text-red-400">
              {metricas.cuotasVencidas} cuotas
            </strong>
          </div>
        </div>
      </div>

      {/* PROYECCIÓN DE COBRANZAS FUTURAS (PRÓXIMOS 6 MESES) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Proyección de Flujo de Cobranzas (Próximos 6 Meses)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimación de ingresos futuros en base al cronograma de vencimientos de cuotas activas.
            </p>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            Planificado
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {proyeccionMeses.map((m) => (
            <div
              key={m.label}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center"
            >
              <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{m.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                U$S {Math.round(m.usd).toLocaleString('es-AR')}
              </p>
              <p className="text-[10px] font-bold text-slate-400 font-mono">
                ${Math.round(m.usd * dolarActual).toLocaleString('es-AR')}
              </p>
              <span className="inline-block mt-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {m.cuotasCount} cuotas
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

