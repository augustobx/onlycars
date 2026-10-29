'use client';

import { useState, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  Building,
  CreditCard,
  Edit3,
} from 'lucide-react';

export type TemplateTipo =
  | 'PREVENTIVO'
  | 'VENCE_HOY'
  | 'VENCIDO_LEVE'
  | 'MORA_FORMAL'
  | 'DATOS_BANCARIOS'
  | 'LIBRE';

export interface ModalWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    nombre: string;
    telefono: string;
    dni?: string;
  };
  cuota?: {
    numero_cuota: number;
    total_cuotas?: number;
    monto_usd: number;
    monto_ars: number;
    fecha_vencimiento: string;
    id_operacion?: string;
    dias_mora?: number;
    isVencida?: boolean;
    isHoy?: boolean;
  } | null;
  tenantName: string;
  tenantCuit?: string;
  dolarActual?: number;
  datosBancarios?: {
    banco?: string;
    titular?: string;
    cbu?: string;
    alias?: string;
  };
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

export default function ModalWhatsAppRecordatorio({
  isOpen,
  onClose,
  cliente,
  cuota,
  tenantName,
  tenantCuit,
  datosBancarios,
}: ModalWhatsAppProps) {
  const telLimpio = useMemo(() => limpiarTelefono(cliente.telefono), [cliente.telefono]);

  // Determinar la plantilla inicial según el estado del vencimiento
  const defaultTemplate = useMemo<TemplateTipo>(() => {
    if (!cuota) return 'LIBRE';
    if (cuota.isVencida) {
      return (cuota.dias_mora || 0) > 5 ? 'MORA_FORMAL' : 'VENCIDO_LEVE';
    }
    if (cuota.isHoy) return 'VENCE_HOY';
    return 'PREVENTIVO';
  }, [cuota]);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateTipo>(defaultTemplate);
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generador de plantillas prearmadas con datos dinámicos
  const generatedTemplates = useMemo(() => {
    const nombre = cliente.nombre || 'Cliente';
    const cNro = cuota?.numero_cuota || 1;
    const cTot = cuota?.total_cuotas || 1;
    const ars = Math.round(cuota?.monto_ars || 0).toLocaleString('es-AR');
    const usd = Math.round(cuota?.monto_usd || 0).toLocaleString('es-AR');
    const op = cuota?.id_operacion ? ` (${cuota.id_operacion})` : '';
    const vto = cuota?.fecha_vencimiento
      ? new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')
      : 'la fecha acordada';
    const mora = cuota?.dias_mora || 1;
    const alias = datosBancarios?.alias || 'CONSULTAR.ALIAS';
    const cbu = datosBancarios?.cbu || 'CONSULTAR.CBU';

    return {
      PREVENTIVO:
        `Hola ${nombre}, te recordamos desde *${tenantName}* que el próximo *${vto}* vence tu cuota *#${cNro}/${cTot}*${op} por un importe de *$ ${ars}* (ref. U$S ${usd}).\n\n` +
        `Podés realizar tu pago por transferencia bancaria (Alias: *${alias}*). Si ya realizaste el pago, por favor remitinos el comprobante por este medio. ¡Muchas gracias!`,

      VENCE_HOY:
        `Hola ${nombre}, hoy *${vto}* es la fecha de vencimiento de tu cuota *#${cNro}/${cTot}*${op} en *${tenantName}* por *$ ${ars}* (ref. U$S ${usd}).\n\n` +
        `Te solicitamos por favor remitir el comprobante de pago durante el día para emitir tu recibo formal correspondiente. ¡Saludos!`,

      VENCIDO_LEVE:
        `Hola ${nombre}, te contactamos desde *${tenantName}* para informarte que registramos pendiente de pago tu cuota *#${cNro}/${cTot}*${op} vencida el *${vto}* por un total de *$ ${ars}* (ref. U$S ${usd}).\n\n` +
        `Por favor avisanos cuándo realizarías la transferencia para regularizar tu estado y evitar el devengamiento de intereses punitorios adicionales. Muchas gracias.`,

      MORA_FORMAL:
        `*NOTIFICACIÓN DE MORA · ${tenantName.toUpperCase()}*\n` +
        `Estimado/a ${nombre}, le notificamos que su crédito${op} registra *${mora} días de mora* correspondiente a la cuota *#${cNro}/${cTot}* vencida el *${vto}* por *$ ${ars}* (ref. U$S ${usd}).\n\n` +
        `Le solicitamos regularizar la deuda con carácter de *urgente* en el día de la fecha a fin de evitar el traslado del legajo a instancia prejudicial/legal y reporte a bases de antecedentes crediticios. Esperamos su comprobante de pago a la brevedad.`,

      DATOS_BANCARIOS:
        `Hola ${nombre}, te compartimos los datos oficiales para abonar tu cuota en *${tenantName}*:\n\n` +
        `• *Titular:* ${datosBancarios?.titular || tenantName}\n` +
        `• *CUIT:* ${tenantCuit || 'Consultar'}\n` +
        `• *Banco:* ${datosBancarios?.banco || 'Banco Comercial'}\n` +
        `• *Alias:* *${alias}*\n` +
        `• *CBU:* ${cbu}\n` +
        `• *Importe a transferir:* *$ ${ars}*\n\n` +
        `Una vez efectuada la transferencia, por favor envianos la captura del comprobante para procesar tu recibo oficial.`,

      LIBRE: `Hola ${nombre}, te escribimos de *${tenantName}* en relación a tu crédito${op}.`,
    };
  }, [cliente, cuota, tenantName, tenantCuit, datosBancarios]);

  // Mensaje final visible en el editor
  const mensajeActual = customText || generatedTemplates[selectedTemplate];

  const handleSelectTemplate = (t: TemplateTipo) => {
    setSelectedTemplate(t);
    setCustomText(generatedTemplates[t]);
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(mensajeActual);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const abrirWhatsApp = () => {
    if (!telLimpio) {
      alert('El cliente no tiene un teléfono válido registrado.');
      return;
    }
    const url = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensajeActual)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 block">
                Avisos y Recordatorios de Cobranza
              </span>
              <h3 className="font-black text-slate-900 text-sm">{cliente.nombre}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DETALLE RÁPIDO DE CUOTA / ESTADO */}
        {cuota && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Cuota a Notificar</span>
              <p className="font-bold text-slate-800">
                Cuota {cuota.numero_cuota} de {cuota.total_cuotas}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Vto: {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Importe Pactado</span>
              <p className="font-mono font-black text-sm text-slate-900">
                $ {Math.round(cuota.monto_ars).toLocaleString('es-AR')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">U$S {Math.round(cuota.monto_usd).toLocaleString('es-AR')}</p>
            </div>
          </div>
        )}

        {/* SELECTOR DE PLANTILLAS PREARMADAS */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Seleccionar Tipo de Aviso
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectTemplate('PREVENTIVO')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'PREVENTIVO'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">🔔 Preventivo</span>
              <span className="text-[9px] text-slate-500 font-medium block">Por vencer</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('VENCE_HOY')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'VENCE_HOY'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">⏰ Vence Hoy</span>
              <span className="text-[9px] text-slate-500 font-medium block">Fecha exacta</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('VENCIDO_LEVE')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'VENCIDO_LEVE'
                  ? 'border-orange-600 bg-orange-50 text-orange-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">⚠️ Vencida</span>
              <span className="text-[9px] text-slate-500 font-medium block">1-5 días mora</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('MORA_FORMAL')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'MORA_FORMAL'
                  ? 'border-red-600 bg-red-50 text-red-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">🚨 Intimación</span>
              <span className="text-[9px] text-slate-500 font-medium block">Mora avanzada</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('DATOS_BANCARIOS')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'DATOS_BANCARIOS'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">🏦 Datos CBU</span>
              <span className="text-[9px] text-slate-500 font-medium block">Para pagar</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('LIBRE')}
              className={`p-2 rounded-xl text-left border transition ${
                selectedTemplate === 'LIBRE'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-black">💬 Personal</span>
              <span className="text-[9px] text-slate-500 font-medium block">Texto libre</span>
            </button>
          </div>
        </div>

        {/* EDITOR / VISTA PREVIA DEL MENSAJE */}
        <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" /> Mensaje listo para enviar
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              Destino: +{telLimpio || 'Sin número'}
            </span>
          </div>

          <textarea
            rows={5}
            value={mensajeActual}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full flex-1 p-3 text-xs font-sans text-slate-800 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
            placeholder="Escribí o modificá el mensaje a enviar..."
          />
        </div>

        {/* ACCIONES FINALES */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={copiarAlPortapapeles}
            className="px-3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Copiar texto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={abrirWhatsApp}
            disabled={!telLimpio}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Abrir WhatsApp con Mensaje</span>
          </button>
        </div>
      </div>
    </div>
  );
}

