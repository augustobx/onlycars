'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import { cambiarEstadoSolicitudWebAction, aprobarYGenerarPrestamoAction } from '@/actions/prestamos-admin';

export default function PrestamosClient({
  prestamos,
  solicitudes = [],
  dolarActual,
}: {
  prestamos: any[];
  solicitudes?: any[];
  dolarActual: number;
}) {
  const [activeTab, setActiveTab] = useState<'CARTERA' | 'SOLICITUDES'>('CARTERA');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'FINALIZADOS'>('ACTIVOS');
  const [filtroSolicitudes, setFiltroSolicitudes] = useState<string>('TODAS');

  // Approval modal state
  const [modalAprobar, setModalAprobar] = useState<any | null>(null);
  const [capitalUsd, setCapitalUsd] = useState<number>(0);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [cuotasCount, setCuotasCount] = useState<number>(12);
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
      </div>

      {activeTab === 'CARTERA' ? (
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

          {/* Filtros */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, DNI o número de préstamo..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus,#FF6600)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFiltroEstado('ACTIVOS')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-colors ${
                  filtroEstado === 'ACTIVOS' ? 'bg-white dark:bg-slate-700 shadow text-[var(--color-primary-default,#FF6600)] dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFiltroEstado('FINALIZADOS')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-colors ${
                  filtroEstado === 'FINALIZADOS' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Finalizados
              </button>
            </div>
          </div>

          {/* Lista de préstamos */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {cartera.map((p) => {
              const historicalRate = Number(p.cotizacion_dolar_prestamo || dolarActual);
              const capitalArsOriginal = Number(p.capital_entregado_usd || 0) * historicalRate;
              const totalArsOriginal = Number(p.total_devolver_usd || 0) * historicalRate;
              return (
                <div
                  key={p.id_prestamo}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">
                        Préstamo #{p.id_prestamo}
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                        <UserRound className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> {p.cliente?.nombre_completo}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        DNI {p.cliente?.dni || 'S/N'} · <Calendar className="inline w-3 h-3" />{' '}
                        {new Date(p.fecha_str).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {p.resumen.finalizado ? (
                      <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> FINALIZADO
                      </span>
                    ) : p.cuotas.some(
                        (c: any) => c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < new Date()
                      ) ? (
                      <span className="text-[10px] font-black bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 rounded-full px-2.5 py-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> MORA
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-full px-2.5 py-1">
                        ACTIVO
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-3">
                      <p className="text-[10px] uppercase font-black text-slate-400">Capital original</p>
                      <DualMoney
                        ars={capitalArsOriginal}
                        usd={p.capital_entregado_usd}
                        rate={historicalRate}
                        compact
                        primaryClassName="font-black text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 p-3">
                      <p className="text-[10px] uppercase font-black text-indigo-500">Total contrato</p>
                      <DualMoney
                        ars={totalArsOriginal}
                        usd={p.total_devolver_usd}
                        rate={historicalRate}
                        compact
                        primaryClassName="font-black text-indigo-950 dark:text-indigo-300"
                      />
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 p-3">
                      <p className="text-[10px] uppercase font-black text-amber-600">Saldo a valor de hoy</p>
                      <DualMoney
                        usd={p.resumen.pendienteUsd}
                        rate={dolarActual}
                        compact
                        primaryClassName="font-black text-amber-950 dark:text-amber-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Cuotas pagadas: {p.resumen.pagadas}/{p.resumen.total}
                    </span>
                    <Link
                      href={`/cuotas?q=${encodeURIComponent(p.cliente?.nombre_completo || '')}`}
                      className="text-xs font-black text-[var(--color-primary-default,#FF6600)] flex items-center gap-1 hover:underline"
                    >
                      Ver cobranzas <ArrowRight className="w-3 h-3" />
                    </Link>
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
        </>
      ) : (
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
                        USD ${Number(s.monto_solicitado_usd).toLocaleString('es-AR')}
                      </p>
                      {s.monto_solicitado_ars && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          ${Number(s.monto_solicitado_ars).toLocaleString('es-AR')} ARS
                        </p>
                      )}
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
      {modalAprobar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
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
        </div>
      )}
    </div>
  );
}
