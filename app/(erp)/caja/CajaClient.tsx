'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registrarMovimiento } from '@/actions/caja';
import { Wallet, TrendingUp, TrendingDown, Plus, Search, Calendar, Loader2, X, Receipt } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import SearchCombobox from '@/components/common/SearchCombobox';

export default function CajaClient({ transacciones, vehiculos, dolarActual }: { transacciones: any[]; vehiculos: any[]; dolarActual: number }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Mantenimiento Local');
  const [tipoMov, setTipoMov] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [monto, setMonto] = useState({ ars: '', usd: '' });
  const [vehiculoId, setVehiculoId] = useState('');

  const txFiltradas = useMemo(() => {
    const now = new Date();
    return transacciones.filter((tx) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || `${tx.concepto || ''} ${tx.categoria || ''} ${tx.referencia || ''}`.toLowerCase().includes(q);
      const date = new Date(tx.fecha_str);
      const matchesMonth = filtroMes !== 'este_mes' || (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());
      return matchesSearch && matchesMonth;
    });
  }, [transacciones, searchTerm, filtroMes]);

  const totalIngresosArs = txFiltradas.filter(t => t.tipo === 'INGRESO').reduce((acc, t) => acc + Number(t.monto_ars || 0), 0);
  const totalIngresosUsd = txFiltradas.filter(t => t.tipo === 'INGRESO').reduce((acc, t) => acc + Number(t.monto_usd || 0), 0);
  const totalEgresosArs = txFiltradas.filter(t => t.tipo === 'EGRESO').reduce((acc, t) => acc + Number(t.monto_ars || 0), 0);
  const totalEgresosUsd = txFiltradas.filter(t => t.tipo === 'EGRESO').reduce((acc, t) => acc + Number(t.monto_usd || 0), 0);
  const saldoArs = totalIngresosArs - totalEgresosArs;
  const saldoUsd = totalIngresosUsd - totalEgresosUsd;

  const vehicleOptions = vehiculos.map(v => ({ value: String(v.id_vehiculo), label: v.label, description: v.description, searchText: `${v.label} ${v.description}` }));

  const handleGuardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoArs = Number(monto.ars || 0);
    if (!concepto.trim() || montoArs <= 0) return alert('Completá concepto y monto.');
    setIsSubmitting(true);
    const res = await registrarMovimiento({
      descripcion: concepto.trim(),
      categoria,
      tipo: tipoMov,
      monto_ars: montoArs,
      cotizacion_dia: dolarActual,
      id_vehiculo: vehiculoId ? Number(vehiculoId) : undefined,
    });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el movimiento.');
    setIsModalOpen(false);
    setConcepto('');
    setMonto({ ars: '', usd: '' });
    setVehiculoId('');
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /> Caja y Movimientos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ingresos, egresos y movimientos vinculables al inventario.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" /> Registrar movimiento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Saldo neto</p>
          <DualMoney ars={saldoArs} usd={saldoUsd} rate={dolarActual} primaryClassName={`text-2xl sm:text-3xl font-black ${saldoArs >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`} />
        </div>
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
          <TrendingUp className="w-6 h-6 text-emerald-700 dark:text-emerald-400 mb-2" />
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ingresos</p>
          <DualMoney ars={totalIngresosArs} usd={totalIngresosUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-emerald-900 dark:text-emerald-200" />
        </div>
        <div className="bg-red-50/70 dark:bg-red-950/20 p-6 rounded-2xl border border-red-200 dark:border-red-800/40 shadow-sm">
          <TrendingDown className="w-6 h-6 text-red-700 dark:text-red-400 mb-2" />
          <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider">Egresos</p>
          <DualMoney ars={totalEgresosArs} usd={totalEgresosUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-red-900 dark:text-red-200" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, categoría o referencia..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
            />
          </div>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
          >
            <option value="todos">Todo el historial</option>
            <option value="este_mes">Este mes</option>
          </select>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 w-36">Fecha</th>
                <th className="text-left px-5 py-3.5">Concepto</th>
                <th className="text-left px-5 py-3.5">Categoría / Referencia</th>
                <th className="text-right px-5 py-3.5 w-44">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {txFiltradas.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      {new Date(tx.fecha_str).toLocaleDateString('es-AR')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{tx.concepto}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tx.id}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-700 dark:text-slate-300">{tx.categoria}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{tx.referencia}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DualMoney
                      ars={tx.monto_ars}
                      usd={tx.monto_usd}
                      rate={dolarActual}
                      compact
                      primaryClassName={`font-black ${tx.tipo === 'INGRESO' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
                    />
                  </td>
                </tr>
              ))}
              {txFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    No hay movimientos para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleGuardarMovimiento} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[var(--text-primary-default,#FF6600)]" /> Registrar movimiento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">El importe queda guardado en ARS y USD.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tipo *</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipoMov('EGRESO')}
                  className={`py-2 rounded-lg font-black text-sm transition-all ${tipoMov === 'EGRESO' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Egreso
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMov('INGRESO')}
                  className={`py-2 rounded-lg font-black text-sm transition-all ${tipoMov === 'INGRESO' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Ingreso
                </button>
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Concepto / descripción *</span>
              <input
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Lavado de unidad, pago de servicio..."
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Categoría *</span>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                >
                  <option>Mantenimiento Local</option>
                  <option>Gestoria y Tramites</option>
                  <option>Sueldos</option>
                  <option>Servicios</option>
                  <option>Aporte Socios</option>
                  <option>Otros</option>
                </select>
              </label>
              <SearchCombobox
                label="Vincular a vehículo"
                value={vehiculoId}
                onChange={setVehiculoId}
                options={vehicleOptions}
                placeholder="Buscar marca, modelo o patente..."
                helper="Opcional. Si es un egreso, se suma al costo real de esa unidad."
              />
            </div>
            <DualCurrencyInput label="Monto" required ars={monto.ars} usd={monto.usd} rate={dolarActual} onChange={setMonto} />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                type="submit"
                className="px-5 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
