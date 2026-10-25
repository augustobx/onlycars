'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Car, Calendar, Gauge, Fuel, PhoneCall, ChevronRight, SlidersHorizontal } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function CatalogoClient({
  vehiculos,
  dolarActual,
  whatsappContacto,
  agencyName,
}: {
  vehiculos: any[];
  dolarActual: number;
  whatsappContacto: string;
  agencyName: string;
}) {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      const q = search.trim().toLowerCase();
      const matchText =
        !q ||
        `${v.marca || ''} ${v.modelo || ''} ${v.version || ''} ${v.anio || ''} ${v.patente || ''}`
          .toLowerCase()
          .includes(q);

      const matchTipo =
        filtroTipo === 'TODOS' ||
        (v.tipo_vehiculo || 'Auto').toLowerCase() === filtroTipo.toLowerCase();

      return matchText && matchTipo;
    });
  }, [vehiculos, search, filtroTipo]);

  const cleanPhone = whatsappContacto.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Car className="w-6 h-6" style={{ color: 'var(--color-brand, #ff6600)' }} /> Catálogo de Unidades
        </h1>
        <p className="text-xs text-slate-400">
          Stock disponible en <strong className="text-slate-200">{agencyName}</strong> para entrega inmediata con garantía.
        </p>
      </div>

      {/* Buscador y Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, modelo o año..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none transition shadow-inner"
            style={{ borderColor: search ? 'var(--color-brand, #ff6600)' : undefined }}
          />
        </div>

        {/* Filtros rápidos por tipo */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
          {['TODOS', 'Auto', 'Camioneta', 'SUV', 'Moto'].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3.5 py-1.5 rounded-xl border transition whitespace-nowrap ${
                filtroTipo === tipo
                  ? 'font-black border shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
              style={
                filtroTipo === tipo
                  ? {
                      backgroundColor: 'var(--color-brand-ring, rgba(255,102,0,0.15))',
                      color: 'var(--color-brand, #ff6600)',
                      borderColor: 'var(--color-brand, #ff6600)',
                    }
                  : undefined
              }
            >
              {tipo === 'TODOS' ? 'Todos los vehículos' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Responsivo de Vehículos */}
      <div>
        {filteredVehiculos.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
            <Car className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-white">No se encontraron unidades</p>
            <p className="text-xs text-slate-400">Probá modificando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehiculos.map((v) => {
              const foto = v.fotos[0]?.url_foto;
              const msgWhatsapp = encodeURIComponent(
                `Hola! Quisiera consultar por el ${v.marca} ${v.modelo} ${v.version || ''} (${v.anio || ''}) que vi en su portal.`
              );

              return (
                <div
                  key={v.id_vehiculo}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col group"
                >
                  {/* Imagen */}
                  <Link href={`/portal/catalogo/${v.id_vehiculo}`} className="relative h-48 bg-slate-950 overflow-hidden block">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto}
                        alt={`${v.marca} ${v.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Car className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-wider">
                      {v.tipo_vehiculo || 'Auto'}
                    </span>
                    {v.anio && (
                      <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1 rounded-full border border-slate-700">
                        Año {v.anio}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/portal/catalogo/${v.id_vehiculo}`} className="block group/link">
                        <h2 className="text-base font-black text-white group-hover/link:text-slate-200 transition">
                          {v.marca} {v.modelo}
                        </h2>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{v.version || 'Versión estándar'}</p>
                      </Link>

                      {/* Chips de características */}
                      <div className="flex flex-wrap gap-2 mt-2.5 text-[11px] text-slate-400">
                        {v.km !== null && v.km !== undefined && (
                          <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded-lg border border-slate-800">
                            <Gauge className="w-3 h-3 text-slate-500" /> {v.km.toLocaleString('es-AR')} km
                          </span>
                        )}
                        {v.combustible && (
                          <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded-lg border border-slate-800">
                            <Fuel className="w-3 h-3 text-slate-500" /> {v.combustible}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios y Botón */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        {v.precio_venta_usd && (
                          <DualMoney
                            usd={Number(v.precio_venta_usd)}
                            ars={Number(v.precio_venta_ars || 0)}
                            rate={dolarActual}
                            primaryClassName="text-lg font-black text-white leading-none"
                            secondaryClassName="text-xs text-slate-400 font-bold block mt-1"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${msgWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-950/40"
                            title="Consultar por WhatsApp"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/portal/catalogo/${v.id_vehiculo}`}
                          className="p-2.5 rounded-xl text-white transition shadow-sm group-hover:scale-105"
                          style={{
                            background: 'var(--nl-mark-gradient, linear-gradient(135deg, #FF8A2B, #E25700))',
                          }}
                          title="Ver detalles"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
