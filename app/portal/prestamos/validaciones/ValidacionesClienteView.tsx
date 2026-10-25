'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cancelarSolicitudClienteAction } from '@/actions/portal-prestamos';

export default function ValidacionesClienteView({
  solicitudes,
  justCreated,
}: {
  solicitudes: any[];
  justCreated: boolean;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(
    solicitudes[0]?.id || null
  );
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) return;
    setCancelingId(id);
    await cancelarSolicitudClienteAction(id);
    setCancelingId(null);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          label: 'PENDIENTE',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Clock,
          desc: 'Tu solicitud fue recibida y está en cola de espera.',
          step: 1,
        };
      case 'EN_REVISION':
        return {
          label: 'EN REVISIÓN',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: FileText,
          desc: 'La administración está auditando tus documentos.',
          step: 2,
        };
      case 'APROBADO':
        return {
          label: 'APROBADO',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: CheckCircle2,
          desc: '¡Préstamo aprobado! La concesionaria se comunicará para el desembolso.',
          step: 3,
        };
      case 'RECHAZADO':
        return {
          label: 'NO APROBADO',
          color: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: XCircle,
          desc: 'La solicitud no pudo ser aprobada en esta oportunidad.',
          step: 3,
        };
      default:
        return {
          label: estado,
          color: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: AlertCircle,
          desc: 'Solicitud cancelada.',
          step: 0,
        };
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto w-full pb-8">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Validación de Solicitudes
        </h1>
        <p className="text-xs text-slate-400">
          Seguimiento en tiempo real del estado de tus solicitudes de préstamo.
        </p>
      </div>

      {justCreated && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-black text-white text-sm">¡Solicitud enviada con éxito!</p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              La concesionaria ya tiene tus datos y documentos para su análisis.
            </p>
          </div>
        </div>
      )}

      {solicitudes.length === 0 ? (
        <div className="p-8 text-center bg-slate-850 border border-slate-800 rounded-3xl space-y-3">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-sm font-bold text-white">No tenés solicitudes registradas</h2>
          <p className="text-xs text-slate-400">
            Aún no has solicitado préstamos en línea con la concesionaria.
          </p>
          <div className="pt-2">
            <Link
              href="/portal/prestamos/solicitar"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95"
              style={{
                background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
              }}
            >
              Iniciar nueva solicitud <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {solicitudes.map((sol) => {
            const isExpanded = expandedId === sol.id;
            const badge = getStatusBadge(sol.estado);
            const BadgeIcon = badge.icon;
            const docs = sol.documentos || [];

            return (
              <div
                key={sol.id}
                className="bg-slate-850 border border-slate-800 rounded-3xl overflow-hidden shadow-lg"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        Solicitud #{sol.id}
                      </span>
                      <h2 className="text-base font-black text-white mt-1">
                        USD ${Number(sol.monto_solicitado_usd).toLocaleString('es-AR')}
                      </h2>
                      <p className="text-xs text-slate-400">
                        En {sol.cantidad_cuotas} cuotas · {new Date(sol.fecha_solicitud).toLocaleDateString('es-AR')}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${badge.color}`}
                    >
                      <BadgeIcon className="w-3 h-3" /> {badge.label}
                    </span>
                  </div>

                  {/* Pasos de validación (Timeline visual) */}
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500">Progreso del trámite</p>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                      <div
                        className={`p-1.5 rounded-xl border ${
                          badge.step >= 1
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        1. Enviada
                      </div>
                      <div
                        className={`p-1.5 rounded-xl border ${
                          badge.step >= 2
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        2. Auditoría
                      </div>
                      <div
                        className={`p-1.5 rounded-xl border ${
                          badge.step >= 3
                            ? sol.estado === 'APROBADO'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        3. Resolución
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-0.5">{badge.desc}</p>
                  </div>

                  {/* Motivo de resolución o rechazo si existe */}
                  {sol.resolucion_motivo && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-850 space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Respuesta de la concesionaria:
                      </p>
                      <p className="text-xs text-slate-200">{sol.resolucion_motivo}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    {isExpanded ? (
                      <>
                        Ocultar documentación y detalles <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Ver documentación adjunta ({docs.length}) <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-900/60">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
                        Documentos Presentados
                      </p>
                      {docs.length === 0 ? (
                        <p className="text-xs text-slate-500">Sin documentos adjuntos.</p>
                      ) : (
                        <div className="space-y-2">
                          {docs.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-white truncate">
                                    {doc.tipo_documento}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {doc.nombre_archivo}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={doc.url_archivo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex-shrink-0"
                                title="Abrir archivo"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {sol.estado === 'PENDIENTE' && (
                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCancel(sol.id)}
                          disabled={cancelingId === sol.id}
                          className="text-xs text-red-400 hover:text-red-300 font-bold transition disabled:opacity-50"
                        >
                          {cancelingId === sol.id ? 'Cancelando...' : 'Cancelar esta solicitud'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
