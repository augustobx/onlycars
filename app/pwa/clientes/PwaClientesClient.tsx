'use client';

import { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  X,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import ModalWhatsAppRecordatorio from '@/components/prestamos/ModalWhatsAppRecordatorio';
import { guardarCliente } from '@/actions/clientes';
import { useRouter } from 'next/navigation';

export interface PwaClienteItem {
  id_cliente: number;
  nombre_completo: string;
  dni: string;
  cuit_cuil: string;
  telefono: string;
  email: string;
  domicilio: string;
  notas: string;
  totalCreditos: number;
  creditosActivos: number;
  totalCuotasPendientes: number;
  totalCuotasVencidas: number;
  deudaTotalArs: number;
  deudaTotalUsd: number;
  cuotaNotificar: {
    id_cuota: number;
    numero_cuota: number;
    total_cuotas: number;
    monto_usd: number;
    monto_ars: number;
    fecha_vencimiento: string;
    id_operacion: string;
    isVencida: boolean;
    isHoy: boolean;
    diasMora: number;
  } | null;
}

export function limpiarTelefono(tel?: string | null): string {
  if (!tel) return '';
  let cleaned = tel.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('15')) cleaned = cleaned.slice(2);
  if (!cleaned.startsWith('54')) cleaned = `549${cleaned}`;
  else if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = `549${cleaned.slice(2)}`;
  }
  return cleaned;
}

export default function PwaClientesClient({
  clientesIniciales,
  dolarActual,
  tenantName,
  tenantCuit,
}: {
  clientesIniciales: PwaClienteItem[];
  dolarActual: number;
  tenantName: string;
  tenantCuit?: string;
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_MORA' | 'ACTIVOS' | 'AL_DIA' | 'SIN_CREDITOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Modal nuevo cliente
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoDomicilio, setNuevoDomicilio] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal WhatsApp prearmado
  const [clienteAvisar, setClienteAvisar] = useState<PwaClienteItem | null>(null);

  // Totales
  const totalClientes = clientes.length;
  const enMoraCount = useMemo(() => clientes.filter((c) => c.totalCuotasVencidas > 0).length, [clientes]);
  const activosCount = useMemo(() => clientes.filter((c) => c.totalCuotasPendientes > 0).length, [clientes]);
  const deudaTotalGlobalArs = useMemo(() => clientes.reduce((acc, c) => acc + c.deudaTotalArs, 0), [clientes]);
  const deudaTotalGlobalUsd = useMemo(() => clientes.reduce((acc, c) => acc + c.deudaTotalUsd, 0), [clientes]);

  // Filtrado
  const clientesFiltrados = useMemo(() => {
    let list = clientes;
    if (filtro === 'EN_MORA') list = list.filter((c) => c.totalCuotasVencidas > 0);
    if (filtro === 'ACTIVOS') list = list.filter((c) => c.totalCuotasPendientes > 0);
    if (filtro === 'AL_DIA') list = list.filter((c) => c.totalCuotasPendientes > 0 && c.totalCuotasVencidas === 0);
    if (filtro === 'SIN_CREDITOS') list = list.filter((c) => c.totalCreditos === 0);

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.nombre_completo.toLowerCase().includes(term) ||
          c.dni.toLowerCase().includes(term) ||
          c.telefono.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.domicilio.toLowerCase().includes(term)
      );
    }
    return list;
  }, [clientes, filtro, busqueda]);

  const guardarClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      alert('El nombre completo es obligatorio.');
      return;
    }

    setGuardando(true);
    const res = await guardarCliente({
      nombre_completo: nuevoNombre.trim(),
      dni: nuevoDni.trim() || undefined,
      telefono: nuevoTelefono.trim() || undefined,
      email: nuevoEmail.trim() || undefined,
      domicilio: nuevoDomicilio.trim() || undefined,
      notas: nuevasNotas.trim() || undefined,
    });
    setGuardando(false);

    if (res.success) {
      setModalNuevo(false);
      setNuevoNombre('');
      setNuevoDni('');
      setNuevoTelefono('');
      setNuevoEmail('');
      setNuevoDomicilio('');
      setNuevasNotas('');
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar cliente.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 pb-24 select-none">
      {/* HEADER MÓVIL CON PROTECCIÓN DE NOTCH */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 pb-3 shadow-xs"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-wider text-indigo-700 block leading-none">
                Gestión de Clientes
              </span>
              <h1 className="text-base font-black text-slate-900 leading-tight">Cartera de Deudores</h1>
            </div>
          </div>

          <button
            onClick={() => setModalNuevo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* MÉTRICAS RÁPIDAS SUPERIORES (ARS EN FOCO, USD SECUNDARIO) */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-[9px] uppercase font-black text-slate-400 block">Total</span>
            <p className="font-mono text-xs font-black text-slate-900 mt-0.5">{totalClientes}</p>
            <span className="text-[9px] text-slate-400 font-medium">titulares</span>
          </div>

          <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
            <span className="text-[9px] uppercase font-black text-emerald-700 block">Activos</span>
            <p className="font-mono text-xs font-black text-emerald-900 mt-0.5">{activosCount}</p>
            <span className="text-[9px] text-emerald-600 font-medium">con cuotas</span>
          </div>

          <div className="bg-red-50/70 p-2 rounded-xl border border-red-100">
            <span className="text-[9px] uppercase font-black text-red-700 block">En Mora</span>
            <p className="font-mono text-xs font-black text-red-700 mt-0.5">{enMoraCount}</p>
            <span className="text-[9px] text-red-500 font-medium">atrasados</span>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DNI o teléfono..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* FILTROS HORIZONTALES */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'EN_MORA', label: '🚨 En Mora' },
            { id: 'ACTIVOS', label: 'Con Crédito' },
            { id: 'AL_DIA', label: 'Al Día' },
            { id: 'SIN_CREDITOS', label: 'Sin Créditos' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-black shrink-0 transition ${
                filtro === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE CLIENTES EN TARJETAS MÓVILES */}
      <div className="p-3 space-y-3">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No se encontraron clientes</p>
            <p className="text-xs text-slate-400 mt-1">Probá cambiando el filtro o la búsqueda.</p>
          </div>
        ) : (
          clientesFiltrados.map((c) => {
            const telLimpio = limpiarTelefono(c.telefono);
            const tieneMora = c.totalCuotasVencidas > 0;
            const tieneDeuda = c.totalCuotasPendientes > 0;

            return (
              <div
                key={c.id_cliente}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                  tieneMora ? 'border-red-300 bg-red-50/15' : 'border-slate-200'
                }`}
              >
                {/* ENCABEZADO */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-snug">{c.nombre_completo}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                      {c.dni && <span>DNI: {c.dni}</span>}
                      {c.telefono && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-700">{c.telefono}</span>
                        </>
                      )}
                    </div>
                    {c.domicilio && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.domicilio}</p>
                    )}
                  </div>

                  {/* ESTADO FINANCIERO */}
                  {tieneMora ? (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full shrink-0">
                      <AlertCircle className="w-3 h-3" /> Mora ({c.totalCuotasVencidas})
                    </span>
                  ) : tieneDeuda ? (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Al Día
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                      Sin Deuda
                    </span>
                  )}
                </div>

                {/* RESUMEN FINANCIERO DEL CLIENTE (ARS EN FOCO, USD SECUNDARIO) */}
                {tieneDeuda && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 block">
                        Saldo Pendiente ({c.totalCuotasPendientes} cuotas)
                      </span>
                      <strong className="text-slate-900 font-mono text-sm block">
                        $ {Math.round(c.deudaTotalArs).toLocaleString('es-AR')}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ≈ U$S {Math.round(c.deudaTotalUsd).toLocaleString('es-AR')}
                      </span>
                    </div>

                    {c.cuotaNotificar && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-black text-slate-400 block">
                          {c.cuotaNotificar.isVencida ? 'Cuota en Mora' : 'Próxima Cuota'}
                        </span>
                        <span className="font-mono text-xs font-black text-slate-800 block">
                          $ {Math.round(c.cuotaNotificar.monto_ars).toLocaleString('es-AR')}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          Vto: {new Date(c.cuotaNotificar.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTONES DE ACCIÓN: WHATSAPP AVISO + LLAMADA */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {telLimpio && (
                    <a
                      href={`tel:${telLimpio}`}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition"
                      title="Llamar al cliente"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  {/* BOTÓN WHATSAPP CON PLANTILLAS PREARMADAS */}
                  <button
                    type="button"
                    onClick={() => setClienteAvisar(c)}
                    disabled={!telLimpio}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {tieneMora ? 'Enviar Aviso de Mora' : tieneDeuda ? 'Recordatorio de Cuota' : 'WhatsApp'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL NUEVO CLIENTE RÁPIDO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <form
            onSubmit={guardarClienteSubmit}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm">Crear Nuevo Cliente</h3>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Nombre Completo *</span>
              <input
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-black uppercase text-slate-600 block mb-1">DNI / CUIT</span>
                <input
                  type="text"
                  placeholder="Ej: 35123456"
                  value={nuevoDni}
                  onChange={(e) => setNuevoDni(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase text-slate-600 block mb-1">Teléfono WhatsApp *</span>
                <input
                  type="text"
                  placeholder="Ej: 3329684696"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Email</span>
              <input
                type="email"
                placeholder="juan@gmail.com"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Domicilio / Localidad</span>
              <input
                type="text"
                placeholder="Ej: San Martín 123, San Pedro"
                value={nuevoDomicilio}
                onChange={(e) => setNuevoDomicilio(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Notas / Observaciones</span>
              <textarea
                rows={2}
                placeholder="Referencias comerciales o garantes..."
                value={nuevasNotas}
                onChange={(e) => setNuevasNotas(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Guardar Cliente</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE WHATSAPP CON PLANTILLAS PREARMADAS */}
      {clienteAvisar && (
        <ModalWhatsAppRecordatorio
          isOpen={!!clienteAvisar}
          onClose={() => setClienteAvisar(null)}
          cliente={{
            nombre: clienteAvisar.nombre_completo,
            telefono: clienteAvisar.telefono,
            dni: clienteAvisar.dni,
          }}
          cuota={
            clienteAvisar.cuotaNotificar
              ? {
                  numero_cuota: clienteAvisar.cuotaNotificar.numero_cuota,
                  total_cuotas: clienteAvisar.cuotaNotificar.total_cuotas,
                  monto_usd: clienteAvisar.cuotaNotificar.monto_usd,
                  monto_ars: clienteAvisar.cuotaNotificar.monto_ars,
                  fecha_vencimiento: clienteAvisar.cuotaNotificar.fecha_vencimiento,
                  id_operacion: clienteAvisar.cuotaNotificar.id_operacion,
                  dias_mora: clienteAvisar.cuotaNotificar.diasMora,
                  isVencida: clienteAvisar.cuotaNotificar.isVencida,
                  isHoy: clienteAvisar.cuotaNotificar.isHoy,
                }
              : null
          }
          tenantName={tenantName}
          tenantCuit={tenantCuit}
        />
      )}

      <PwaInstallPrompt />
      <PwaBottomNav active="clientes" />
    </div>
  );
}

