'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { guardarVehiculo, actualizarVehiculo } from '@/actions/vehiculos';
import { Save, ArrowLeft, Loader2, DollarSign, Banknote, Car, Settings } from 'lucide-react';
import Link from 'next/link';
import { useConfigStore } from '@/store/useConfigStore';

export default function VehiculoForm({ vehiculo }: { vehiculo?: any }) {
    const router = useRouter();
    const { dolarBlue } = useConfigStore();
    const rate = Number(dolarBlue || 1400);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorGlobal, setErrorGlobal] = useState('');

    const legacyOperationalState = vehiculo?.estado === 'SENADO'
        ? (vehiculo?.tipo_ingreso === 'Consignacion' ? 'EN_CONSIGNACION' : (vehiculo?.tareas?.some((t: any) => t.estado_tarea === 'PENDIENTE') ? 'EN_PREPARACION' : 'LISTO_PARA_VENTA'))
        : vehiculo?.estado;

    const { register, handleSubmit, watch } = useForm({
        defaultValues: vehiculo ? { ...vehiculo, estado: legacyOperationalState, publicadoWeb: vehiculo.publicadoWeb ?? true } : {
            tipo_vehiculo: 'Auto',
            estado: 'EN_PREPARACION',
            tipo_ingreso: 'Propio',
            comision_consignacion_pct: 0,
            km: 0,
            anio: new Date().getFullYear(),
            publicadoWeb: true,
        },
    });

    const tipoIngreso = watch('tipo_ingreso');
    const tipoVehiculo = watch('tipo_vehiculo');

    const [compraArs, setCompraArs] = useState<string>(vehiculo?.precio_compra_ars?.toString() || '');
    const [compraUsd, setCompraUsd] = useState<string>(vehiculo?.precio_compra_usd?.toString() || '');
    const [ventaArs, setVentaArs] = useState<string>(vehiculo?.precio_venta_ars?.toString() || '');
    const [ventaUsd, setVentaUsd] = useState<string>(vehiculo?.precio_venta_usd?.toString() || '');
    const compraBase = useRef<'ARS' | 'USD'>(Number(vehiculo?.precio_compra_usd || 0) > 0 ? 'USD' : 'ARS');
    const ventaBase = useRef<'ARS' | 'USD'>(Number(vehiculo?.precio_venta_usd || 0) > 0 ? 'USD' : 'ARS');

    const handleCompraArs = (val: string) => {
        compraBase.current = 'ARS';
        setCompraArs(val);
        const num = Number(val) || 0;
        setCompraUsd(num > 0 && rate > 0 ? (num / rate).toFixed(2) : '');
    };

    const handleCompraUsd = (val: string) => {
        compraBase.current = 'USD';
        setCompraUsd(val);
        const num = Number(val) || 0;
        setCompraArs(num > 0 && rate > 0 ? (num * rate).toFixed(2) : '');
    };

    const handleVentaArs = (val: string) => {
        ventaBase.current = 'ARS';
        setVentaArs(val);
        const num = Number(val) || 0;
        setVentaUsd(num > 0 && rate > 0 ? (num / rate).toFixed(2) : '');
    };

    const handleVentaUsd = (val: string) => {
        ventaBase.current = 'USD';
        setVentaUsd(val);
        const num = Number(val) || 0;
        setVentaArs(num > 0 && rate > 0 ? (num * rate).toFixed(2) : '');
    };

    useEffect(() => {
        if (rate <= 0) return;
        if (compraBase.current === 'USD' && Number(compraUsd || 0) > 0) setCompraArs((Number(compraUsd) * rate).toFixed(2));
        else if (compraBase.current === 'ARS' && Number(compraArs || 0) > 0) setCompraUsd((Number(compraArs) / rate).toFixed(2));

        if (ventaBase.current === 'USD' && Number(ventaUsd || 0) > 0) setVentaArs((Number(ventaUsd) * rate).toFixed(2));
        else if (ventaBase.current === 'ARS' && Number(ventaArs || 0) > 0) setVentaUsd((Number(ventaArs) / rate).toFixed(2));
    }, [rate]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setErrorGlobal('');
        data.precio_compra_ars = Number(compraArs) || 0;
        data.precio_compra_usd = Number(compraUsd) || 0;
        data.precio_venta_ars = Number(ventaArs) || 0;
        data.precio_venta_usd = Number(ventaUsd) || 0;

        const res = vehiculo
            ? await actualizarVehiculo(vehiculo.id_vehiculo, data)
            : await guardarVehiculo(data);

        if (res.success) {
            router.refresh();
        } else {
            setErrorGlobal(res.error || 'Ocurrió un error inesperado al guardar.');
        }
        setIsSubmitting(false);
    };

    const inputClass = 'flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)] shadow-sm';
    const labelClass = 'block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
    const currentCompraUsd = Number(compraUsd) || 0;
    const currentVentaUsd = Number(ventaUsd) || 0;
    const margenBrutoUsd = currentVentaUsd - currentCompraUsd;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto pb-10">
            {!vehiculo && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Car className="w-6 h-6 text-[var(--text-primary-default,#FF6600)]" /> Ingresar Nuevo Vehículo
                    </h2>
                    <Link href="/vehiculos" className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </Link>
                </div>
            )}

            {errorGlobal && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-xl font-medium border border-red-200 dark:border-red-900/50">
                    {errorGlobal}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
                            <Car className="w-5 h-5 text-[var(--text-primary-default,#FF6600)]" /> Datos Principales
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClass}>Tipo de Vehículo *</label>
                                <select {...register('tipo_vehiculo')} className={inputClass} required>
                                    <option value="Auto">Auto</option>
                                    <option value="Camioneta">Camioneta / SUV</option>
                                    <option value="Utilitario">Utilitario</option>
                                    <option value="Camion">Camión</option>
                                    <option value="Moto">Moto</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Marca *</label>
                                <input {...register('marca')} required className={inputClass} placeholder="Ej: Volkswagen" />
                            </div>
                            <div>
                                <label className={labelClass}>Modelo *</label>
                                <input {...register('modelo')} required className={inputClass} placeholder="Ej: Amarok V6" />
                            </div>
                            {tipoVehiculo === 'Moto' && (
                                <div>
                                    <label className={labelClass}>Cilindrada</label>
                                    <input {...register('cilindrada')} className={inputClass} placeholder="Ej: 250cc" />
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>Año *</label>
                                <input type="number" {...register('anio', { valueAsNumber: true })} required className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Kilometraje</label>
                                <input type="number" {...register('km', { valueAsNumber: true })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Patente</label>
                                <input {...register('patente')} className={`${inputClass} uppercase font-mono font-bold`} placeholder="AB123CD" />
                            </div>
                            <div>
                                <label className={labelClass}>VIN (Chasis)</label>
                                <input {...register('vin')} className={`${inputClass} uppercase font-mono text-xs`} placeholder="8AW..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" /> Especificaciones Técnicas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClass}>Motor</label>
                                <input {...register('motor')} className={inputClass} placeholder="Ej: 2.0 TDI" />
                            </div>
                            <div>
                                <label className={labelClass}>Combustible</label>
                                <select {...register('combustible')} className={inputClass}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Nafta">Nafta</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Híbrido">Híbrido</option>
                                    <option value="Eléctrico">Eléctrico</option>
                                    <option value="GNC">GNC</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Transmisión</label>
                                <select {...register('transmision')} className={inputClass}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Manual">Manual</option>
                                    <option value="Automática">Automática</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tracción</label>
                                <input {...register('traccion')} className={inputClass} placeholder="Ej: 4x4" />
                            </div>
                            <div>
                                <label className={labelClass}>Color</label>
                                <input {...register('color')} className={inputClass} placeholder="Ej: Blanco" />
                            </div>
                            <div>
                                <label className={labelClass}>Puertas</label>
                                <input type="number" {...register('puertas', { valueAsNumber: true })} className={inputClass} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
                            Estado de Inventario
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                            La reserva/seña se gestiona aparte y no modifica este estado operativo.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Estado operativo</label>
                                <select {...register('estado')} className={inputClass}>
                                    <option value="EN_PREPARACION">En Preparación</option>
                                    <option value="LISTO_PARA_VENTA">Listo para Venta</option>
                                    <option value="EN_CONSIGNACION">En Consignación</option>
                                    <option value="VENDIDO">Vendido</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Ingreso</label>
                                <select {...register('tipo_ingreso')} className={inputClass}>
                                    <option value="Propio">Vehículo Propio (Agencia)</option>
                                    <option value="Consignacion">Consignación de Tercero</option>
                                    <option value="Permuta">Permuta</option>
                                </select>
                            </div>
                            {tipoIngreso === 'Consignacion' && (
                                <div className="p-4 bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-200 dark:border-fuchsia-800/50 rounded-xl">
                                    <label className="block text-xs font-bold text-fuchsia-800 dark:text-fuchsia-300 uppercase tracking-wider mb-2">
                                        Comisión Pactada (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('comision_consignacion_pct', { valueAsNumber: true })}
                                        className={inputClass}
                                        placeholder="Ej: 5.00"
                                    />
                                </div>
                            )}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        {...register('publicadoWeb')}
                                        className="mt-1 w-4 h-4 text-[var(--bg-primary-default,#FF6600)] rounded border-slate-300 dark:border-slate-700 focus:ring-[var(--bg-primary-default,#FF6600)]"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Publicar en Catálogo Online / PWA</span>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Si está marcado, se mostrará en el catálogo web si su estado es Listo o Consignación.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm flex flex-col h-auto">
                        <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800/40 pb-3 mb-2">
                            Valores (ARS / USD)
                        </h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-5">
                            Cotización actual: $ {rate.toLocaleString('es-AR')}. Al actualizar el dólar se recalcula la moneda derivada.
                        </p>
                        <div className="space-y-4 flex-1">
                            {tipoIngreso === 'Propio' && (
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm space-y-3">
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Costo de Compra Base
                                    </label>
                                    <div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400 dark:text-slate-500 pointer-events-none">ARS $</span>
                                            <input
                                                type="number"
                                                step="any"
                                                value={compraArs}
                                                onChange={(e) => handleCompraArs(e.target.value)}
                                                className="w-full pl-14 pr-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {Number(compraArs || 0) > 0 && (
                                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1 pl-1 truncate">
                                                $ {Number(compraArs).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 pointer-events-none">USD $</span>
                                            <input
                                                type="number"
                                                step="any"
                                                value={compraUsd}
                                                onChange={(e) => handleCompraUsd(e.target.value)}
                                                className="w-full pl-14 pr-3 py-2 text-sm sm:text-base border border-emerald-200 dark:border-emerald-800/60 rounded-lg font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {Number(compraUsd || 0) > 0 && (
                                            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 pl-1 truncate">
                                                U$S {Number(compraUsd).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm space-y-3">
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Precio Venta Sugerido
                                </label>
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400 dark:text-slate-500 pointer-events-none">ARS $</span>
                                        <input
                                            type="number"
                                            step="any"
                                            value={ventaArs}
                                            onChange={(e) => handleVentaArs(e.target.value)}
                                            className="w-full pl-14 pr-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary-default,#FF6600)]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {Number(ventaArs || 0) > 0 && (
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1 pl-1 truncate">
                                            $ {Number(ventaArs).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 pointer-events-none">USD $</span>
                                        <input
                                            type="number"
                                            step="any"
                                            value={ventaUsd}
                                            onChange={(e) => handleVentaUsd(e.target.value)}
                                            className="w-full pl-14 pr-3 py-2 text-sm sm:text-base border border-emerald-200 dark:border-emerald-800/60 rounded-lg font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {Number(ventaUsd || 0) > 0 && (
                                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 pl-1 truncate">
                                            U$S {Number(ventaUsd).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                        </p>
                                    )}
                                </div>
                            </div>

                            {tipoIngreso === 'Propio' && currentVentaUsd > 0 && currentCompraUsd > 0 && (
                                <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-800/40">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-emerald-900 dark:text-emerald-200">Margen Bruto (Est.)</span>
                                        <span className={`font-black ${margenBrutoUsd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            U$S {margenBrutoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800/40">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-[var(--bg-primary-default,#FF6600)] hover:bg-[var(--bg-primary-bold,#e25700)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 active:scale-[0.99] transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {vehiculo ? 'Guardar Cambios' : 'Registrar Vehículo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
