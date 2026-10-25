'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { crearSucursal } from '@/actions/sucursales';
import { Building, Plus, MapPin, Phone, Loader2, Search, X, Warehouse, BadgeDollarSign } from 'lucide-react';

export default function SucursalesClient({ initialSucursales, maxLocations }: { initialSucursales: any[]; maxLocations: number }) {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', isMain: false });

  useEffect(() => {
    setMounted(true);
  }, []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialSucursales.filter((s) => !q || `${s.name} ${s.code} ${s.address || ''} ${s.phone || ''}`.toLowerCase().includes(q));
  }, [initialSucursales, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await crearSucursal(form);
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'Error creando sucursal.');
    setIsModalOpen(false);
    window.location.reload();
  };

  const input = 'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]';
  const label = 'block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sucursal, código o dirección..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {initialSucursales.length} / {maxLocations} activas
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={initialSucursales.length >= maxLocations}
            className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Nueva sucursal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
            {s.isMain && (
              <span className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
                Sede central
              </span>
            )}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">{s.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{s.code}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
              {s.address ? (
                <p className="flex gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" />{s.address}</p>
              ) : (
                <p className="text-slate-400 dark:text-slate-500">Sin dirección registrada</p>
              )}
              {s.phone && (
                <p className="flex gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" />{s.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Metric icon={Warehouse} label="Stock" value={s._count?.vehiculos || 0} />
              <Metric icon={BadgeDollarSign} label="Ventas" value={s._count?.ventas || 0} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
            No se encontraron sucursales.
          </div>
        )}
      </div>

      {mounted && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">Nueva sucursal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Definí la sede operativa y su código interno.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={label}>Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name,
                      code: p.code || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    }));
                  }}
                  className={input}
                  placeholder="Salón Centro"
                />
              </div>
              <div>
                <label className={label}>Código interno *</label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={`${input} font-mono`} placeholder="centro" />
              </div>
              <div>
                <label className={label}>Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
              </div>
              <label className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3 text-sm font-bold text-blue-900 dark:text-blue-200 cursor-pointer">
                <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} className="rounded text-[var(--bg-primary-default,#FF6600)]" />
                Definir como sede principal
              </label>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear
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

function Metric({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mx-auto" />
      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 mt-1">{label}</p>
      <strong className="text-xl text-slate-900 dark:text-slate-100">{value}</strong>
    </div>
  );
}
