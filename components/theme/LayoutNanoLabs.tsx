'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  BadgeDollarSign,
  Users,
  CalendarClock,
  HandCoins,
  Settings,
  LogOut,
  Wallet,
  CarFront,
  ShieldCheck,
  Bike,
  UserCheck,
  Building,
  ShieldAlert,
  BookOpen,
  DollarSign,
  RefreshCw,
  Loader2,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { useConfigStore } from '@/store/useConfigStore';
import { syncDolarApi } from '@/actions/config';
import { PaletteSelector } from './PaletteSelector';
import { useERPTheme } from './ThemeContext';
import './nanolabs-theme.css';
import './nanolabs-theme-extra.css';

const CLAVE_PLEGADO = 'nl-sidebar-plegado';
const PLEGADO_W = 76;

function iniciales(nombre: string): string {
  return (
    nombre
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

type Role = 'OWNER' | 'MANAGER' | 'VENDEDOR' | 'ADMINISTRATIVO' | 'TALLER';
const ALL: Role[] = ['OWNER', 'MANAGER', 'VENDEDOR', 'ADMINISTRATIVO', 'TALLER'];
const COMMERCIAL: Role[] = ['OWNER', 'MANAGER', 'VENDEDOR', 'ADMINISTRATIVO'];
const ADMIN: Role[] = ['OWNER', 'MANAGER', 'ADMINISTRATIVO'];
const MANAGEMENT: Role[] = ['OWNER', 'MANAGER'];

export interface LayoutNanoLabsProps {
  tenantName?: string;
  tenantLogo?: string | null;
  userName?: string;
  userEmail?: string;
  currentRole?: string;
  isSuperAdmin?: boolean;
  canConfigure?: boolean;
  canSyncDolar?: boolean;
  initialDolar?: number;
  initialTipo?: string;
  onSwitchTheme?: (theme: '1' | '2') => void;
  children: ReactNode;
}

export function LayoutNanoLabs({
  tenantName = 'OnlyCars',
  userName = 'Usuario',
  userEmail = '',
  currentRole = 'VENDEDOR',
  isSuperAdmin = false,
  canConfigure = false,
  canSyncDolar = false,
  initialDolar = 1400,
  initialTipo = 'blue',
  onSwitchTheme,
  children,
}: LayoutNanoLabsProps) {
  const pathname = usePathname();
  const { palette, isDark, toggleDarkMode } = useERPTheme();
  const [plegado, setPlegado] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{ texto: string; top: number } | null>(null);

  const { dolarBlue, setDolar, tipoDolar, setTipoDolar } = useConfigStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlegado(localStorage.getItem(CLAVE_PLEGADO) === '1');
    setDolar(initialDolar);
    setTipoDolar(initialTipo);
  }, [initialDolar, initialTipo, setDolar, setTipoDolar]);

  const togglePlegado = () => {
    setPlegado((prev) => {
      const next = !prev;
      localStorage.setItem(CLAVE_PLEGADO, next ? '1' : '0');
      return next;
    });
  };

  const handleSyncDolar = async () => {
    if (!canSyncDolar) return;
    setIsSyncing(true);
    try {
      const res = await syncDolarApi(tipoDolar);
      if (res.success && res.valor) {
        setDolar(res.valor);
      } else {
        alert(res.error || 'Error actualizando cotización');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  const role = currentRole as Role;

  interface MenuCategory {
    categoria: string;
    items: {
      ruta: string;
      nombre: string;
      Icono: any;
      roles: Role[];
    }[];
  }

  const menuSections: MenuCategory[] = [
    {
      categoria: 'Comercial & Ventas',
      items: [
        { ruta: '/', nombre: 'Centro de Operaciones', Icono: LayoutDashboard, roles: ALL },
        { ruta: '/prospectos', nombre: 'Pipeline y Prospectos', Icono: UserCheck, roles: COMMERCIAL },
        { ruta: '/clientes', nombre: 'Clientes', Icono: Users, roles: COMMERCIAL },
        { ruta: '/vehiculos', nombre: 'Vehículos', Icono: Car, roles: ALL },
        { ruta: '/motos', nombre: 'Motos', Icono: Bike, roles: ALL },
        { ruta: '/consignaciones', nombre: 'Consignaciones', Icono: CarFront, roles: COMMERCIAL },
        { ruta: '/ventas', nombre: 'Ventas y Cotizador', Icono: BadgeDollarSign, roles: COMMERCIAL },
      ],
    },
    {
      categoria: 'Finanzas & Cobranzas',
      items: [
        { ruta: '/cuotas', nombre: 'Cobranzas y Cuotas', Icono: CalendarClock, roles: ADMIN },
        { ruta: '/prestamos', nombre: 'Financiación', Icono: HandCoins, roles: ADMIN },
        { ruta: '/caja', nombre: 'Caja y Gastos', Icono: Wallet, roles: ADMIN },
      ],
    },
    {
      categoria: 'Gestión & Sistema',
      items: [
        { ruta: '/sucursales', nombre: 'Sucursales', Icono: Building, roles: MANAGEMENT },
        { ruta: '/usuarios', nombre: 'Usuarios y Accesos', Icono: ShieldCheck, roles: MANAGEMENT },
        { ruta: '/manual', nombre: 'Manual de usuario', Icono: BookOpen, roles: ALL },
        ...(isSuperAdmin ? [{ ruta: '/superadmin', nombre: 'SuperAdmin Plataforma', Icono: ShieldAlert, roles: ALL }] : []),
      ],
    },
  ];

  const isActive = (ruta: string) => {
    if (ruta === '/') return pathname === '/';
    return pathname === ruta || pathname.startsWith(ruta + '/');
  };

  return (
    <div className="bh-layout theme-nanolabs" data-nl-theme="2">
      {/* HEADER 80px */}
      <header className="bh-header bh-header--retail">
        <Link href="/" className="bh-logo" style={{ textDecoration: 'none' }}>
          <div className="bh-logo__mark">
            <span
              className="ot-mark nl-mark"
              style={{
                background: palette.gradient,
                boxShadow: `0 4px 14px ${palette.glow}`,
              }}
            >
              <Car size={22} strokeWidth={2.2} />
            </span>
          </div>
          <div className="bh-logo__text">
            {tenantName}
            <span>NanoLabs Multi-Tenant Cloud</span>
          </div>
        </Link>

        <div className="bh-header__actions">
          {/* Live Dólar Quotation Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs">
            <DollarSign size={14} className="text-emerald-600 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Dólar {tipoDolar}</span>
            <span className="font-mono font-black text-slate-900 dark:text-white">$ {dolarBlue.toLocaleString('es-AR')}</span>
            {canSyncDolar && (
              <button
                type="button"
                onClick={handleSyncDolar}
                disabled={isSyncing}
                title="Actualizar cotización"
                className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
              >
                {isSyncing ? <Loader2 size={13} className="animate-spin text-emerald-600" /> : <RefreshCw size={13} />}
              </button>
            )}
          </div>

          {/* Color Palette Selector */}
          <PaletteSelector />

          {/* User info */}
          <div className="ot-usuario" title={userEmail}>
            <div className="bh-list-primary font-bold">{userName}</div>
            <div className="bh-list-secondary text-xs uppercase tracking-wider font-semibold opacity-75">
              {isSuperAdmin ? 'SuperAdmin' : role}
            </div>
          </div>

          {/* Avatar initials */}
          <div className="bh-avatar" title={userName}>
            {iniciales(userName)}
          </div>

          {/* Logout button */}
          <button
            type="button"
            className="bh-header__icon-btn text-red-500 hover:text-red-700"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* BODY WITH COLLAPSIBLE SIDEBAR */}
      <div className="bh-layout__body">
        <aside
          className={`bh-sidebar${plegado ? ' bh-sidebar--collapsed' : ''}`}
          aria-label="Pantallas"
          style={plegado ? { ['--bh-sidebar-width' as string]: `${PLEGADO_W}px` } : undefined}
        >
          <div className="flex-1 overflow-y-auto space-y-4 py-2 custom-scrollbar">
            {menuSections.map((sec, secIdx) => {
              const secItems = sec.items.filter((item) => isSuperAdmin || item.roles.includes(role));
              if (secItems.length === 0) return null;

              return (
                <div key={sec.categoria} className="space-y-1">
                  {!plegado ? (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {sec.categoria}
                    </div>
                  ) : secIdx > 0 ? (
                    <div className="my-2 border-t border-slate-200/60 dark:border-slate-800/60 mx-2" />
                  ) : null}

                  {secItems.map(({ ruta, nombre, Icono: I }) => {
                    const active = isActive(ruta);
                    return (
                      <Link
                        key={ruta}
                        href={ruta}
                        aria-label={nombre}
                        className={`bh-sidebar__item${active ? ' active' : ''}${plegado ? ' bh-sidebar__item--collapsed' : ''}`}
                        onMouseEnter={(e) => {
                          if (!plegado) return;
                          const r = e.currentTarget.getBoundingClientRect();
                          setTooltip({ texto: nombre, top: r.top + r.height / 2 });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <span className="bh-sidebar__icon-chip">
                          <I size={17} strokeWidth={2} />
                        </span>
                        {!plegado && <span className="truncate">{nombre}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* SIDEBAR FOOTER: SETTINGS + THEME (LIGHT/DARK) + COLLAPSE */}
          <div className={`bh-sidebar__footer${plegado ? ' bh-sidebar__footer--collapsed' : ''}`}>
            {canConfigure && (
              <Link
                href="/configuracion"
                className={`bh-sidebar__icon-btn${isActive('/configuracion') ? ' active text-[var(--color-primary-default,#FF6600)]' : ''}`}
                aria-label="Configuración"
                title="Configuración"
                onMouseEnter={(e) => {
                  if (!plegado) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setTooltip({ texto: 'Configuración', top: r.top + r.height / 2 });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <Settings size={18} />
              </Link>
            )}
            <button
              type="button"
              className="bh-sidebar__icon-btn"
              onClick={toggleDarkMode}
              aria-label="Cambiar tema claro u oscuro"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="bh-sidebar__icon-btn bh-sidebar__desktop-only"
              onClick={togglePlegado}
              aria-label={plegado ? 'Expandir menú' : 'Plegar menú'}
              title={plegado ? 'Expandir menú' : 'Plegar menú'}
            >
              {plegado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="bh-main bh-cascada ot-pagina min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* PORTAL TOOLTIP WHEN SIDEBAR IS COLLAPSED */}
      {mounted &&
        tooltip &&
        createPortal(
          <span
            className="bh-sidebar__tooltip ot-tooltip"
            style={{ top: tooltip.top, left: PLEGADO_W + 10, zIndex: 1000 }}
          >
            {tooltip.texto}
          </span>,
          document.body
        )}
    </div>
  );
}
