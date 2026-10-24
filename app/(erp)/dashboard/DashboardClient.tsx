'use client';

import {
  Car,
  BadgeDollarSign,
  ClipboardList,
  Wrench,
  TrendingUp,
  ArrowRight,
  Wallet,
  Users,
  UserCheck,
  CalendarClock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import DualMoney from '@/components/common/DualMoney';

export default function DashboardClient({ stats, dolarActual }: { stats: any; dolarActual: number }) {
  const operationalCards = [
    { label: 'Disponibles', value: stats.stockDisponible, detail: 'Unidades listas para comercializar', href: '/vehiculos?tab=listos', icon: Car },
    { label: 'En preparación', value: stats.enReparacion, detail: 'Unidades que todavía requieren trabajo', href: '/vehiculos?tab=en_preparacion', icon: Wrench },
    { label: 'Tareas pendientes', value: stats.tareasPendientes, detail: 'Acciones operativas por resolver', href: '/vehiculos', icon: ClipboardList },
    { label: 'Operaciones', value: stats.totalOperaciones, detail: 'Ventas registradas en el sistema', href: '/ventas', icon: BadgeDollarSign },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1500px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-[var(--color-primary-default,#FF6600)] bg-[var(--bg-primary-light,#FFF5EB)] dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-md px-2 py-1">Inicio</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-2">Centro de Operaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Lo importante de la concesionaria, ordenado para trabajar el día.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vehiculos/agregar" className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors">
            <Plus className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> Vehículo
          </Link>
          <Link href="/prospectos" className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors">
            <Plus className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> Prospecto
          </Link>
          <Link href="/ventas/nueva" className="px-4 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <BadgeDollarSign className="w-4 h-4" /> Nueva operación
          </Link>
        </div>
      </div>

      <section>
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Hoy</p>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">Estado operativo</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {operationalCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{card.value ?? 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-[var(--bg-primary-default,#FF6600)] group-hover:text-white transition-colors">
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

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Link href="/ventas" className="xl:col-span-2 bg-slate-950 rounded-2xl p-6 md:p-7 border border-slate-900 group overflow-hidden relative shadow-sm">
          <TrendingUp className="absolute -right-6 -bottom-8 w-40 h-40 text-white opacity-[0.04]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-500">Últimos 30 días</p>
              <h3 className="text-sm font-bold text-slate-300 mt-2">Ventas registradas</h3>
              <DualMoney ars={stats.ventasMesArs} usd={stats.ventasMesUsd} rate={dolarActual} primaryClassName="text-4xl md:text-5xl font-black text-white" secondaryClassName="text-sm font-bold text-slate-400" />
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
              Ver operaciones <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
        <Link href="/vehiculos" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 group shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400 mt-6">Capital de compra en stock</p>
          <DualMoney ars={stats.capitalStockArs} usd={stats.capitalStockUsd} rate={dolarActual} primaryClassName="text-3xl font-black text-slate-900 dark:text-slate-100" secondaryClassName="text-xs font-bold text-slate-500 dark:text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Valor acumulado de adquisición del inventario.</p>
        </Link>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Áreas de trabajo</p>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">Entrá por proceso, no por pantalla</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link href="/prospectos" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm group transition-shadow">
            <UserCheck className="w-5 h-5 text-[var(--color-primary-default,#FF6600)]" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 mt-4">Comercial</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Prospectos, seguimiento, cotizaciones y reservas.</p>
            <span className="text-xs font-bold text-[var(--color-primary-default,#FF6600)] inline-flex items-center gap-1 mt-4">Ir al pipeline <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
          <Link href="/vehiculos" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm group transition-shadow">
            <Car className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 mt-4">Inventario</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stock, preparación, motos y consignaciones.</p>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 mt-4">Ver stock <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
          <Link href="/ventas" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm group transition-shadow">
            <BadgeDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 mt-4">Operaciones</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ventas, permutas y entregas.</p>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 mt-4">Ver operaciones <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
          <Link href="/cuotas" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm group transition-shadow">
            <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 mt-4">Administración</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cuotas, financiación, caja y gastos.</p>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 mt-4">Ver cobranzas <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100">Accesos rápidos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acciones frecuentes sin recorrer el menú completo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/clientes" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors">
              <Users className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> Clientes
            </Link>
            <Link href="/caja" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Caja
            </Link>
            <Link href="/ventas/nueva" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-xs transition-colors">
              <BadgeDollarSign className="w-4 h-4 text-[var(--color-primary-default,#FF6600)]" /> Cotizar / Vender
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
