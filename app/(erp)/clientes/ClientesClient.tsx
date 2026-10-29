'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, UserRound, Phone, Mail, MapPin, Edit, Loader2, Save, X, MessageCircle } from 'lucide-react';
import { guardarCliente, actualizarCliente } from '@/actions/clientes';
import ModalWhatsAppRecordatorio from '@/components/prestamos/ModalWhatsAppRecordatorio';

const EMPTY = { id_cliente: 0, nombre_completo: '', dni: '', cuit_cuil: '', telefono: '', email: '', domicilio: '', localidad: '', provincia: '', notas: '' };

export default function ClientesClient({
  clientes,
  tenantName = 'OnlyCars',
  dolarActual = 1400,
}: {
  clientes: any[];
  tenantName?: string;
  dolarActual?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState<any>(EMPTY);

  // Modal WhatsApp prearmado
  const [clienteWhatsApp, setClienteWhatsApp] = useState<{
    cliente: { nombre: string; telefono: string; dni?: string };
    cuota?: any;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) params.set('q', searchTerm.trim()); else params.delete('q');
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

  const openModal = (cliente?: any) => {
    setErrorMsg('');
    setFormData(cliente ? {
      id_cliente: cliente.id_cliente,
      nombre_completo: cliente.nombre_completo || '',
      dni: cliente.dni || '',
      cuit_cuil: cliente.cuit_cuil || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      domicilio: cliente.domicilio || '',
      localidad: cliente.localidad || '',
      provincia: cliente.provincia || '',
      notas: cliente.notas || '',
    } : EMPTY);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    const res = formData.id_cliente ? await actualizarCliente(formData.id_cliente, formData) : await guardarCliente(formData);
    setIsSubmitting(false);
    if (!res.success) return setErrorMsg(res.error || 'No se pudo guardar.');
    setIsModalOpen(false);
    router.refresh();
  };

  const input = 'w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]';
  const label = 'block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-primary-default,#FF6600)]">Comercial</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--text-primary-default,#FF6600)]" /> Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Directorio único con historial comercial, reservas y financiación.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" /> Nuevo cliente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-[460px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nombre, DNI/CUIT, teléfono o email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
            />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">{clientes.length} clientes registrados</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Identificación</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5 text-center">Actividad</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id_cliente} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0">
                          {c.nombre_completo?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100">{c.nombre_completo}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {[c.domicilio, c.localidad, c.provincia].filter(Boolean).join(' · ') || 'Sin domicilio'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-slate-800 dark:text-slate-200 font-bold">DNI {c.dni || 'S/D'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">CUIT {c.cuit_cuil || 'S/D'}</p>
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      {c.telefono && (
                        <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.telefono}
                        </p>
                      )}
                      {c.email && (
                        <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.email}
                        </p>
                      )}
                      {!c.telefono && !c.email && <span className="text-xs text-slate-400">Sin contacto</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                          {c._count.ventas} ventas
                        </span>
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-200/50 dark:border-blue-800/40">
                          {c._count.prestamos} préstamos
                        </span>
                        <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-bold border border-orange-200/50 dark:border-orange-800/40">
                          {c._count.senias} señas
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {c.telefono && (
                          <button
                            type="button"
                            onClick={() => setClienteWhatsApp({
                              cliente: {
                                nombre: c.nombre_completo,
                                telefono: c.telefono,
                                dni: c.dni,
                              },
                            })}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 transition-colors"
                            title="Enviar aviso o recordatorio por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => openModal(c)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                        <Link
                          href={`/clientes/${c.id_cliente}`}
                          className="px-3 py-1.5 text-xs font-black rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
                        >
                          Abrir carpeta
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mounted && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex justify-center items-start p-4 sm:p-6 overflow-y-auto min-h-screen">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-[var(--text-primary-default,#FF6600)]" />
                  {formData.id_cliente ? 'Editar cliente' : 'Nuevo cliente'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completá identificación y contacto para evitar registros duplicados.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {errorMsg && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm font-bold">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={label}>Nombre completo *</label>
                    <input required className={input} value={formData.nombre_completo} onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>DNI</label>
                    <input className={input} value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>CUIT / CUIL</label>
                    <input className={input} value={formData.cuit_cuil} onChange={(e) => setFormData({ ...formData, cuit_cuil: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Teléfono</label>
                    <input className={input} value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Email</label>
                    <input type="email" className={input} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Domicilio</label>
                    <input className={input} value={formData.domicilio} onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Localidad</label>
                    <input className={input} value={formData.localidad} onChange={(e) => setFormData({ ...formData, localidad: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Provincia</label>
                    <input className={input} value={formData.provincia} onChange={(e) => setFormData({ ...formData, provincia: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Notas internas</label>
                    <textarea className={`${input} min-h-24`} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar cliente
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {clienteWhatsApp && (
        <ModalWhatsAppRecordatorio
          isOpen={!!clienteWhatsApp}
          onClose={() => setClienteWhatsApp(null)}
          cliente={clienteWhatsApp.cliente}
          cuota={clienteWhatsApp.cuota}
          dolarActual={dolarActual}
          tenantName={tenantName}
        />
      )}
    </div>
  );
}
