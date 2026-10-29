'use client';

import {
  HandCoins,
  CalendarClock,
  Wallet,
  Users,
  AlertTriangle,
  ArrowRight,
  Plus,
  Landmark,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import DualMoney from '@/components/common/DualMoney';

export interface DashboardFinancieroStats {
  prestamosActivos: number;
  cuotasPendientesMes: number;
  cuotasVencidas: number;
  clientesTotal: number;
  capitalColocadoUsd: number;
  capitalColocadoArs: number;
  totalDevolverUsd: number;
  totalDevolverArs: number;
  cobranzasMesUsd: number;
  cobranzasMesArs: number;
  saldoCajaAproximadoUsd: number;
  saldoCajaAproximadoArs: number;
}

export default function DashboardFinancieroClient({
  stats,
  dolarActual,
}: {
  stats: DashboardFinancieroStats;
  dolarActual: number;
}) {
  const operationalCards = [
    {
      label: 'Préstamos Activos',
      value: stats.prestamosActivos,
      detail: 'Créditos vigentes en cartera',
      href: '/prestamos',
      icon: HandCoins,
    },
    {
      label: 'Vencimientos del Mes',
      value: stats.cuotasPendientesMes,
      detail: 'Cuotas pendientes de cobro este mes',
      href: '/cuotas',
      icon: CalendarClock,
    },
    {
      label: 'Cuotas en Mora',
      value: stats.cuotasVencidas,
      detail: 'Vencidas impagas a la fecha',
      href: '/cuotas',
      icon: AlertTriangle,
      alert: stats.cuotasVencidas > 0,
    },
    {
      label: 'Clientes en Cartera',
      value: stats.clientesTotal,
      detail: 'Titulares y tomadores registrados',
      href: '/clientes',
      icon: Users,
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-[var(--color-primary-default,#FF6600)] bg-[var(--bg-primary-light,#FFF5EB)] dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-md px-2 py-1">
            Gestión Financiera
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-2">
            Centro de Operaciones Crediticias
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Control de cartera de préstamos, cobranzas, cuotas y flujo de caja en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/prestamos/nuevo"
            className="px-4 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Préstamo
          </Link>
          <Link
            href="/cuotas"
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-500" /> Cobrar Cuota
          </Link>
          <Link
            href="/caja"
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Wallet className="w-4 h-4 text-blue-500" /> Movimiento Caja
          </Link>
          <Link
            href="/clientes"
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" /> Clientes
          </Link>
        </div>
      </div>

      {/* Tarjetas de estado operativo */}
      <section>
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Hoy</p>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">Estado de Cartera</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {operationalCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p
                      className={`text-3xl font-black mt-2 ${
                        card.alert && card.value > 0
                          ? 'text-red-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {card.value ?? 0}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      card.alert && card.value > 0
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[var(--bg-primary-default,#FF6600)] group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.detail}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Métricas Financieras Principales */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Banner de Cobranzas del Mes */}
        <Link
          href="/cuotas"
          className="xl:col-span-2 bg-slate-950 rounded-2xl p-6 md:p-7 border border-slate-900 group overflow-hidden relative shadow-sm"
        >
          <TrendingUp className="absolute -right-6 -bottom-8 w-40 h-40 text-white opacity-[0.04]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-500">Mes en curso</p>
              <h3 className="text-sm font-bold text-slate-300 mt-2">Cobranzas Recaudadas en Cuotas</h3>
              <DualMoney
                ars={stats.cobranzasMesArs}
                usd={stats.cobranzasMesUsd}
                rate={dolarActual}
                primaryClassName="text-4xl md:text-5xl font-black text-emerald-400"
                secondaryClassName="text-sm font-bold text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-2">Pagos de amortización e intereses ingresados a caja este mes.</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
              Ver Cobranzas <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Card Capital Colocado en Préstamos */}
        <Link
          href="/prestamos"
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400 mt-6">
            Capital Activo Prestado
          </p>
          <DualMoney
            ars={stats.capitalColocadoArs}
            usd={stats.capitalColocadoUsd}
            rate={dolarActual}
            primaryClassName="text-3xl font-black text-slate-900 dark:text-slate-100"
            secondaryClassName="text-xs font-bold text-slate-500 dark:text-slate-400"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Monto de capital efectivamente desembolsado en préstamos activos.
          </p>
        </Link>
      </section>

      {/* Módulos Rápidos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/prestamos"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Financiación y Préstamos</h4>
              <p className="text-xs text-slate-500">Emisión de préstamos y tabla de cuotas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/cuotas"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Cobranzas y Recibos</h4>
              <p className="text-xs text-slate-500">Gestión de cuotas, mora y comprobantes</p>
            </div>
          </div>
        </Link>

        <Link
          href="/caja"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Caja y Gastos</h4>
              <p className="text-xs text-slate-500">Arqueos, ingresos, egresos y movimientos</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
