'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserRound, Phone, Mail, MapPin, BadgeDollarSign, CarFront, HandCoins, CalendarClock, Printer, Target, ShieldCheck, KeyRound, Copy, Check, MessageSquare, Loader2, X } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import { resetearPasswordClienteAdminAction } from '@/actions/clientes';

type Tab = 'resumen' | 'oportunidades' | 'ventas' | 'senias' | 'prestamos';

export default function ClienteCarpetaClient({ cliente, dolarActual }: { cliente: any; dolarActual: number }) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [modalResetOpen, setModalResetOpen] = useState(false);
  const [passwordManual, setPasswordManual] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetResult, setResetResult] = useState<{ passwordGenerada: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const cleanPhone = (cliente.telefono || '').replace(/[^0-9]/g, '');

  const handleResetPassword = async () => {
    setLoadingReset(true);
    setCopied(false);
    const res = await resetearPasswordClienteAdminAction(cliente.id_cliente, passwordManual || undefined);
    setLoadingReset(false);
    if (!res.success) {
      alert(res.error || 'Error al restablecer la contraseña');
      return;
    }
    setResetResult({ passwordGenerada: res.passwordGenerada! });
  };
  const deudaUsd = useMemo(() => cliente.ventas.flatMap((v: any) => v.cuotas || []).filter((c: any) => c.estado === 'PENDIENTE').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0) + cliente.prestamos.flatMap((p: any) => p.cuotas || []).filter((c: any) => c.estado === 'PENDIENTE').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0), [cliente]);
  const ventasArs = cliente.ventas.reduce((s: number, v: any) => s + Number(v.precio_final_usd || 0) * Number(v.cotizacion_dolar_venta || dolarActual), 0);
  const ventasUsd = cliente.ventas.reduce((s: number, v: any) => s + Number(v.precio_final_usd || 0), 0);

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: UserRound },
    { id: 'oportunidades', label: 'Oportunidades', icon: Target, count: cliente.prospectos.length },
    { id: 'ventas', label: 'Ventas', icon: BadgeDollarSign, count: cliente.ventas.length },
    { id: 'senias', label: 'Reservas', icon: CarFront, count: cliente.senias.length },
    { id: 'prestamos', label: 'Préstamos', icon: HandCoins, count: cliente.prestamos.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <Link href="/clientes" className="text-sm font-bold text-slate-400 hover:text-white inline-flex items-center gap-2 mb-5"><ArrowLeft className="w-4 h-4" />Clientes</Link>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-black text-2xl">{cliente.nombre_completo.charAt(0).toUpperCase()}</div><div><p className="text-xs uppercase tracking-widest font-black text-blue-400">Carpeta de cliente</p><h1 className="text-3xl md:text-4xl font-black mt-1">{cliente.nombre_completo}</h1><p className="text-slate-400 mt-1">DNI {cliente.dni || 'S/D'} · CUIT/CUIL {cliente.cuit_cuil || 'S/D'}</p></div></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 min-w-0 xl:min-w-[520px]"><Metric label="Operaciones" value={String(cliente.ventas.length)} /><div className="bg-white/5 border border-white/10 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-slate-500">Volumen histórico</p><DualMoney ars={ventasArs} usd={ventasUsd} rate={dolarActual} compact primaryClassName="text-lg font-black text-white mt-1" secondaryClassName="text-[10px] text-slate-400" /></div><div className="bg-white/5 border border-white/10 rounded-2xl p-4 col-span-2 md:col-span-1"><p className="text-[10px] uppercase font-black text-slate-500">Saldo pendiente hoy</p><DualMoney usd={deudaUsd} rate={dolarActual} compact primaryClassName="text-lg font-black text-amber-300 mt-1" secondaryClassName="text-[10px] text-slate-400" /></div></div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto"><div className="flex min-w-max gap-1">{tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Icon className="w-4 h-4" />{tab.label}{typeof tab.count === 'number' && <span className={`px-1.5 py-0.5 rounded-md ${active ? 'bg-white/10' : 'bg-slate-100'}`}>{tab.count}</span>}</button>; })}</div></div>

      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <section className="bg-white border rounded-2xl p-5 shadow-sm">
              <h2 className="font-black text-slate-900 mb-5">Datos del cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info icon={Phone} label="Teléfono" value={cliente.telefono || 'No registrado'} />
                <Info icon={Mail} label="Email" value={cliente.email || 'No registrado'} />
                <Info icon={MapPin} label="Domicilio" value={[cliente.domicilio, cliente.localidad, cliente.provincia].filter(Boolean).join(' · ') || 'No registrado'} wide />
              </div>
              {cliente.notas && (
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border text-sm text-slate-600">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Notas internas</p>
                  {cliente.notas}
                </div>
              )}
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">Portal de Clientes (PWA)</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cliente.passwordHash ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {cliente.passwordHash ? 'Acceso Creado' : 'Sin Clave Creada'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      El cliente inicia sesión con su DNI: <strong className="text-white font-mono">{cliente.dni || 'Sin DNI'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResetResult(null);
                    setPasswordManual('');
                    setModalResetOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  {cliente.passwordHash ? 'Restablecer Clave' : 'Crear Clave de Acceso'}
                </button>
              </div>
            </section>
          </div>

          <section className="bg-white border rounded-2xl p-5 shadow-sm h-fit">
            <h2 className="font-black text-slate-900 mb-4">Actividad</h2>
            <div className="space-y-3">
              <Row label="Oportunidades comerciales" value={cliente.prospectos.length} />
              <Row label="Ventas" value={cliente.ventas.length} />
              <Row label="Reservas / señas" value={cliente.senias.length} />
              <Row label="Préstamos" value={cliente.prestamos.length} />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'oportunidades' && <Panel title="Oportunidades comerciales">{cliente.prospectos.length === 0 ? <Empty text="No hay oportunidades vinculadas." /> : cliente.prospectos.map((p: any) => { const q = p.cotizaciones?.[0]; return <Link key={p.id_prospecto} href={`/prospectos/${p.id_prospecto}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30"><div><p className="font-black text-slate-900">Operación #{p.id_prospecto} · {p.estado.replace(/_/g, ' ')}</p><p className="text-xs text-slate-500 mt-1">{p.vehiculo_interes ? `${p.vehiculo_interes.marca} ${p.vehiculo_interes.modelo} · ${p.vehiculo_interes.patente || 'S/P'}` : 'Sin unidad asignada'}</p></div>{q ? <DualMoney usd={q.precio_final_usd} rate={q.cotizacion_dolar || dolarActual} compact /> : <span className="text-xs font-bold text-slate-400">Sin cotización</span>}</Link>; })}</Panel>}

      {activeTab === 'ventas' && <Panel title="Ventas históricas">{cliente.ventas.length === 0 ? <Empty text="No hay ventas registradas." /> : cliente.ventas.map((v: any) => { const rate = Number(v.cotizacion_dolar_venta || dolarActual); return <div key={v.id_venta} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-xl p-4"><Link href={`/ventas/${v.id_venta}`} className="flex items-center gap-3"><CarFront className="w-5 h-5 text-blue-600" /><div><p className="font-black text-slate-900">{v.vehiculo?.marca} {v.vehiculo?.modelo}</p><p className="text-xs text-slate-500">{new Date(v.fecha_venta).toLocaleDateString('es-AR')} · {v.numero_boleto || `Venta #${v.id_venta}`}</p></div></Link><div className="flex items-center gap-3"><DualMoney usd={v.precio_final_usd} rate={rate} compact /><Link href={`/documentos/boleto/${v.id_venta}`} target="_blank" className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><Printer className="w-4 h-4" /></Link></div></div>; })}</Panel>}

      {activeTab === 'senias' && <Panel title="Reservas y señas">{cliente.senias.length === 0 ? <Empty text="No hay reservas registradas." /> : cliente.senias.map((s: any) => <div key={s.id_senia} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-xl p-4"><div><p className="font-black text-slate-900">{s.vehiculo?.marca} {s.vehiculo?.modelo}</p><p className="text-xs text-slate-500">{new Date(s.fecha_senia).toLocaleDateString('es-AR')} · {s.estado}</p></div><div className="flex items-center gap-3"><DualMoney ars={s.monto_ars} usd={s.monto_usd} rate={s.cotizacion || dolarActual} compact /><Link href={`/documentos/recibo/${s.id_senia}`} target="_blank" className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"><Printer className="w-4 h-4" /></Link></div></div>)}</Panel>}

      {activeTab === 'prestamos' && <Panel title="Préstamos">{cliente.prestamos.length === 0 ? <Empty text="No hay préstamos registrados." /> : cliente.prestamos.map((p: any) => { const pendientes = p.cuotas.filter((c: any) => c.estado === 'PENDIENTE').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0); return <div key={p.id_prestamo} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-xl p-4"><div className="flex items-center gap-3"><CalendarClock className="w-5 h-5 text-blue-600" /><div><p className="font-black text-slate-900">Préstamo #{p.id_prestamo}</p><p className="text-xs text-slate-500">{new Date(p.fecha_prestamo).toLocaleDateString('es-AR')} · {p.estado}</p></div></div><div className="text-right"><p className="text-[10px] uppercase font-black text-slate-400">Saldo equivalente hoy</p><DualMoney usd={pendientes} rate={dolarActual} compact /></div></div>; })}</Panel>}

      {modalResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Portal de Clientes
                </p>
                <h2 className="text-xl font-black mt-1">Gestión de Clave de Acceso</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cliente: <strong className="text-white">{cliente.nombre_completo}</strong> · DNI: <strong className="text-white font-mono">{cliente.dni || 'Sin DNI'}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalResetOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!resetResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Contraseña personalizada (opcional)
                  </label>
                  <input
                    type="text"
                    value={passwordManual}
                    onChange={(e) => setPasswordManual(e.target.value)}
                    placeholder="Dejá vacío para generar una clave aleatoria"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Si dejás el campo vacío, el sistema generará una clave aleatoria como <span className="font-mono text-slate-400">Auto4892</span>.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalResetOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loadingReset}
                    onClick={handleResetPassword}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loadingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Confirmar Clave
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-400">¡Contraseña establecida con éxito!</p>
                  <div className="py-2 px-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-2xl font-mono font-black text-emerald-300 tracking-wider">
                    {resetResult.passwordGenerada}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Las sesiones previas del cliente fueron cerradas por seguridad.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult.passwordGenerada);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold flex items-center justify-center gap-1.5 transition text-white cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    {copied ? 'Copiada' : 'Copiar Clave'}
                  </button>

                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hola ${cliente.nombre_completo}! Tu nueva clave de acceso para ver tus cuotas y préstamos en nuestro portal de clientes es: *${resetResult.passwordGenerada}*. Podés ingresar con tu DNI: *${cliente.dni || ''}*.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black flex items-center justify-center gap-1.5 transition text-white cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar WhatsApp
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setModalResetOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-white/5 border border-white/10 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-slate-500">{label}</p><p className="text-2xl font-black text-white mt-1">{value}</p></div>; }
function Info({ icon: Icon, label, value, wide }: any) { return <div className={`flex items-start gap-3 ${wide ? 'md:col-span-2' : ''}`}><div className="p-2.5 bg-slate-50 rounded-xl"><Icon className="w-5 h-5 text-slate-500" /></div><div><p className="text-[10px] uppercase font-black text-slate-400">{label}</p><p className="font-bold text-slate-800 mt-1">{value}</p></div></div>; }
function Row({ label, value }: { label: string; value: number }) { return <div className="flex justify-between items-center rounded-xl bg-slate-50 border p-3"><span className="text-sm font-bold text-slate-600">{label}</span><strong className="text-slate-900">{value}</strong></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="font-black text-slate-900 mb-4">{title}</h2><div className="space-y-3">{children}</div></section>; }
function Empty({ text }: { text: string }) { return <div className="border border-dashed rounded-xl p-8 text-center text-sm text-slate-500">{text}</div>; }
