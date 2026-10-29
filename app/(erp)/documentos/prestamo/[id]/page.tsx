import { obtenerDatosBoletoPrestamo } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { HandCoins } from 'lucide-react';
import PrintButton from '@/components/common/PrintButton';

const money = (value: number) =>
  Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function BoletoPrestamoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idPrestamo = Number(id);
  if (!Number.isInteger(idPrestamo)) notFound();

  let data;
  try {
    data = await obtenerDatosBoletoPrestamo(idPrestamo);
  } catch {
    notFound();
  }

  const { prestamo, concesionaria } = data;
  const deudor = prestamo.cliente;
  const rate = Number(prestamo.cotizacion_dolar_prestamo || 0) || 1400;
  const capitalUsd = Number(prestamo.capital_entregado_usd || 0);
  const capitalArs = capitalUsd * rate;
  const totalDevolverUsd = Number(prestamo.total_devolver_usd || 0);
  const totalDevolverArs = totalDevolverUsd * rate;
  const interesUsd = Math.max(0, totalDevolverUsd - capitalUsd);
  const interesPct = capitalUsd > 0 ? ((interesUsd / capitalUsd) * 100).toFixed(1) : '0';

  const cuotas = prestamo.cuotas || [];
  const cuotasGridCols = cuotas.length > 12 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="min-h-screen bg-slate-100 print:min-h-0 print:bg-white p-4 sm:p-6 print:p-0 text-slate-900 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 7mm 9mm 7mm 9mm;
            }
            @media print {
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 8pt !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-a4-sheet {
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
            }
          `,
        }}
      />

      {/* Barra superior de acción (Oculta en impresión) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-emerald-600" />
          Contrato de Mutuo Dinerario (A4 · 1 sola hoja)
        </span>
        <PrintButton
          label="Imprimir contrato (A4)"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-2 cursor-pointer text-xs"
        />
      </div>

      {/* HOJA A4 OFICIAL DEL CONTRATO */}
      <div className="print-a4-sheet max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-6 sm:p-8 print:p-0 rounded-2xl shadow-xl print:shadow-none space-y-3 print:space-y-2 text-slate-900 text-xs print:text-[8pt] print:leading-tight">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 gap-4">
          <div className="flex items-center gap-3">
            {concesionaria.logoUrl ? (
              <img
                src={concesionaria.logoUrl}
                alt={concesionaria.nombre}
                className="max-h-10 max-w-[140px] object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                {concesionaria.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                {concesionaria.nombre}
              </h1>
              <p className="text-[10px] print:text-[7.5pt] text-slate-600 mt-0.5 font-medium">
                CUIT: {concesionaria.cuit} · {concesionaria.direccion}
                {concesionaria.ciudad ? ` · ${concesionaria.ciudad}` : ''}
                {concesionaria.telefono ? ` · Tel: ${concesionaria.telefono}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 bg-slate-950 text-white font-black text-[9px] print:text-[7pt] uppercase tracking-wider rounded">
              Boleto y Mutuo de Crédito
            </span>
            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
              PREST-{prestamo.id_prestamo}
            </p>
            <p className="text-[9px] print:text-[7pt] text-slate-500">
              Fecha: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* PARTES INTERVINIENTES */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] print:text-[7.5pt]">
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider text-[9px] print:text-[7pt] mb-0.5 border-b border-slate-200 pb-0.5">
              Parte Acreedora (Prestamista)
            </p>
            <p><strong>Razón Social:</strong> {concesionaria.nombre}</p>
            <p><strong>CUIT:</strong> {concesionaria.cuit} · <strong>Domicilio:</strong> {concesionaria.direccion}</p>
          </div>
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider text-[9px] print:text-[7pt] mb-0.5 border-b border-slate-200 pb-0.5">
              Parte Deudora (Prestatario)
            </p>
            <p><strong>Nombre y Apellido:</strong> {deudor.nombre_completo}</p>
            <p><strong>DNI/CUIT:</strong> {deudor.dni || deudor.cuit_cuil || 'S/D'} · <strong>Tel:</strong> {deudor.telefono || 'S/D'}</p>
            <p><strong>Domicilio:</strong> {[deudor.domicilio, deudor.localidad].filter(Boolean).join(', ') || 'S/D'}</p>
          </div>
        </div>

        {/* CONDICIONES FINANCIERAS (FRANJA RESUMEN) */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900 text-white p-2 rounded-lg text-center">
          <div>
            <span className="text-[8px] print:text-[6.5pt] uppercase font-bold text-slate-400 block">Capital Desembolsado</span>
            <strong className="text-xs print:text-[8.5pt] font-black text-emerald-400 block">U$S {money(capitalUsd)}</strong>
            <span className="text-[8px] print:text-[6.5pt] text-slate-300 font-mono">$ {money(capitalArs)} ARS</span>
          </div>
          <div>
            <span className="text-[8px] print:text-[6.5pt] uppercase font-bold text-slate-400 block">Total a Reintegrar</span>
            <strong className="text-xs print:text-[8.5pt] font-black text-white block">U$S {money(totalDevolverUsd)}</strong>
            <span className="text-[8px] print:text-[6.5pt] text-emerald-300 font-mono">$ {money(totalDevolverArs)} ARS</span>
          </div>
          <div>
            <span className="text-[8px] print:text-[6.5pt] uppercase font-bold text-slate-400 block">Interés / Recargo</span>
            <strong className="text-xs print:text-[8.5pt] font-black text-amber-300 block">+{interesPct}%</strong>
            <span className="text-[8px] print:text-[6.5pt] text-slate-300">U$S {money(interesUsd)}</span>
          </div>
          <div>
            <span className="text-[8px] print:text-[6.5pt] uppercase font-bold text-slate-400 block">Plan y Tipo Cambio</span>
            <strong className="text-xs print:text-[8.5pt] font-black text-white block">{cuotas.length} Cuotas</strong>
            <span className="text-[8px] print:text-[6.5pt] text-slate-300 font-mono">TC: $ {money(rate)}</span>
          </div>
        </div>

        {/* CRONOGRAMA DE CUOTAS (COMPACTO Y MULTI-COLUMNA PARA 1 HOJA) */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-300 pb-0.5 mb-1">
            <h2 className="text-[9px] print:text-[7pt] font-black uppercase tracking-wider text-slate-800">
              Cronograma de Amortización y Vencimientos
            </h2>
            <span className="text-[8px] print:text-[6.5pt] text-slate-500 font-bold">
              {cuotas.length} cuotas consecutivas mensuales
            </span>
          </div>

          <div className={`grid ${cuotasGridCols} gap-x-2 gap-y-0.5 text-[8.5px] print:text-[7pt] font-mono`}>
            {cuotas.map((c: any) => {
              const usd = Number(c.monto_usd || 0);
              const ars = Number(c.monto_ars || 0) || usd * rate;
              const isPagada = c.estado === 'PAGADA';
              return (
                <div
                  key={c.id_cuota}
                  className={`flex items-center justify-between px-1.5 py-0.5 rounded border ${
                    isPagada
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <span className="font-bold font-sans">#{c.numero_cuota}</span>
                  <span className="text-slate-600">{new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
                  <span className="font-black">U$S {money(usd)}</span>
                  <span className="text-[7.5px] print:text-[6pt] text-slate-500">${Math.round(ars).toLocaleString('es-AR')}</span>
                  <span
                    className={`text-[7px] print:text-[5.5pt] px-1 py-0.2 rounded font-sans font-black ${
                      isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPagada ? 'PAGADA' : 'PENDIENTE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLÁUSULAS LEGALES DE RIGOR */}
        <div className="space-y-1 text-[8.5px] print:text-[6.8pt] text-slate-600 leading-tight text-justify border-t border-slate-200 pt-1.5">
          <p>
            <strong>PRIMERA (Objeto y Entrega):</strong> La parte Acreedora entrega a la parte Deudora en calidad de mutuo dinerario con destino financiero el capital indicado, sirviendo el presente de suficiente recibo y carta de pago por los importes percibidos en este acto.
          </p>
          <p>
            <strong>SEGUNDA (Reintegro e Intereses):</strong> El Deudor se obliga irrevocablemente a restituir el monto total pactado en las fechas y cuotas convenidas en el cronograma superior. Toda cancelación en moneda nacional se liquidará según la pauta cambiaria establecida en las condiciones particulares.
          </p>
          <p>
            <strong>TERCERA (Mora Automática y Caducidad):</strong> La falta de pago de cualquier cuota a su respectivo vencimiento constituirá al Deudor en mora de pleno derecho sin necesidad de intimación judicial o extrajudicial, facultando al Acreedor a declarar la caducidad de todos los plazos y exigir la totalidad del saldo adeudado con intereses moratorios y punitorios.
          </p>
          <p>
            <strong>CUARTA (Jurisdicción):</strong> Las partes constituyen domicilios especiales en los consignados precedentemente, sometiéndose a la competencia de los Tribunales Ordinarios de la jurisdicción del Acreedor, renunciando a todo otro fuero o fuero federal.
          </p>
        </div>

        {/* FIRMAS (AL PIE DE PÁGINA) */}
        <div className="pt-6 print:pt-4 grid grid-cols-2 gap-8 text-center text-[9px] print:text-[7pt]">
          <div className="border-t border-slate-900 pt-1">
            <p className="font-black uppercase">{concesionaria.nombre}</p>
            <p className="text-slate-500 text-[8px] print:text-[6.5pt]">Parte Acreedora (Prestamista)</p>
          </div>
          <div className="border-t border-slate-900 pt-1">
            <p className="font-black uppercase">{deudor.nombre_completo}</p>
            <p className="text-slate-500 text-[8px] print:text-[6.5pt]">
              Parte Deudora · DNI: {deudor.dni || deudor.cuit_cuil || '.......................'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
