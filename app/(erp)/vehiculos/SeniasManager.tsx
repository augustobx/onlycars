'use client';

import { useState } from 'react';
import { guardarSenia, cancelarSenia } from '@/actions/senias';
import { Loader2, Save, Ban, DollarSign, Banknote, History } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';

export default function SeniasManager({ vehiculo, clientes }: { vehiculo: any; clientes: any[] }) {
  const { dolarBlue } = useConfigStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [idCliente, setIdCliente] = useState('');
  const [fechaSenia, setFechaSenia] = useState(new Date().toISOString().split('T')[0]);
  const [montoArs, setMontoArs] = useState('');
  const [montoUsd, setMontoUsd] = useState('');

  const seniasHistorial = vehiculo.senias || [];
  const seniaActiva = seniasHistorial.find((s: any) => s.estado === 'ACTIVA');

  // Conversión Bimonetaria
  const handleCurrencyChange = (from: 'ars' | 'usd', value: string) => {
    const numValue = parseFloat(value) || 0;
    const rate = Number(dolarBlue || 1400);
    if (from === 'ars') {
      setMontoArs(value);
      setMontoUsd(rate > 0 ? (numValue / rate).toFixed(2) : '');
    } else {
      setMontoUsd(value);
      setMontoArs(rate > 0 ? (numValue * rate).toFixed(0) : '');
    }
  };

  const handleGuardarSenia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || !montoUsd) return;
    setIsSubmitting(true);
    await guardarSenia({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: parseInt(idCliente),
      monto_ars: parseFloat(montoArs) || 0,
      monto_usd: parseFloat(montoUsd) || 0,
      cotizacion: dolarBlue,
      fecha_senia: fechaSenia,
    });
    setMontoArs('');
    setMontoUsd('');
    setIdCliente('');
    setIsSubmitting(false);
  };

  const handleCancelarSenia = async (idSenia: number) => {
    if (!confirm('¿Seguro que deseas cancelar esta seña y liberar el vehículo?')) return;
    await cancelarSenia(idSenia, vehiculo.id_vehiculo);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* SEÑA ACTIVA (Si existe) */}
      {seniaActiva && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Vehículo Señado</h3>
            <span className="bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold px-3 py-1 rounded-full">Activa</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400 uppercase">Cliente</p>
              <p className="text-amber-950 dark:text-amber-100 font-bold">{seniaActiva.cliente?.nombre_completo}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400 uppercase">Fecha</p>
              <p className="text-amber-950 dark:text-amber-100 font-bold">{new Date(seniaActiva.fecha_senia).toLocaleDateString('es-AR')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400 uppercase">Monto Entregado</p>
              <p className="text-emerald-700 dark:text-emerald-400 font-black">U$S {Number(seniaActiva.monto_usd).toLocaleString()}</p>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">$ {Number(seniaActiva.monto_ars).toLocaleString()} ARS</p>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400 uppercase">Cotización Tomada</p>
              <p className="text-amber-950 dark:text-amber-100 font-mono">$ {Number(seniaActiva.cotizacion).toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={() => handleCancelarSenia(seniaActiva.id_senia)}
            className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Ban className="w-4 h-4" /> Cancelar Seña y Liberar Vehículo
          </button>
        </div>
      )}

      {/* FORMULARIO NUEVA SEÑA (Solo si no está vendido) */}
      {vehiculo.estado !== 'VENDIDO' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">Registrar Nueva Seña</h3>
          <form onSubmit={handleGuardarSenia} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Cliente *</label>
              <select
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
              >
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_completo}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha *</label>
              <input
                type="date"
                value={fechaSenia}
                onChange={(e) => setFechaSenia(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Monto ARS</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400 dark:text-slate-500 pointer-events-none">ARS $</span>
                <input
                  type="number"
                  step="any"
                  value={montoArs}
                  onChange={(e) => handleCurrencyChange('ars', e.target.value)}
                  className="w-full pl-14 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Monto USD *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 pointer-events-none">USD $</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={montoUsd}
                  onChange={(e) => handleCurrencyChange('usd', e.target.value)}
                  className="w-full pl-14 pr-3 py-2 text-sm border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="lg:col-span-4 mt-2">
              <button
                type="submit"
                disabled={isSubmitting || !!seniaActiva}
                className="w-full bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Seña
              </button>
              {seniaActiva && <p className="text-xs text-center text-red-500 dark:text-red-400 mt-2 font-medium">Debes cancelar la seña activa antes de cargar una nueva.</p>}
            </div>
          </form>
        </div>
      )}

      {/* TABLA HISTORIAL */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" /> Historial de Señas
        </h3>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">USD</th>
                <th className="px-4 py-3 text-right">ARS</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {seniasHistorial.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No hay historial de señas.</td>
                </tr>
              ) : (
                seniasHistorial.map((s: any) => (
                  <tr key={s.id_senia} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(s.fecha_senia).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.cliente?.nombre_completo}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">U$S {Number(s.monto_usd).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">$ {Number(s.monto_ars).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${s.estado === 'ACTIVA' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {s.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}