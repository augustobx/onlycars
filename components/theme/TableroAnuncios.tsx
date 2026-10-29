'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Pin, 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Megaphone, 
  Clock, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight,
  Pause
} from 'lucide-react';

export interface AnnouncementData {
  id: string;
  active: boolean;
  title: string;
  message: string;
  type: 'info' | 'feature' | 'warning' | 'alert';
  autoCloseSeconds: number;
  updatedAt?: string;
  updatedBy?: string;
}

interface TableroAnunciosProps {
  anuncio: AnnouncementData;
  onClose: () => void;
  onDismissPermanent: () => void;
  systemName?: string;
}

export function TableroAnuncios({
  anuncio,
  onClose,
  onDismissPermanent,
  systemName = 'OnlyCars',
}: TableroAnunciosProps) {
  const [timeLeft, setTimeLeft] = useState(Number(anuncio.autoCloseSeconds) || 0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSecondsRef = useRef(Number(anuncio.autoCloseSeconds) || 0);

  // Temporizador de autocierre con pausa en hover
  useEffect(() => {
    if (timeLeft <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, onClose]);

  const getTypeStyle = (type: AnnouncementData['type']) => {
    switch (type) {
      case 'feature':
        return {
          icon: Sparkles,
          tagText: 'NOVEDAD DEL SISTEMA',
          pinColor: 'text-emerald-400 fill-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          accentBorder: 'border-emerald-500/40',
          glowShadow: 'shadow-[0_0_35px_rgba(16,185,129,0.18)]',
          progressClass: 'bg-emerald-400',
          buttonGlow: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          tagText: 'MANTENIMIENTO PROGRAMADO',
          pinColor: 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          accentBorder: 'border-amber-500/40',
          glowShadow: 'shadow-[0_0_35px_rgba(245,158,11,0.18)]',
          progressClass: 'bg-amber-400',
          buttonGlow: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
        };
      case 'alert':
        return {
          icon: ShieldAlert,
          tagText: 'AVISO IMPORTANTE',
          pinColor: 'text-rose-500 fill-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]',
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          accentBorder: 'border-rose-500/40',
          glowShadow: 'shadow-[0_0_35px_rgba(244,63,94,0.18)]',
          progressClass: 'bg-rose-500',
          buttonGlow: 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25',
        };
      case 'info':
      default:
        return {
          icon: Megaphone,
          tagText: 'COMUNICADO OFICIAL',
          pinColor: 'text-orange-500 fill-orange-500 drop-shadow-[0_2px_8px_rgba(255,102,0,0.5)]',
          badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          accentBorder: 'border-orange-500/40',
          glowShadow: 'shadow-[0_0_35px_rgba(255,102,0,0.18)]',
          progressClass: 'bg-orange-500',
          buttonGlow: 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25',
        };
    }
  };

  const style = getTypeStyle(anuncio.type);
  const IconComponent = style.icon;
  const progressPercent =
    totalSecondsRef.current > 0
      ? Math.max(0, Math.min(100, (timeLeft / totalSecondsRef.current) * 100))
      : 0;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#070503]/85 backdrop-blur-md animate-in fade-in duration-300 select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Marco Exterior del Tablero (Estilo Cartelera / Bulletin Board) */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full max-w-2xl rounded-3xl bg-[#0f1420] border-2 border-slate-700/80 p-3 sm:p-5 relative shadow-[0_30px_90px_rgba(0,0,0,0.9)] transition-all transform animate-in zoom-in-95 duration-200"
      >
        {/* Tornillos/Remaches en las 4 esquinas del marco */}
        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-slate-800 rotate-45" />
        </div>
        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-slate-800 -rotate-45" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-slate-800 -rotate-45" />
        </div>
        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-[1px] bg-slate-800 rotate-45" />
        </div>

        {/* Superficie interna de la cartelera (Textura de fieltro oscuro con trama de puntos) */}
        <div 
          className="rounded-2xl bg-[#0a0d14] p-4 sm:p-6 border border-slate-800/90 relative overflow-hidden flex flex-col"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {/* Barra superior de autocierre si corresponde */}
          {totalSecondsRef.current > 0 && (
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4 relative">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${style.progressClass}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Chincheta / Pin Central Superior (Simulando hoja clavada al tablero) */}
          <div className="flex items-center justify-center -mt-2 mb-3 relative z-10">
            <div className="relative group cursor-default">
              <div className="w-9 h-9 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <Pin className={`w-5 h-5 ${style.pinColor} transform -rotate-45`} />
              </div>
            </div>
          </div>

          {/* Hoja de Anuncio Fijada */}
          <div className={`rounded-xl bg-[#131926]/95 border ${style.accentBorder} p-5 sm:p-6 text-slate-100 relative shadow-2xl ${style.glowShadow} transition-all`}>
            
            {/* Cabecera del Memo / Anuncio */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md border ${style.badgeClass}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    {style.tagText}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <span>{systemName}</span>
                    <span>·</span>
                    <span>NanoLabs Platform</span>
                  </span>
                </div>
                
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {anuncio.title}
                </h2>
              </div>

              {/* Botón rápido de cierre en la esquina */}
              <button
                type="button"
                onClick={onClose}
                title="Cerrar tablero e ingresar"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Mensaje: Soporte multilínea completo y emojis */}
            <div className="text-sm sm:text-base text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[45vh] overflow-y-auto pr-1 space-y-3 font-normal selection:bg-orange-500/30 custom-scrollbar">
              {anuncio.message}
            </div>

            {/* Sello de publicación oficial y temporizador */}
            <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Publicación verificada por Administración</span>
              </div>

              {totalSecondsRef.current > 0 && (
                <div className="flex items-center gap-1 font-mono text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  {isPaused ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="text-amber-300">Pausado (cursor sobre el tablero)</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cierre automático en <b className="text-white font-bold">{timeLeft}s</b></span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pie de Acciones del Tablero */}
          <div className="mt-4 pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onDismissPermanent}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors font-medium border border-transparent hover:border-white/10 cursor-pointer"
            >
              <EyeOff className="w-4 h-4" />
              <span>No volver a mostrar en este dispositivo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${style.buttonGlow} transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
            >
              <span>Continuar al Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableroAnuncios;
