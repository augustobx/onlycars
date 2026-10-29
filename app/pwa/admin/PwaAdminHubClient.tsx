'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  HandCoins,
  LayoutGrid,
  Calculator,
  Handshake,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  UserCircle,
  LogOut,
  ExternalLink,
  Wallet,
  Users,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import { logoutAction } from '@/actions/auth';
import { autoSyncDolar } from '@/actions/config';
import { useSellerPwaEnabled } from '../PwaCapabilities';

export default function PwaAdminHubClient({
  tenantName,
  userName,
  dolarActual,
  vehiculosCount,
  cuotasPendientesCount,
  prestamosActivosCount,
  clientesCount = 0,
  isFinancialOnly = false,
}: {
  tenantName: string;
  userName: string;
  dolarActual: number;
  vehiculosCount: number;
  cuotasPendientesCount: number;
  prestamosActivosCount: number;
  clientesCount?: number;
  isFinancialOnly?: boolean;
}) {
  const [dolar, setDolar] = useState(dolarActual);
  const sellerEnabled = useSellerPwaEnabled() && !isFinancialOnly;

  useEffect(() => {
    autoSyncDolar().then((res) => {
      if (res.success && res.valor && res.valor !== dolarActual) {
        setDolar(res.valor);
      }
    }).catch(() => {});
  }, [dolarActual]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white pb-24 select-none">
      {/* HEADER MÓVIL ADMIN CON COMPENSACIÓN DE NOTCH / DYNAMIC ISLAND */}
      <div
        className="p-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent border-b border-slate-800/60 relative overflow-hidden"
        style={{
          paddingTop: 'max(24px, calc(env(safe-area-inset-top, 0px) + 16px))',
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">
                {isFinancialOnly ? 'Panel Financiero Móvil' : 'Panel Administrador'}
              </span>
              <h1 className="text-xl font-black text-white tracking-tight">{tenantName}</h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Dólar Hoy</span>
            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg">
              $ {dolar.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* MÉTRICAS SUPERIORES SEGÚN MODO DE TENANT */}
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          {isFinancialOnly ? (
            <>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-emerald-400">Préstamos</p>
                <p className="text-sm font-black text-white font-mono mt-0.5">{prestamosActivosCount}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-amber-400">Cuotas Pend.</p>
                <p className="text-sm font-black text-amber-300 font-mono mt-0.5">{cuotasPendientesCount}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-indigo-400">Clientes</p>
                <p className="text-sm font-black text-indigo-300 font-mono mt-0.5">{clientesCount}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-slate-400">Stock</p>
                <p className="text-sm font-black text-white font-mono mt-0.5">{vehiculosCount}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-amber-400">Cuotas Pend.</p>
                <p className="text-sm font-black text-amber-300 font-mono mt-0.5">{cuotasPendientesCount}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                <p className="text-[9px] font-black uppercase text-emerald-400">Préstamos</p>
                <p className="text-sm font-black text-emerald-300 font-mono mt-0.5">{prestamosActivosCount}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ACCESOS DIRECTOS PRINCIPALES TÁCTILES */}
      <div className="p-4 space-y-3">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-1">
          {isFinancialOnly ? 'Módulos Financieros y Caja' : 'Módulos de Gestión Rápida'}
        </p>

        {/* 1. PRÉSTAMOS */}
        <Link
          href="/pwa/prestamos"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl hover:border-emerald-500/60 transition-all active:scale-98 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Préstamos y Créditos</h2>
              <p className="text-xs text-slate-400">Cartera activa, nuevo préstamo y boletos</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400" />
        </Link>

        {/* 1.B COTIZADOR / SIMULADOR MÓVIL (EN MODO FINANCIERO) */}
        {isFinancialOnly && (
          <Link
            href="/pwa/prestamos?tab=simulador"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl hover:border-amber-500/60 transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-base text-white">Cotizador de Créditos</h2>
                <p className="text-xs text-slate-400">Simulador en ARS/USD, % y cuotas libres</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </Link>
        )}

        {/* 2. REVISAR CUOTAS */}
        <Link
          href="/pwa/cuotas"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl hover:border-indigo-500/60 transition-all active:scale-98 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Cobranzas y Cuotas</h2>
              <p className="text-xs text-slate-400">Vencimientos, cobro rápido y recibos</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400" />
        </Link>

        {/* 3. CAJA Y GASTOS (PWA MÓVIL) */}
        <Link
          href="/pwa/caja"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl hover:border-purple-500/60 transition-all active:scale-98 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Caja y Finanzas</h2>
              <p className="text-xs text-slate-400">Flujo de fondos, nuevo movimiento y balances</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-400" />
        </Link>

        {/* 4. CLIENTES (PWA MÓVIL) */}
        <Link
          href="/pwa/clientes"
          className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all active:scale-98"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Cartera de Clientes</h2>
              <p className="text-xs text-slate-400">Titulares, deudores, llamadas y avisos WhatsApp</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400" />
        </Link>

        {/* STOCK E INVENTARIO (SOLO SI SELLER ESTÁ HABILITADO Y NO ES FINANCIERO) */}
        {sellerEnabled && (
          <Link
            href="/pwa/dashboard"
            className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all active:scale-98"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-base text-white">Stock e Inventario</h2>
                <p className="text-xs text-slate-400">Catálogo de vehículos y motos</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </Link>
        )}

        {/* COTIZADOR Y OPERACIONES VEHICULARES */}
        {sellerEnabled && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/pwa/cotizador"
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 active:scale-98"
            >
              <Calculator className="w-5 h-5 text-orange-400" />
              <div>
                <p className="font-black text-xs text-white">Cotizador</p>
                <p className="text-[10px] text-slate-500">Nueva venta</p>
              </div>
            </Link>
            <Link
              href="/pwa/operaciones"
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 active:scale-98"
            >
              <Handshake className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="font-black text-xs text-white">Operaciones</p>
                <p className="text-[10px] text-slate-500">Reservas y señas</p>
              </div>
            </Link>
          </div>
        )}

        {/* ACCESO A VERSIÓN DE ESCRITORIO */}
        <a
          href="/"
          className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50 text-slate-400 text-xs font-bold hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            Abrir versión de escritorio (ERP)
          </span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* FOOTER USUARIO */}
      <div className="mt-auto p-4 pt-6 border-t border-slate-900">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <UserCircle className="w-7 h-7 text-emerald-500" />
            <div>
              <p className="text-xs font-black text-white leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-400">Sesión Administrativa</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logoutAction();
              window.location.href = '/login';
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PwaInstallPrompt appType="admin" />
      <PwaBottomNav active="dash" />
    </div>
  );
}
