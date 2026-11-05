'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  HandCoins,
  Plus,
  Search,
  UserRound,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Loader2,
  DollarSign,
  Phone,
  Printer,
  BarChart3,
  MessageCircle,
  Sliders,
  Pencil,
  LayoutGrid,
  List,
  TrendingUp,
  Percent,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import { cambiarEstadoSolicitudWebAction, aprobarYGenerarPrestamoAction } from '@/actions/prestamos-admin';
import PrestamosMetricasView from '@/components/prestamos/PrestamosMetricasView';
import ModalWhatsAppRecordatorio from '@/components/prestamos/ModalWhatsAppRecordatorio';
import ModalEditarPlanPrestamo from '@/components/prestamos/ModalEditarPlanPrestamo';

export default function PrestamosClient({
  prestamos,
  solicitudes = [],
  dolarActual,
  tenantName = 'OnlyCars',
}: {
  prestamos: any[];
  solicitudes?: any[];
  dolarActual: number;
  tenantName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'CARTERA' | 'SOLICITUDES' | 'METRICAS'>('CARTERA');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'FINALIZADOS'>('ACTIVOS');
  const [filtroSolicitudes, setFiltroSolicitudes] = useState<string>('TODAS');

  // Modal WhatsApp prearmado
  const [prestamoWhatsApp, setPrestamoWhatsApp] = useState<{
    cliente: { nombre: string; telefono: string; dni?: string };
    cuota: any;
  } | null>(null);

  // Modal Editar Plan de Préstamo
  const [prestamoEditando, setPrestamoEditando] = useState<any | null>(null);

  // Modo de visualización: Tarjetas vs Lista
  const [modoVista, setModoVista] = useState<'CARDS' | 'LISTA'>('CARDS');

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('onlycars_prestamos_view');
      if (saved === 'LISTA' || saved === 'CARDS') {
        setModoVista(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!modalAprobar) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalAprobar]);

  const handleToggleVista = (modo: 'CARDS' | 'LISTA') => {
    setModoVista(modo);
    try {
      localStorage.setItem('onlycars_prestamos_view', modo);
    } catch {}
  };

  const getFreqLabel = (cuotas: any[]) => {
    if (!cuotas || cuotas.length < 2) return 'Mensual';
    const t0 = new Date(cuotas[0].fecha_vto_str || cuotas[0].fecha_vencimiento).getTime();
    const t1 = new Date(cuotas[1].fecha_vto_str || cuotas[1].fecha_vencimiento).getTime();
    const diffDays = Math.round(Math.abs(t1 - t0) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'Diaria';
    if (diffDays >= 6 && diffDays <= 8) return 'Semanal';
    if (diffDays >= 13 && diffDays <= 16) return 'Quincenal';
    return 'Mensual';
  };

  const handleAbrirWhatsApp = (p: any) => {
    if (!p.cliente?.telefono) return;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cuotasPend = p.cuotas.filter((c: any) => c.estado !== 'PAGADA');
    const cTarget = cuotasPend[0] || p.cuotas[0];
    const vtoDate = cTarget?.fecha_vto_str ? new Date(cTarget.fecha_vto_str) : new Date();
    vtoDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((hoy.getTime() - vtoDate.getTime()) / (1000 * 60 * 60 * 24));
    setPrestamoWhatsApp({
      cliente: {
        nombre: p.cliente.nombre_completo,
        telefono: p.cliente.telefono,
        dni: p.cliente.dni,
      },
      cuota: cTarget
        ? {
            numero_cuota: cTarget.numero_cuota,
            total_cuotas: p.cuotas.length,
            monto_usd: cTarget.monto_usd,
            monto_ars:
              cTarget.monto_pagado_ars ||
              Math.round(
                Number(cTarget.monto_usd || 0) * (p.cotizacion_dolar_prestamo || dolarActual)
              ),
            fecha_vencimiento: cTarget.fecha_vto_str,
            id_operacion: `PREST-${p.id_prestamo}`,
            dias_mora: Math.max(0, diffDays),
            isVencida: diffDays > 0,
            isHoy: diffDays === 0,
          }
        : null,
    });
  };

  // Approval modal state
  const [modalAprobar, setModalAprobar] = useState<any | null>(null);
  const [capitalUsd, setCapitalUsd] = useState<number>(0);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [cuotasCount, setCuotasCount] = useState<number>(12);
  const [frecuenciaAprobar, setFrecuenciaAprobar] = useState<'MENSUAL' | 'SEMANAL' | 'DIARIA' | 'QUINCENAL'>('MENSUAL');
  const [primeraFecha, setPrimeraFecha] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  // Solicitudes counts
  const pendientesCount = solicitudes.filter(
    (s) => s.estado === 'PENDIENTE' || s.estado === 'EN_REVISION'
  ).length;

  const cartera = useMemo(() => {
    return prestamos
      .map((p) => {
        const pagadas = p.cuotas.filter((c: any) => c.estado === 'PAGADA');
        const pendientes = p.cuotas.filter((c: any) => c.estado === 'PENDIENTE');
        const pendienteUsd = pendientes.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
        const recuperadoUsd = pagadas.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
        const finalizado = pendientes.length === 0;
        return {
          ...p,
          resumen: { pagadas: pagadas.length, total: p.cuotas.length, pendienteUsd, recuperadoUsd, finalizado },
        };
      })
      .filter((p) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          `${p.cliente?.nombre_completo || ''} ${p.cliente?.dni || ''} ${p.id_prestamo}`
            .toLowerCase()
            .includes(q);
        const matchesState = filtroEstado === 'ACTIVOS' ? !p.resumen.finalizado : p.resumen.finalizado;
        return matchesSearch && matchesState;
      });
  }, [prestamos, searchTerm, filtroEstado]);

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        `${s.cliente?.nombre_completo || ''} ${s.cliente?.dni || ''} ${s.id}`.toLowerCase().includes(q);

      const matchEstado =
        filtroSolicitudes === 'TODAS' ||
        (filtroSolicitudes === 'PENDIENTES' && (s.estado === 'PENDIENTE' || s.estado === 'EN_REVISION')) ||
        s.estado === filtroSolicitudes;

      return matchSearch && matchEstado;
    });
  }, [solicitudes, searchTerm, filtroSolicitudes]);

  const totalPrestadoUsd = prestamos.reduce((s, p) => s + Number(p.capital_entregado_usd || 0), 0);
  const totalPrestadoArs = prestamos.reduce(
    (s, p) => s + Number(p.capital_entregado_usd || 0) * Number(p.cotizacion_dolar_prestamo || dolarActual),
    0
  );
  const totalPendienteUsd = prestamos.reduce(
    (s, p) =>
      s +
      p.cuotas
        .filter((c: any) => c.estado === 'PENDIENTE')
        .reduce((a: number, c: any) => a + Number(c.monto_usd || 0), 0),
    0
  );
  const gananciaProyectadaUsd = prestamos.reduce(
    (s, p) => s + Math.max(0, Number(p.total_devolver_usd || 0) - Number(p.capital_entregado_usd || 0)),
    0
  );

  const handleAbrirAprobacion = (s: any) => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    const dateStr = defaultDate.toISOString().slice(0, 10);

    setModalAprobar(s);
    setCapitalUsd(Number(s.monto_solicitado_usd));
    setTotalUsd(Math.round(Number(s.monto_solicitado_usd) * 1.3)); // 30% recargo por defecto
    setCuotasCount(s.cantidad_cuotas || 12);
    setPrimeraFecha(dateStr);
    setActionError('');
  };

  const handleConfirmarAprobacion = async () => {
    if (!modalAprobar) return;
    setLoadingAction(true);
    setActionError('');

    const res = await aprobarYGenerarPrestamoAction({
      solicitudId: modalAprobar.id,
      capitalEntregadoUsd: capitalUsd,
      totalDevolverUsd: totalUsd,
      cantidadCuotas: cuotasCount,
      primeraFechaVto: primeraFecha,
      frecuencia: frecuenciaAprobar,
    });

    setLoadingAction(false);
    if (!res.success) {
      setActionError(res.error || 'No se pudo aprobar.');
      return;
    }

    setModalAprobar(null);
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: any, motivoPrompt = false) => {
    let motivo: string | undefined = undefined;
    if (motivoPrompt) {
      const resp = prompt('Ingresá el motivo o mensaje para el cliente:');
      if (resp === null) return;
      motivo = resp;
    }

    setLoadingAction(true);
    await cambiarEstadoSolicitudWebAction({
      solicitudId: id,
      nuevoEstado,
      resolucionMotivo: motivo,
    });
    setLoadingAction(false);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-[var(--color-primary-default,#FF6600)]" /> Financiación y Préstamos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cartera activa, cobranzas y validación de solicitudes web de clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/prestamos/nuevo"
            className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo préstamo manual
          </Link>
        </div>
      </div>

      {/* Tabs Principales: Cartera vs Solicitudes Web */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('CARTERA')}
          className={`pb-3.5 text-sm font-black flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CARTERA'
              ? 'border-[var(--color-primary-default,#FF6600)] text-[var(--color-primary-default,#FF6600)]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HandCoins className="w-4 h-4" /> Cartera de Préstamos ({prestamos.length})
        </button>

        <button
          onClick={() => setActiveTab('SOLICITUDES')}
          className={`pb-3.5 text-sm font-black flex items-center gap-2 border-b-2 transition relative ${
            activeTab === 'SOLICITUDES'
              ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Solicitudes Web de Clientes ({solicitudes.length})
          {pendientesCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              {pendientesCount} nuevas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('METRICAS')}
          className={`pb-3.5 text-sm font-black flex items-center gap-2 border-b-2 transition relative ${
            activeTab === 'METRICAS'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Centro de Métricas & Auditoría
        </button>
      </div>

      {activeTab === 'METRICAS' && (
        <PrestamosMetricasView prestamos={prestamos} dolarActual={dolarActual} />
      )}

      {activeTab === 'CARTERA' && (
        <>
          {/* Métricas de Cartera */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Capital otorgado</p>
              <DualMoney
                ars={totalPrestadoArs}
                usd={totalPrestadoUsd}
                rate={dolarActual}
                primaryClassName="text-2xl font-black text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/40">
              <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase">Saldo pendiente</p>
              <DualMoney
                usd={totalPendienteUsd}
                rate={dolarActual}
                primaryClassName="text-2xl font-black text-indigo-950 dark:text-indigo-300"
              />
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/40">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">Ganancia proyectada</p>
              <DualMoney
                usd={gananciaProyectadaUsd}
                rate={dolarActual}
                primaryClassName="text-2xl font-black text-emerald-950 dark:text-emerald-300"
              />
            </div>
          </div>

          {/* Filtros y Selector de Vista */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, DNI o número de préstamo..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFiltroEstado('ACTIVOS')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    filtroEstado === 'ACTIVOS'
                      ? 'bg-white dark:bg-slate-700 shadow text-[var(--color-primary-default,#FF6600)] dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Activos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('FINALIZADOS')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    filtroEstado === 'FINALIZADOS'
                      ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Finalizados
                </button>
              </div>

              {/* Selector de Modo de Visualización: Tarjetas vs Lista */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleVista('CARDS')}
                  className={`px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    modoVista === 'CARDS'
                      ? 'bg-white dark:bg-slate-700 shadow text-[var(--color-primary-default,#FF6600)] dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Ver en Tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleVista('LISTA')}
                  className={`px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    modoVista === 'LISTA'
                      ? 'bg-white dark:bg-slate-700 shadow text-[var(--color-primary-default,#FF6600)] dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Ver en Lista / Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>
          </div>

          {/* VISTA SEGÚN MODO SELECCIONADO */}
          {modoVista === 'CARDS' ? (
            /* VISTA A: TARJETAS (CARDS) DETALLADAS */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cartera.map((p) => {
                const historicalRate = Number(p.cotizacion_dolar_prestamo || dolarActual);
                const capUsd = Number(p.capital_entregado_usd || 0);
                const totUsd = Number(p.total_devolver_usd || 0);
                const gananciaUsd = Math.max(0, totUsd - capUsd);
                const capitalArsOriginal = capUsd * historicalRate;
                const totalArsOriginal = totUsd * historicalRate;
                const gananciaArs = gananciaUsd * historicalRate;
                const margenPct = capUsd > 0 ? ((totUsd - capUsd) / capUsd) * 100 : 0;
                const margenStr = (margenPct % 1 === 0 ? margenPct.toFixed(0) : margenPct.toFixed(1)) + '%';
                const cuotasTotal = p.resumen?.total || p.cuotas?.length || 1;
                const cuotaMontoUsd = cuotasTotal > 0 ? totUsd / cuotasTotal : 0;
                const cuotaMontoArs = cuotaMontoUsd * historicalRate;
                const saldoPendienteArs = p.resumen.pendienteUsd * dolarActual;
                const pctAmortizado = cuotasTotal > 0 ? (p.resumen.pagadas / cuotasTotal) * 100 : 0;
                const freq = getFreqLabel(p.cuotas);
                const isMora =
                  !p.resumen.finalizado &&
                  p.cuotas.some((c: any) => c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < new Date());

                return (
                  <div
                    key={p.id_prestamo}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* ENCABEZADO DE TARJETA CON MARGEN DESTACADO */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 font-mono">
                            Préstamo #{p.id_prestamo}
                          </p>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {freq}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> +{margenStr} MARGEN
                          </span>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                          <UserRound className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> {p.cliente?.nombre_completo}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          DNI {p.cliente?.dni || 'S/N'} {p.cliente?.telefono ? `· Tel: ${p.cliente.telefono}` : ''} · <Calendar className="inline w-3 h-3" />{' '}
                          {new Date(p.fecha_str).toLocaleDateString('es-AR')}
                        </p>
                      </div>

                      {p.resumen.finalizado ? (
                        <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> FINALIZADO
                        </span>
                      ) : isMora ? (
                        <span className="text-[10px] font-black bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 rounded-full px-2.5 py-1 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" /> MORA
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-full px-2.5 py-1 shrink-0">
                          ACTIVO
                        </span>
                      )}
                    </div>

                    {/* GRILLA DE VALORES FINANCIEROS CLAROS: CAPITAL, MARGEN, TOTAL Y CUOTA */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {/* CAPITAL */}
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-2.5">
                        <p className="text-[9px] uppercase font-black text-slate-400">Capital Desembolsado</p>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm block mt-0.5">
                          $ {Math.round(capitalArsOriginal).toLocaleString('es-AR')}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          ≈ U$S {capUsd.toFixed(2)}
                        </span>
                      </div>

                      {/* MARGEN / INTERÉS COLOCADO */}
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] uppercase font-black text-emerald-700 dark:text-emerald-400">Margen Pactado</p>
                          <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded font-mono">
                            +{margenStr}
                          </span>
                        </div>
                        <strong className="text-emerald-950 dark:text-emerald-200 font-mono text-sm block mt-0.5">
                          +$ {Math.round(gananciaArs).toLocaleString('es-AR')}
                        </strong>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                          +U$S {gananciaUsd.toFixed(2)}
                        </span>
                      </div>

                      {/* TOTAL CONTRATO */}
                      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 p-2.5">
                        <p className="text-[9px] uppercase font-black text-indigo-500">Total Contrato</p>
                        <strong className="text-indigo-950 dark:text-indigo-200 font-mono text-sm block mt-0.5">
                          $ {Math.round(totalArsOriginal).toLocaleString('es-AR')}
                        </strong>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono block">
                          ≈ U$S {totUsd.toFixed(2)}
                        </span>
                      </div>

                      {/* VALOR POR CUOTA */}
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-2.5">
                        <p className="text-[9px] uppercase font-black text-slate-400">Valor Cuota ({freq})</p>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm block mt-0.5">
                          $ {Math.round(cuotaMontoArs).toLocaleString('es-AR')}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {cuotasTotal} cuotas · U$S {cuotaMontoUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* BARRA DE SALDO PENDIENTE Y TIPO DE CAMBIO PACTADO */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl px-3.5 py-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                          Saldo pendiente a cobrar:
                        </span>
                        <strong className="text-amber-950 dark:text-amber-200 font-mono font-black text-sm">
                          $ {Math.round(saldoPendienteArs).toLocaleString('es-AR')}
                        </strong>
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                          (≈ U$S {p.resumen.pendienteUsd.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>TC Pactado: <strong className="font-mono text-slate-700 dark:text-slate-200">${historicalRate.toLocaleString('es-AR')}</strong></span>
                        {historicalRate !== dolarActual && (
                          <span className="text-[10px] text-slate-400 font-mono">(Hoy: ${dolarActual.toLocaleString('es-AR')})</span>
                        )}
                      </div>
                    </div>

                    {/* PROGRESO DE AMORTIZACIÓN */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>Progreso de amortización</span>
                        <span>
                          {p.resumen.pagadas} de {cuotasTotal} cuotas pagadas ({Math.round(pctAmortizado)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${pctAmortizado}%` }}
                        />
                      </div>
                    </div>

                    {/* ACCIONES DE TARJETA */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {p.resumen.pagadas}/{cuotasTotal} cuotas ({freq})
                      </span>
                      <div className="flex items-center gap-2">
                        {p.cliente?.telefono && (
                          <button
                            type="button"
                            onClick={() => handleAbrirWhatsApp(p)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Enviar aviso o recordatorio por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        )}
                        <Link
                          href={`/documentos/prestamo/${p.id_prestamo}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Imprimir contrato / boleto de préstamo"
                        >
                          <Printer className="w-3.5 h-3.5" /> Boleto
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrestamoEditando(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Editar plan de cuotas, montos o frecuencia"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Editar Plan
                        </button>
                        <Link
                          href={`/cuotas?q=${encodeURIComponent(p.cliente?.nombre_completo || '')}`}
                          className="text-xs font-black text-[var(--color-primary-default,#FF6600)] flex items-center gap-1 hover:underline ml-1"
                        >
                          Ver cobranzas <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              {cartera.length === 0 && (
                <div className="xl:col-span-2 p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400">
                  No hay préstamos para este filtro.
                </div>
              )}
            </div>
          ) : (
            /* VISTA B: LISTA / TABLA DETALLADA COMPLETA (RESPONSIVA CON SCROLL HORIZONTAL) */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[1180px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-3"># Préstamo</th>
                      <th className="py-3 px-3">Cliente</th>
                      <th className="py-3 px-3">Otorgado / TC</th>
                      <th className="py-3 px-3 text-right">Capital Desembolsado</th>
                      <th className="py-3 px-3 text-center">Margen Pactado</th>
                      <th className="py-3 px-3 text-right">Total Contrato</th>
                      <th className="py-3 px-3 text-center">Cuota / Plan</th>
                      <th className="py-3 px-3 text-right">Saldo Pendiente</th>
                      <th className="py-3 px-3 text-center">Progreso</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {cartera.map((p) => {
                      const historicalRate = Number(p.cotizacion_dolar_prestamo || dolarActual);
                      const capUsd = Number(p.capital_entregado_usd || 0);
                      const totUsd = Number(p.total_devolver_usd || 0);
                      const gananciaUsd = Math.max(0, totUsd - capUsd);
                      const capitalArsOriginal = capUsd * historicalRate;
                      const totalArsOriginal = totUsd * historicalRate;
                      const gananciaArs = gananciaUsd * historicalRate;
                      const margenPct = capUsd > 0 ? ((totUsd - capUsd) / capUsd) * 100 : 0;
                      const margenStr = (margenPct % 1 === 0 ? margenPct.toFixed(0) : margenPct.toFixed(1)) + '%';
                      const cuotasTotal = p.resumen?.total || p.cuotas?.length || 1;
                      const cuotaMontoUsd = cuotasTotal > 0 ? totUsd / cuotasTotal : 0;
                      const cuotaMontoArs = cuotaMontoUsd * historicalRate;
                      const saldoPendienteArs = p.resumen.pendienteUsd * dolarActual;
                      const pctAmortizado = cuotasTotal > 0 ? (p.resumen.pagadas / cuotasTotal) * 100 : 0;
                      const freq = getFreqLabel(p.cuotas);
                      const isMora =
                        !p.resumen.finalizado &&
                        p.cuotas.some((c: any) => c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < new Date());

                      return (
                        <tr
                          key={p.id_prestamo}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* ID PRÉSTAMO */}
                          <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-slate-100">
                            #{p.id_prestamo}
                          </td>

                          {/* CLIENTE */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {p.cliente?.nombre_completo}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                              DNI {p.cliente?.dni || 'S/D'}
                              {p.cliente?.telefono ? ` · Tel: ${p.cliente.telefono}` : ''}
                            </span>
                          </td>

                          {/* OTORGADO Y TC */}
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            <span className="block font-medium">{new Date(p.fecha_str).toLocaleDateString('es-AR')}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              TC: ${historicalRate.toLocaleString('es-AR')}
                            </span>
                          </td>

                          {/* CAPITAL */}
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-black text-slate-900 dark:text-slate-100 block font-mono">
                              $ {Math.round(capitalArsOriginal).toLocaleString('es-AR')}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              U$S {capUsd.toFixed(2)}
                            </span>
                          </td>

                          {/* MARGEN PACTADO Y GANANCIA */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs font-mono">
                              +{margenStr}
                            </span>
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 block font-mono mt-0.5">
                              +$ {Math.round(gananciaArs).toLocaleString('es-AR')}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              +U$S {gananciaUsd.toFixed(2)}
                            </span>
                          </td>

                          {/* TOTAL CONTRATO */}
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-black text-slate-900 dark:text-slate-100 block font-mono">
                              $ {Math.round(totalArsOriginal).toLocaleString('es-AR')}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              U$S {totUsd.toFixed(2)}
                            </span>
                          </td>

                          {/* CUOTA Y PLAN */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-black text-slate-900 dark:text-slate-100 block font-mono">
                              $ {Math.round(cuotaMontoArs).toLocaleString('es-AR')}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5">
                              {cuotasTotal} cuotas {freq}
                            </span>
                          </td>

                          {/* SALDO PENDIENTE */}
                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`font-black block font-mono ${
                                p.resumen.pendienteUsd > 0
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              $ {Math.round(saldoPendienteArs).toLocaleString('es-AR')}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              U$S {p.resumen.pendienteUsd.toFixed(2)}
                            </span>
                          </td>

                          {/* PROGRESO */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                              {p.resumen.pagadas}/{cuotasTotal}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {Math.round(pctAmortizado)}%
                            </span>
                          </td>

                          {/* ESTADO */}
                          <td className="py-3.5 px-3 text-center">
                            {p.resumen.finalizado ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Finalizado
                              </span>
                            ) : isMora ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                                <AlertTriangle className="w-3 h-3" /> Mora
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                Activo
                              </span>
                            )}
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.cliente?.telefono && (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirWhatsApp(p)}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                                  title="WhatsApp / Cobranza"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <Link
                                href={`/documentos/prestamo/${p.id_prestamo}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                                title="Imprimir Boleto A4"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setPrestamoEditando(p)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition cursor-pointer"
                                title="Editar Plan"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                href={`/cuotas?q=${encodeURIComponent(p.cliente?.nombre_completo || '')}`}
                                className="p-1.5 rounded-lg bg-[var(--color-primary-default,#FF6600)]/10 text-[var(--color-primary-default,#FF6600)] hover:bg-[var(--color-primary-default,#FF6600)]/20 transition"
                                title="Ver Cobranzas"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {cartera.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  No hay préstamos para este filtro.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'SOLICITUDES' && (
        /* Pestaña: Solicitudes Web de Clientes */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, DNI o N° de solicitud..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto custom-scrollbar">
              {['TODAS', 'PENDIENTES', 'EN_REVISION', 'APROBADO', 'RECHAZADO'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroSolicitudes(st)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    filtroSolicitudes === st ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-100 font-black' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {st === 'TODAS'
                    ? 'Todas'
                    : st === 'PENDIENTES'
                    ? 'Por Validar'
                    : st === 'EN_REVISION'
                    ? 'En Revisión'
                    : st === 'APROBADO'
                    ? 'Aprobadas'
                    : 'Rechazadas'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {solicitudesFiltradas.map((s) => {
              const isPendiente = s.estado === 'PENDIENTE';
              const isRevision = s.estado === 'EN_REVISION';
              const docs = s.documentos || [];

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        Solicitud Web #{s.id} · {new Date(s.fecha_str).toLocaleDateString('es-AR')}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                        <UserRound className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> {s.cliente?.nombre_completo}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                        <span>DNI {s.cliente?.dni || 'S/N'}</span>
                        {s.cliente?.telefono && (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                            <Phone className="w-3 h-3" /> {s.cliente?.telefono}
                          </span>
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                        s.estado === 'APROBADO'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                          : s.estado === 'RECHAZADO'
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40'
                          : s.estado === 'EN_REVISION'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </div>

                  {/* Detalle Financiero Solicitado */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Monto pedido</p>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        $ {Number(s.monto_solicitado_ars || (Number(s.monto_solicitado_usd) * dolarActual)).toLocaleString('es-AR')}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">
                        ≈ U$S {Number(s.monto_solicitado_usd).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Cuotas</p>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{s.cantidad_cuotas} cuotas</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Ingresos decl.</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {s.ingresos_mensuales_ars
                          ? `$${Number(s.ingresos_mensuales_ars).toLocaleString('es-AR')}`
                          : 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {s.motivo && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200">Destino:</strong> {s.motivo}
                    </div>
                  )}

                  {/* Documentación Adjunta */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Documentación de respaldo ({docs.length}):
                    </p>
                    {docs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No se adjuntaron documentos.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {docs.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={doc.url_archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{doc.tipo_documento}: {doc.nombre_archivo}</span>
                            <ExternalLink className="w-3 h-3 text-blue-500" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {s.resolucion_motivo && (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">Respuesta enviada:</strong> {s.resolucion_motivo}
                    </div>
                  )}

                  {/* Acciones de Validación */}
                  {(isPendiente || isRevision) && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        {isPendiente && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(s.id, 'EN_REVISION')}
                            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition"
                          >
                            Marcar En Revisión
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(s.id, 'RECHAZADO', true)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-bold transition"
                        >
                          Rechazar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAbrirAprobacion(s)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
                      >
                        <ShieldCheck className="w-4 h-4" /> Aprobar y Crear Préstamo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {solicitudesFiltradas.length === 0 && (
              <div className="xl:col-span-2 p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400">
                No hay solicitudes para este filtro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Aprobación y Creación Formal de Préstamo */}
      {mounted && modalAprobar && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
        >
          <div className="absolute inset-0" onClick={() => setModalAprobar(null)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                Aprobación Directa
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Generar Préstamo para {modalAprobar.cliente?.nombre_completo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Al confirmar, se creará el préstamo y su plan de cuotas en el sistema.
              </p>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Capital a entregar (USD)
                </label>
                <input
                  type="number"
                  value={capitalUsd}
                  onChange={(e) => setCapitalUsd(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Total a devolver (USD)
                </label>
                <input
                  type="number"
                  value={totalUsd}
                  onChange={(e) => setTotalUsd(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Cantidad de Cuotas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cuotasCount}
                    onChange={(e) => setCuotasCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Frecuencia
                  </label>
                  <select
                    value={frecuenciaAprobar}
                    onChange={(e) => setFrecuenciaAprobar(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                  >
                    <option value="MENSUAL">📅 Mensual</option>
                    <option value="SEMANAL">🗓️ Semanal</option>
                    <option value="DIARIA">⏱️ Diaria</option>
                    <option value="QUINCENAL">📆 Quincenal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Primer Vencimiento
                </label>
                <input
                  type="date"
                  value={primeraFecha}
                  onChange={(e) => setPrimeraFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAprobar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleConfirmarAprobacion}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirmar y Activar Préstamo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {prestamoWhatsApp && (
        <ModalWhatsAppRecordatorio
          isOpen={!!prestamoWhatsApp}
          onClose={() => setPrestamoWhatsApp(null)}
          cliente={prestamoWhatsApp.cliente}
          cuota={prestamoWhatsApp.cuota}
          dolarActual={dolarActual}
          tenantName={tenantName}
        />
      )}

      {prestamoEditando && (
        <ModalEditarPlanPrestamo
          isOpen={Boolean(prestamoEditando)}
          onClose={() => setPrestamoEditando(null)}
          prestamo={prestamoEditando}
          dolarActual={dolarActual}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
