'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalLoginAction, portalRegisterAction, portalRecuperarPasswordAction } from '@/actions/portal-auth';
import { ShieldCheck, UserCheck, Lock, User, Phone, Mail, Loader2, ArrowRight, KeyRound } from 'lucide-react';

export default function PortalLoginClient({
  tenantName,
  redirectTo = '/portal',
}: {
  tenantName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
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
    setLoading(false);

    if (!res.success) {
      if (res.needsPasswordSetup) {
        setNotice(res.error || '');
        setTab('REGISTER');
      } else {
        setError(res.error || 'Credenciales incorrectas');
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'No se pudo crear el acceso.');
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'No se pudo restablecer la contraseña.');
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="p-4 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8 space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-white">Área de Clientes</h1>
        <p className="text-xs text-slate-400">{tenantName}</p>
      </div>

      <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-black">
        <button
          type="button"
          onClick={() => {
            setTab('LOGIN');
            setError('');
          }}
          className={`py-2 rounded-xl transition ${
            tab === 'LOGIN' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('REGISTER');
            setError('');
          }}
          className={`py-2 rounded-xl transition ${
            tab === 'REGISTER' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Crear Clave / Registro
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold leading-relaxed">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold leading-relaxed">
          {notice}
        </div>
      )}

      {tab === 'LOGIN' ? (
        <form onSubmit={handleLogin} className="space-y-3.5 bg-slate-850 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Número de DNI
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 34567890"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-600 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setTab('RECOVER');
                setError('');
                setNotice('');
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Ingresar a mi cuenta
          </button>
        </form>
      ) : tab === 'REGISTER' ? (
        <form onSubmit={handleRegister} className="space-y-3.5 bg-slate-850 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Número de DNI
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 34567890"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="341-..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Email (opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@mail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Creá tu Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Confirmar y Acceder
          </button>
        </form>
      ) : (
        <form onSubmit={handleRecover} className="space-y-3.5 bg-slate-850 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div className="text-center pb-1">
            <p className="text-xs font-black text-white flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-400" /> Restablecer Contraseña
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Validamos tus datos con tu DNI y tu teléfono o email registrado.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Número de DNI
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 34567890"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Teléfono o Email Registrado
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ej. 3415556677 o juan@mail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Restablecer y Acceder
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setError('');
              setNotice('');
            }}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-white font-bold transition"
          >
            ← Volver a Iniciar Sesión
          </button>
        </form>
      )}
    </div>
  );
}
