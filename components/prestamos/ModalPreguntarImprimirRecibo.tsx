'use client';

import { Printer, CheckCircle2, MessageCircle, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface ModalPreguntarImprimirReciboProps {
  isOpen: boolean;
  onClose: () => void;
  idCuota: number;
  tipo?: 'PRESTAMO' | 'VENTA';
  reciboNro: string;
  clienteNombre: string;
  clienteTelefono?: string;
  numeroCuota: number;
  totalCuotas: number;
  montoArs: number;
  montoUsd?: number;
  onEnviarWhatsApp?: () => void;
}

export default function ModalPreguntarImprimirRecibo({
  isOpen,
  onClose,
  idCuota,
  tipo = 'PRESTAMO',
  reciboNro,
  clienteNombre,
  clienteTelefono,
  numeroCuota,
  totalCuotas,
  montoArs,
  montoUsd,
  onEnviarWhatsApp,
}: ModalPreguntarImprimirReciboProps) {
  if (!isOpen) return null;

  const urlRecibo = `/documentos/recibo-cuota/${idCuota}?tipo=${tipo}`;

  const handleImprimir = () => {
    window.open(urlRecibo, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center">
        {/* ICONO Y TÍTULO */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900/40 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 block">
            Operación Confirmada
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            ¡Cobro Registrado con Éxito!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Comprobante N° {reciboNro}
          </p>
        </div>

        {/* RESUMEN DEL COBRO */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-left space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Cliente:</span>
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{clienteNombre}</strong>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Cuota:</span>
            <strong className="text-slate-800 dark:text-slate-200">
              Cuota #{numeroCuota} de {totalCuotas}
            </strong>
          </div>
          <div className="flex justify-between items-baseline border-t border-slate-200 dark:border-slate-700/60 pt-1.5">
            <span className="text-slate-400">Total percibido:</span>
            <div className="text-right">
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm block">
                $ {Math.round(montoArs).toLocaleString('es-AR')} ARS
              </span>
              {montoUsd && montoUsd > 0 && (
                <span className="text-[10px] font-mono text-slate-400">
                  U$S {Math.round(montoUsd).toLocaleString('es-AR')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PREGUNTA AL OPERADOR */}
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
            ¿Deseas imprimir el recibo oficial ahora?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Podés emitir la constancia oficial en A4 o remitirla al cliente.
          </p>
        </div>

        {/* ACCIONES */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleImprimir}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Recibo Oficial (A4)</span>
          </button>

          {onEnviarWhatsApp ? (
            <button
              type="button"
              onClick={onEnviarWhatsApp}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-emerald-700 dark:text-emerald-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Constancia por WhatsApp</span>
            </button>
          ) : clienteTelefono ? (
            <a
              href={`https://wa.me/${clienteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hola ${clienteNombre}! Te confirmamos el cobro de la cuota #${numeroCuota}/${totalCuotas} por $ ${Math.round(montoArs).toLocaleString('es-AR')} ARS. Comprobante Oficial N° ${reciboNro}. ¡Muchas gracias!`
              )}`}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-emerald-700 dark:text-emerald-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Constancia por WhatsApp</span>
            </a>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold transition-colors"
          >
            Continuar sin imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
