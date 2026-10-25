'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalLoginAction, portalRegisterAction, portalRecuperarPasswordAction } from '@/actions/portal-auth';
import { Intro } from '@/components/intro/Intro';
import { Icono } from '@/components/intro/Icono';
import { getPalette } from '@/components/theme/palettes';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  Phone,
  Mail,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function PortalLoginClient({
  tenantName,
  redirectTo = '/portal',
  logoUrl,
  brandColor = '#FF6600',
  paletteId = 'orange',
}: {
  tenantName: string;
  redirectTo?: string;
  logoUrl?: string | null;
  brandColor?: string;
  paletteId?: string;
}) {
  const router = useRouter();
  const palette = getPalette(paletteId);
  const activeGradient = palette.gradient || 'linear-gradient(135deg, #FF8A2B, #E25700)';

  const [estado, setEstado] = useState<'verificando' | 'ingreso' | 'adentro'>('ingreso');
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'RECOVER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Form states
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [contacto, setContacto] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const res = await portalLoginAction({ dni, password });

    if (!res.success) {
      setLoading(false);
      if (res.needsPasswordSetup) {
        setNotice(res.error || 'Creá tu contraseña para acceder por primera vez.');
        setTab('REGISTER');
      } else {
        setError(res.error || 'Credenciales incorrectas');
      }
      return;
    }

    setEstado('adentro');
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 650);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const res = await portalRegisterAction({
      dni,
      nombre_completo: nombre,
      telefono,
      email,
      password,
    });

    if (!res.success) {
      setLoading(false);
      setError(res.error || 'No se pudo crear el acceso.');
      return;
    }

    setEstado('adentro');
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 650);
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const res = await portalRecuperarPasswordAction({
      dni,
      contacto,
      nuevaPassword,
    });

    if (!res.success) {
      setLoading(false);
      setError(res.error || 'No se pudo restablecer la contraseña.');
      return;
    }

    setEstado('adentro');
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 650);
  };

  return (
    <Intro
      estado={estado}
      config={{
        producto: tenantName,
        area: `${tenantName} · Portal de Clientes`,
        bajada: 'Consultá tus cuotas, préstamos y unidades de entrega inmediata.',
      }}
    >
      <div className="bh2-tarjeta__cuerpo">
        {/* Cabecera de la tarjeta */}
        <div className="bh2-tarjeta__cabeza">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  objectFit: 'contain',
                  background: '#F8FAFC',
                  padding: '4px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: activeGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(243, 115, 32, 0.35)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.05em',
                }}
              >
                {tenantName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: '1.1' }}>
                {tenantName}
              </h1>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Portal Oficial de Clientes
              </p>
            </div>
          </div>
          <span className="bhi-chip bhi-chip--info">Clientes</span>
        </div>

        <p className="bh2-tarjeta__bajada">
          Accedé a tus cuotas, planes de financiación y catálogo exclusivo.
        </p>

        {/* Selector de pestañas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setError('');
              setNotice('');
            }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === 'LOGIN' ? '#FFFFFF' : 'transparent',
              color: tab === 'LOGIN' ? '#0F172A' : '#64748B',
              boxShadow: tab === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('REGISTER');
              setError('');
              setNotice('');
            }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === 'REGISTER' ? '#FFFFFF' : 'transparent',
              color: tab === 'REGISTER' ? '#0F172A' : '#64748B',
              boxShadow: tab === 'REGISTER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Crear Clave
          </button>
        </div>

        {error && (
          <div className="bhi-alerta bhi-alerta--danger" role="alert" style={{ marginBottom: '14px' }}>
            <Icono nombre="error" tamano={20} />
            <div>
              <strong>Error de ingreso</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {notice && (
          <div className="bhi-alerta bhi-alerta--warning" style={{ marginBottom: '14px' }}>
            <Icono nombre="advertencia" tamano={20} />
            <div>{notice}</div>
          </div>
        )}

        {tab === 'LOGIN' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="portal-dni">
                Número de DNI
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="portal-dni"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Ej. 34567890"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="bhi-input"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
                />
              </div>
            </div>

            <div className="bhi-campo">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="bhi-etiqueta" htmlFor="portal-password" style={{ margin: 0 }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('RECOVER');
                    setError('');
                    setNotice('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: palette.primary,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="portal-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bhi-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bhi-boton bhi-boton--primario"
              disabled={loading}
              style={{
                marginTop: '4px',
                background: activeGradient,
                border: 'none',
                boxShadow: `0 4px 14px ${palette.glow}`,
              }}
            >
              {loading ? (
                <span className="bhi-girando" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loading ? 'Verificando cuenta…' : 'Ingresar a mi cuenta'}
            </button>

            <p className="bh2-seguro">
              <Icono nombre="candado" tamano={15} />
              Acceso seguro y encriptado para clientes de {tenantName}
            </p>
          </form>
        ) : tab === 'REGISTER' ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="reg-dni">
                Número de DNI
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="reg-dni"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Ej. 34567890"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="bhi-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="reg-nombre">
                Nombre Completo
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="reg-nombre"
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bhi-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="bhi-campo">
                <label className="bhi-etiqueta" htmlFor="reg-tel">
                  Teléfono
                </label>
                <div className="bhi-input-contenedor">
                  <span className="bhi-input-icono">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    id="reg-tel"
                    type="tel"
                    placeholder="341-..."
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="bhi-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
              <div className="bhi-campo">
                <label className="bhi-etiqueta" htmlFor="reg-email">
                  Email (opcional)
                </label>
                <div className="bhi-input-contenedor">
                  <span className="bhi-input-icono">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bhi-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="reg-pass">
                Creá tu Contraseña
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="reg-pass"
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bhi-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bhi-boton bhi-boton--primario"
              disabled={loading}
              style={{
                marginTop: '4px',
                background: activeGradient,
                border: 'none',
                boxShadow: `0 4px 14px ${palette.glow}`,
              }}
            >
              {loading ? (
                <span className="bhi-girando" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {loading ? 'Creando acceso…' : 'Confirmar y Acceder'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecover} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <KeyRound className="w-4 h-4" style={{ color: palette.primary }} /> Restablecer Contraseña
              </p>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Validamos tu identidad con tu DNI y tu teléfono o email registrado.
              </p>
            </div>

            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="rec-dni">
                Número de DNI
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="rec-dni"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Ej. 34567890"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="bhi-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="rec-contacto">
                Teléfono o Email Registrado
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <Phone className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="rec-contacto"
                  type="text"
                  required
                  placeholder="Ej. 3415556677 o juan@mail.com"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  className="bhi-input"
                />
              </div>
            </div>

            <div className="bhi-campo">
              <label className="bhi-etiqueta" htmlFor="rec-pass">
                Nueva Contraseña
              </label>
              <div className="bhi-input-contenedor">
                <span className="bhi-input-icono">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  id="rec-pass"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="bhi-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bhi-boton bhi-boton--primario"
              disabled={loading}
              style={{
                marginTop: '4px',
                background: activeGradient,
                border: 'none',
                boxShadow: `0 4px 14px ${palette.glow}`,
              }}
            >
              {loading ? (
                <span className="bhi-girando" aria-hidden="true" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              {loading ? 'Restableciendo…' : 'Restablecer y Acceder'}
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setError('');
                setNotice('');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '6px',
              }}
            >
              ← Volver a Iniciar Sesión
            </button>
          </form>
        )}
      </div>

      <div className="bh2-tarjeta__pie">
        <span>¿Dudas sobre tu financiación? Contactá al equipo de {tenantName}.</span>
      </div>
    </Intro>
  );
}
