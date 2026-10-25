'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  ChevronLeft,
  Gauge,
  Fuel,
  Calendar,
  Layers,
  PhoneCall,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function VehiculoDetalleClient({
  vehiculo,
  dolarActual,
  whatsappContacto,
  agencyName,
}: {
  vehiculo: any;
  dolarActual: number;
  whatsappContacto: string;
  agencyName: string;
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const fotos = vehiculo.fotos || [];
  const currentPhoto = fotos[activePhotoIndex]?.url_foto || null;
  const cleanPhone = whatsappContacto.replace(/[^0-9]/g, '');

  const msgWhatsapp = encodeURIComponent(
    `Hola! Quisiera recibir información y consultar disponibilidad del ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.version || ''} (${vehiculo.anio || ''}).`
  );

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const specs = [
    { label: 'Año', value: vehiculo.anio ? String(vehiculo.anio) : null, icon: Calendar },
    { label: 'Kilómetros', value: vehiculo.km !== null ? `${vehiculo.km.toLocaleString('es-AR')} km` : null, icon: Gauge },
    { label: 'Combustible', value: vehiculo.combustible, icon: Fuel },
    { label: 'Transmisión', value: vehiculo.transmision, icon: Layers },
    { label: 'Motor', value: vehiculo.motor, icon: Car },
    { label: 'Color', value: vehiculo.color, icon: Car },
    { label: 'Puertas', value: vehiculo.puertas ? `${vehiculo.puertas} puertas` : null, icon: Car },
  ].filter((s) => Boolean(s.value));

  return (
    <div className="space-y-5 pb-8">
      {/* Barra superior con volver y compartir */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/catalogo"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Volver al catálogo
        </Link>
        <button
          onClick={handleShare}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
          title="Compartir link"
        >
          <Share2 className="w-4 h-4" />
          {copied ? <span className="text-emerald-400 text-[10px] font-bold">¡Copiado!</span> : null}
        </button>
      </div>

      {/* Contenido en 2 columnas en Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Galería de fotos */}
        <div className="space-y-3">
          <div className="relative h-72 sm:h-96 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPhoto}
                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700">
                <Car className="w-16 h-16" />
              </div>
            )}

            <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white px-3 py-1 rounded-full border border-slate-700">
              {fotos.length > 0 ? `${activePhotoIndex + 1} / ${fotos.length}` : '1 / 1'}
            </span>
          </div>

          {/* Miniaturas */}
          {fotos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {fotos.map((f: any, idx: number) => (
                <button
                  key={f.id_foto || idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-20 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition shadow-sm ${
                    activePhotoIndex === idx
                      ? 'border-white scale-105 shadow-md'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                  style={activePhotoIndex === idx ? { borderColor: 'var(--color-brand, #ff6600)' } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url_foto} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info y Ficha técnica */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div>
              <span
                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-block"
                style={{
                  borderColor: 'var(--color-brand, #ff6600)',
                  backgroundColor: 'var(--color-brand-ring, rgba(255,102,0,0.15))',
                  color: 'var(--color-brand, #ff6600)',
                }}
              >
                Disponible en {agencyName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <p className="text-sm text-slate-400 mt-1">{vehiculo.version || 'Unidad seleccionada'}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              {vehiculo.precio_venta_usd ? (
                <DualMoney
                  usd={Number(vehiculo.precio_venta_usd)}
                  ars={Number(vehiculo.precio_venta_ars || 0)}
                  rate={dolarActual}
                  primaryClassName="text-3xl font-black text-white leading-none"
                  secondaryClassName="text-sm text-slate-400 font-bold block mt-2"
                />
              ) : (
                <p className="text-sm font-bold text-slate-400">Consultar precio con la agencia</p>
              )}
            </div>

            {/* Botón WhatsApp */}
            {cleanPhone && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${cleanPhone}?text=${msgWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition active:scale-95"
                >
                  <PhoneCall className="w-5 h-5" /> Consultar disponibilidad por WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Ficha técnica */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Ficha Técnica
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {specs.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-brand, #ff6600)' }} /> {s.label}
                    </p>
                    <p className="text-xs font-bold text-white mt-1">{s.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
