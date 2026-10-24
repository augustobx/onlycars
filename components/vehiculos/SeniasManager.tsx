'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { guardarSenia, cancelarSenia } from '@/actions/senias';
import { Loader2, Save, Ban, History, ShoppingCart, Printer } from 'lucide-react';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';
import { useConfigStore } from '@/store/useConfigStore';

export default function SeniasManager({ vehiculo, clientes, dolarActual }: { vehiculo: any; clientes: any[]; dolarActual?: number }) {
  const { dolarBlue } = useConfigStore();
  const rate = Number(dolarActual || dolarBlue || 1400);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idCliente, setIdCliente] = useState('');
  const [fechaSenia, setFechaSenia] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState({ ars: '', usd: '' });

  const seniasHistorial = vehiculo.senias || [];
  const seniaActiva = seniasHistorial.find((s: any) => s.estado === 'ACTIVA');
  const clientOptions = useMemo(() => (clientes || []).map((c: any) => ({
    value: String(c.id_cliente),
    label: c.nombre_completo,
    description: `DNI ${c.dni || 'S/N'}${c.telefono ? ` · ${c.telefono}` : ''}`,
    searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''}`,
  })), [clientes]);

  const handleGuardarSenia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || Number(monto.usd || 0) <= 0) return alert('Seleccioná cliente y monto de la reserva.');
    setIsSubmitting(true);
    const res = await guardarSenia({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: Number(idCliente),
      monto_ars: Number(monto.ars || 0),
      monto_usd: Number(monto.usd || 0),
      cotizacion: rate,
      fecha_senia: fechaSenia,
    });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la reserva.');
    setMonto({ ars: '', usd: '' });
    setIdCliente('');
  };

  const handleCancelarSenia = async (idSenia: number) => {
    if (!confirm('¿Cancelar esta reserva y liberar el vehículo?')) return;
    const res = await cancelarSenia(idSenia, vehiculo.id_vehiculo);
    if (!res.success) alert(res.error || 'No se pudo cancelar la reserva.');
  };

  return (
    <div className="space-y-6">
      {seniaActiva && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Reserva activa</p>
              <p className="text-lg font-black text-amber-950 dark:text-amber-100 mt-1">{seniaActiva.cliente?.nombre_completo}</p>
            </div>
            <span className="h-fit bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black px-3 py-1 rounded-full">
              ACTIVA
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase font-black text-amber-700/70 dark:text-amber-400">Fecha</p>
              <p className="font-bold text-amber-950 dark:text-amber-100">{new Date(seniaActiva.fecha_senia).toLocaleDateString('es-AR')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-amber-700/70 dark:text-amber-400">Monto</p>
              <DualMoney ars={seniaActiva.monto_ars} usd={seniaActiva.monto_usd} rate={seniaActiva.cotizacion || rate} primaryClassName="font-black text-amber-950 dark:text-amber-100" secondaryClassName="text-xs text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-amber-700/70 dark:text-amber-400">Cotización usada</p>
              <p className="font-bold text-amber-950 dark:text-amber-100">$ {Number(seniaActiva.cotizacion || 0).toLocaleString('es-AR')} / USD</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-amber-200 dark:border-amber-800/40">
            <Link href={`/documentos/recibo/${seniaActiva.id_senia}`} target="_blank" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors">
              <Printer className="w-4 h-4" /> Recibo
            </Link>
            <Link href={`/ventas/nueva?v=${vehiculo.id_vehiculo}&c=${seniaActiva.id_cliente}`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors">
              <ShoppingCart className="w-4 h-4" /> Pasar a venta
            </Link>
            <button onClick={() => handleCancelarSenia(seniaActiva.id_senia)} className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <Ban className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {vehiculo.estado !== 'VENDIDO' && !seniaActiva && (
        <form onSubmit={handleGuardarSenia} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100">Registrar reserva / seña</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Buscá el cliente y cargá el importe en cualquiera de las dos monedas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchCombobox label="Cliente" required value={idCliente} onChange={setIdCliente} options={clientOptions} placeholder="Buscar por nombre, DNI o teléfono..." />
            <label>
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Fecha *</span>
              <input
                type="date"
                value={fechaSenia}
                onChange={(e) => setFechaSenia(e.target.value)}
                required
                className="mt-1.5 w-full p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
              />
            </label>
          </div>
          <DualCurrencyInput label="Monto de la reserva" required ars={monto.ars} usd={monto.usd} rate={rate} onChange={setMonto} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white py-3 rounded-xl font-black flex justify-center items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar reserva
          </button>
        </form>
      )}

      <div>
        <h3 className="font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" /> Historial de reservas
        </h3>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-right px-4 py-3">Monto</th>
                <th className="text-center px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {seniasHistorial.map((s: any) => (
                <tr key={s.id_senia} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(s.fecha_senia).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{s.cliente?.nombre_completo}</td>
                  <td className="px-4 py-3 text-right">
                    <DualMoney ars={s.monto_ars} usd={s.monto_usd} rate={s.cotizacion || rate} compact primaryClassName="font-black text-slate-900 dark:text-slate-100" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${s.estado === 'ACTIVA' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {seniasHistorial.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Sin historial de reservas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
