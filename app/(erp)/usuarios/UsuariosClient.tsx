'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cambiarClaveUsuario, crearUsuario, eliminarUsuario } from '@/actions/usuarios';
import { KeyRound, Loader2, Lock, Mail, Percent, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import SearchCombobox from '@/components/common/SearchCombobox';

export default function UsuariosClient({
  usuarios,
  locations,
  maxUsers,
  canCreateOwner,
}: {
  usuarios: any[];
  locations: any[];
  maxUsers: number;
  canCreateOwner: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'VENDEDOR', locationId: '', commissionPct: '0' });
  const [passwordTarget, setPasswordTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usuarios.filter((u) => !q || `${u.nombre} ${u.email} ${u.rol} ${u.sucursal}`.toLowerCase().includes(q));
  }, [usuarios, search]);

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: l.name,
    description: `${l.code}${l.address ? ` · ${l.address}` : ''}`,
    searchText: `${l.name} ${l.code} ${l.address || ''}`,
  }));

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await crearUsuario({
      nombre: form.nombre,
      email: form.email,
      password_plana: form.password,
      rol: form.rol as any,
      locationId: form.locationId || undefined,
      commissionPct: Number(form.commissionPct || 0),
    });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error);
    setIsModalOpen(false);
    setForm({ nombre: '', email: '', password: '', rol: 'VENDEDOR', locationId: '', commissionPct: '0' });
    window.location.reload();
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    if (newPassword.length < 8) return alert('La nueva contraseña debe tener al menos 8 caracteres.');
    setIsSubmitting(true);
    const res = await cambiarClaveUsuario(passwordTarget.id_usuario, newPassword);
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo cambiar la contraseña.');
    alert(`Contraseña actualizada para ${passwordTarget.nombre}. Sus sesiones anteriores fueron cerradas.`);
    setPasswordTarget(null);
    setNewPassword('');
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Desactivar el acceso de ${nombre}? El historial comercial se conserva.`)) return;
    const res = await eliminarUsuario(id);
    if (!res.success) alert(res.error);
    else window.location.reload();
  };

  const input = 'w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]';
  const label = 'block text-[11px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-primary-default,#FF6600)]">Gestión</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--text-primary-default,#FF6600)]" /> Usuarios y accesos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Roles, sucursal, comisión y credenciales de colaboradores.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={usuarios.length >= maxUsers}
          className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <UserPlus className="w-5 h-5" /> Nuevo colaborador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Usuarios activos</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{usuarios.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Límite del plan</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{maxUsers}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Sucursales activas</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{locations.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, email, rol o sucursal..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
            />
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Colaborador</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5">Sucursal</th>
                <th className="px-5 py-3.5 text-right">Comisión</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((u) => (
                <tr key={u.id_usuario} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-black text-slate-900 dark:text-slate-100">{u.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-200/50 dark:border-blue-800/40">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-bold">{u.sucursal}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                    {Number(u.commissionPct || 0).toLocaleString('es-AR')}%
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setPasswordTarget(u);
                          setNewPassword('');
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(u.id_usuario, u.nombre)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Desactivar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mounted && passwordTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <form onSubmit={handlePasswordReset} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Cambiar contraseña</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{passwordTarget.nombre} · {passwordTarget.email}</p>
              </div>
              <button type="button" onClick={() => setPasswordTarget(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-300">
                Al guardar, se cerrarán las sesiones activas de este colaborador y deberá volver a iniciar sesión.
              </div>
              <div>
                <label className={label}>Nueva contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    minLength={8}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${input} pl-9`}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setPasswordTarget(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Guardar clave
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {mounted && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-start z-[9999] p-4 sm:p-6 overflow-y-auto min-h-screen">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Alta de colaborador</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Definí acceso, rol y ámbito operativo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrear} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className={label}>Nombre completo *</label>
                  <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>Email de acceso *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${input} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={label}>Contraseña inicial *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${input} pl-9`} placeholder="Mínimo 8 caracteres" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Rol *</label>
                    <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className={input}>
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="TALLER">Taller</option>
                      <option value="MANAGER">Manager</option>
                      {canCreateOwner && <option value="OWNER">Owner</option>}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Comisión %</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input type="number" min="0" step="0.01" value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} className={`${input} pl-9`} />
                    </div>
                  </div>
                </div>
                <SearchCombobox label="Sucursal asignada" placeholder="Buscar sucursal..." value={form.locationId} onChange={value => setForm({ ...form, locationId: value })} options={locationOptions} emptyText="No hay sucursales activas." />
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Crear acceso
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
