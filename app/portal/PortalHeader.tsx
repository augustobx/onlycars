'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  FileText,
  HandCoins,
  CheckCircle2,
  Home,
  LogIn,
  LogOut,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import type { ClientPwaConfig } from '@/lib/client-pwa-config';
import type { ColorPalette } from '@/components/theme/palettes';

interface PortalHeaderProps {
  tenantName: string;
  logoUrl: string | null;
  dolarActual: number;
  currentCliente: { id_cliente: number; nombre_completo: string; dni?: string | null } | null;
  config: ClientPwaConfig;
  palette: ColorPalette;
}

export default function PortalHeader({
  tenantName,
  logoUrl,
  dolarActual,
  currentCliente,
  config,
  palette,
}: PortalHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/portal',
      label: 'Inicio',
      icon: Home,
      active: pathname === '/portal',
      show: true,
    },
    {
      href: '/portal/catalogo',
      label: 'Catálogo',
      icon: Car,
      active: pathname === '/portal/catalogo' || pathname.startsWith('/portal/catalogo/'),
      show: config.habilitarCatalogo !== false,
    },
    {
      href: '/portal/cuotas',
      label: 'Mis Cuotas',
      icon: FileText,
      active: pathname === '/portal/cuotas',
      show: config.habilitarPlanCuotas !== false,
    },
    {
      href: '/portal/prestamos',
      label: 'Préstamos',
      icon: HandCoins,
      active: pathname === '/portal/prestamos' || pathname === '/portal/prestamos/solicitar',
      show: config.habilitarPrestamos !== false || config.habilitarSolicitudPrestamos !== false,
    },
    {
      href: '/portal/prestamos/validaciones',
      label: 'Validación',
      icon: CheckCircle2,
      active: pathname === '/portal/prestamos/validaciones',
      show: config.habilitarSolicitudPrestamos !== false,
    },
  ].filter((item) => item.show);

  const activeGradient = palette.gradient || 'linear-gradient(135deg, #FF8A2B, #E25700)';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 transition-all duration-200">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Marca / Identidad */}
        <Link href="/portal" className="flex items-center gap-3 group flex-shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={tenantName}
              className="w-9 h-9 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800 shadow-md group-hover:scale-105 transition"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md group-hover:scale-105 transition"
              style={{ background: activeGradient, boxShadow: `0 4px 12px ${palette.glow}` }}
            >
              {tenantName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-black text-white leading-none tracking-tight group-hover:text-slate-200 transition">
              {tenantName}
            </p>
            <p
              className="text-[10px] font-bold leading-none mt-1"
              style={{ color: palette.primary }}
            >
              Portal Oficial de Clientes
            </p>
          </div>
        </Link>

        {/* Navegación Desktop (Pestañas) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  item.active
                    ? 'text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                style={
                  item.active
                    ? {
                        background: activeGradient,
                        boxShadow: `0 2px 8px ${palette.glow}`,
                      }
                    : undefined
                }
              >
                <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Acciones Derecha (Dólar, Perfil, Salir/Ingresar) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {dolarActual > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-300 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl shadow-inner">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 font-sans uppercase">USD</span>
              <span className="text-white font-black">${dolarActual.toLocaleString('es-AR')}</span>
            </div>
          )}

          {currentCliente ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full py-1 pl-1.5 pr-3 shadow-sm">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: activeGradient }}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight text-left">
                  <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                    {currentCliente.nombre_completo.split(' ')[0]}
                  </span>
                </div>
              </div>

              <form action="/api/portal/logout" method="POST">
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition shadow-sm"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/portal/login"
              className="text-xs font-black text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 active:scale-95 shadow-md"
              style={{
                background: activeGradient,
                boxShadow: `0 4px 12px ${palette.glow}`,
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
