'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { agregarTarea, cambiarEstadoTarea, agregarGasto, editarTarea, eliminarTarea } from '@/actions/tareas';
import { useConfigStore } from '@/store/useConfigStore';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function TareasManager({ tareas, idVehiculo, dolarActual }: { tareas: any[]; idVehiculo: number; dolarActual?: number }) {
  const { dolarBlue } = useConfigStore();
  const rate = Number(dolarActual || dolarBlue || 1400);
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gastoActivo, setGastoActivo] = useState<number | null>(null);
  const [monto, setMonto] = useState({ ars: '', usd: '' });
  const [descGasto, setDescGasto] = useState('');

  // Estados de edición y eliminación
  const [tareaEditandoId, setTareaEditandoId] = useState<number | null>(null);
  const [textoEditando, setTextoEditando] = useState('');

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setIsSubmitting(true);
    const res = await agregarTarea(idVehiculo, nuevaTarea.trim());
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo agregar la tarea.');
    setNuevaTarea('');
  };

  const guardarEdicion = async (idTarea: number) => {
    if (!textoEditando.trim()) return alert('La descripción no puede estar vacía.');
    setIsSubmitting(true);
    const res = await editarTarea(idTarea, idVehiculo, textoEditando.trim());
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo editar la tarea.');
    setTareaEditandoId(null);
    setTextoEditando('');
  };

  const confirmarEliminar = async (tarea: any) => {
    const cantGastos = tarea.gastos?.length || 0;
    const msg = cantGastos > 0
      ? `¿Eliminar "${tarea.descripcion}"? ATENCIÓN: tiene ${cantGastos} gasto(s) vinculado(s) que también serán eliminados de la cuenta del vehículo. Quedará registro en la bitácora.`
      : `¿Estás seguro de eliminar la tarea "${tarea.descripcion}"? La acción quedará asentada en la bitácora del vehículo.`;
    
    if (!confirm(msg)) return;

    setIsSubmitting(true);
    const res = await eliminarTarea(tarea.id_tarea, idVehiculo);
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo eliminar la tarea.');
  };

  const registrarGasto = async (tareaId: number) => {
    if (Number(monto.ars || 0) <= 0 || !descGasto.trim()) return alert('Completá monto y detalle del gasto.');
    setIsSubmitting(true);
    const res = await agregarGasto(tareaId, idVehiculo, Number(monto.ars), rate, descGasto.trim());
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el gasto.');
    setGastoActivo(null);
    setMonto({ ars: '', usd: '' });
    setDescGasto('');
  };

  return (
    <div className="space-y-5">
      <form onSubmit={crearTarea} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
        <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nueva tarea de preparación</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            placeholder="Ej: Cambio de aceite, pulido, revisión de frenos..."
            className="flex-1 px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
          />
          <button
            disabled={isSubmitting}
            type="submit"
            className="px-4 py-2.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar tarea
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {tareas.map((tarea) => {
          const completada = tarea.estado_tarea === 'COMPLETADA';
          const estaEditando = tareaEditandoId === tarea.id_tarea;

          return (
            <div key={tarea.id_tarea} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 min-w-0 flex-1">
                  <button onClick={() => cambiarEstadoTarea(tarea.id_tarea, completada ? 'PENDIENTE' : 'COMPLETADA', idVehiculo)} className="mt-0.5 cursor-pointer">
                    {completada ? <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" /> : <Circle className="text-slate-300 dark:text-slate-600 w-5 h-5 shrink-0" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    {estaEditando ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={textoEditando}
                          onChange={(e) => setTextoEditando(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-indigo-400 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') guardarEdicion(tarea.id_tarea);
                            if (e.key === 'Escape') setTareaEditandoId(null);
                          }}
                        />
                        <button
                          onClick={() => guardarEdicion(tarea.id_tarea)}
                          disabled={isSubmitting}
                          title="Guardar edición"
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTareaEditandoId(null)}
                          title="Cancelar"
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className={`font-black text-slate-900 dark:text-slate-100 ${completada ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {tarea.descripcion}
                      </p>
                    )}

                    <div className="space-y-1 mt-2">
                      {tarea.gastos.map((g: any) => (
                        <div key={g.id_gasto} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3 py-2">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{g.descripcion}</span>
                          <DualMoney ars={g.monto_ars} usd={g.monto_usd} rate={rate} compact primaryClassName="font-black text-slate-800 dark:text-slate-200" secondaryClassName="text-[9px] text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setGastoActivo(gastoActivo === tarea.id_tarea ? null : tarea.id_tarea)}
                    className="text-xs font-black text-[var(--text-primary-default,#FF6600)] hover:underline whitespace-nowrap cursor-pointer px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  >
                    + Gasto
                  </button>

                  {!estaEditando && (
                    <button
                      onClick={() => {
                        setTareaEditandoId(tarea.id_tarea);
                        setTextoEditando(tarea.descripcion);
                      }}
                      title="Editar descripción de tarea"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => confirmarEliminar(tarea)}
                    title="Eliminar tarea (registra en bitácora)"
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {gastoActivo === tarea.id_tarea && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <DualCurrencyInput label="Monto del gasto" required ars={monto.ars} usd={monto.usd} rate={rate} onChange={setMonto} />
                  <label className="block">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Detalle del gasto *</span>
                    <input
                      value={descGasto}
                      onChange={(e) => setDescGasto(e.target.value)}
                      placeholder="Ej: Repuestos y mano de obra cambio de aceite"
                      className="mt-1.5 w-full p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                    />
                  </label>
                  <button
                    disabled={isSubmitting}
                    onClick={() => registrarGasto(tarea.id_tarea)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-sm disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Registrar gasto
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {tareas.length === 0 && (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400">
            No hay tareas registradas.
          </div>
        )}
      </div>
    </div>
  );
}
