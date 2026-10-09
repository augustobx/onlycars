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
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-emerald-400" /> Catálogo de Unidades
        </h1>
        <p className="text-xs text-slate-400">
          Stock disponible en <strong className="text-slate-200">{agencyName}</strong> para entrega inmediata.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca, modelo o año..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-850 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
        {['TODOS', 'Auto', 'Camioneta', 'SUV', 'Moto'].map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${
              filtroTipo === tipo
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {tipo === 'TODOS' ? 'Todos los vehículos' : tipo}
          </button>
        ))}
      </div>

      {/* Lista de vehículos */}
      <div className="space-y-3 pt-1">
        {filteredVehiculos.length === 0 ? (
          <div className="p-8 text-center bg-slate-850 border border-slate-800 rounded-3xl space-y-2">
            <Car className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">No se encontraron unidades</p>
            <p className="text-xs text-slate-400">Probá modificando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          filteredVehiculos.map((v) => {
            const foto = v.fotos[0]?.url_foto;
            const msgWhatsapp = encodeURIComponent(
              `Hola! Quisiera consultar por el ${v.marca} ${v.modelo} ${v.version || ''} (${v.anio || ''}) que vi en su portal.`
            );

            return (
              <div
                key={v.id_vehiculo}
                className="bg-slate-850 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition hover:border-slate-700 flex flex-col"
              >
                {/* Imagen */}
                <Link href={`/portal/catalogo/${v.id_vehiculo}`} className="relative h-48 bg-slate-900 overflow-hidden block">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foto}
                      alt={`${v.marca} ${v.modelo}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Car className="w-12 h-12" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
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
                    <Link href={`/portal/catalogo/${v.id_vehiculo}`} className="block group">
                      <h2 className="text-base font-black text-white group-hover:text-emerald-400 transition">
                        {v.marca} {v.modelo}
                      </h2>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{v.version || 'Versión estándar'}</p>
                    </Link>

                    {/* Chips de características */}
                    <div className="flex flex-wrap gap-2 mt-2.5 text-[11px] text-slate-400">
                      {v.km !== null && v.km !== undefined && (
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          <Gauge className="w-3 h-3 text-slate-500" /> {v.km.toLocaleString('es-AR')} km
                        </span>
                      )}
                      {v.combustible && (
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          <Fuel className="w-3 h-3 text-slate-500" /> {v.combustible}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Precios y Botón */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      {v.precio_venta_usd && (
                        <DualMoney
                          usd={Number(v.precio_venta_usd)}
                          ars={Number(v.precio_venta_ars || 0)}
                          rate={dolarActual}
                          primaryClassName="text-lg font-black text-emerald-400 leading-none"
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
                          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
                          title="Consultar por WhatsApp"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/portal/catalogo/${v.id_vehiculo}`}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700"
                        title="Ver detalles"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
