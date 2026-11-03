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

  const cuotas = prestamo.cuotas || [];
  const cuotasCount = cuotas.length;

  /* ─── Determinar layout de tabla según cantidad de cuotas ─── */
  // <= 6:  tabla única con filas generosas (py-3)
  // 7-12:  tabla única con filas normales (py-2)
  // 13-24: dos columnas
  // > 24:  tres columnas compactas
  const useSingleTable = cuotasCount <= 12;
  const useTwoCols = cuotasCount > 12 && cuotasCount <= 24;
  const useThreeCols = cuotasCount > 24;
  const rowPadding = cuotasCount <= 6 ? 'py-3 print:py-2.5' : 'py-2 print:py-1.5';

  return (
    <div className="min-h-screen bg-slate-100 print:min-h-0 print:bg-white p-4 sm:p-6 print:p-0 text-slate-900 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 6mm 10mm 6mm 10mm;
            }
            @media print {
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 7.8pt !important;
                color: #000 !important;
                height: 100% !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              a[href]:after {
                content: none !important;
              }
              .print-a4-sheet {
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                max-height: 278mm !important;
                display: flex !important;
                flex-direction: column !important;
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
          Contrato de Mutuo Dinerario (A4 · 1 sola hoja completa)
        </span>
        <PrintButton
          label="Imprimir Contrato (A4)"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-2 cursor-pointer text-xs"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HOJA A4 OFICIAL DEL CONTRATO
          Estructura: Header → Partes → Resumen → Cronograma → Cláusulas → Firmas
          El espacio sobrante se asigna entre cláusulas y firmas (mt-auto)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="print-a4-sheet max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-6 sm:p-8 print:p-0 rounded-2xl shadow-xl print:shadow-none text-slate-900 text-xs print:text-[8pt] print:leading-tight flex flex-col print:min-h-[278mm] print:h-[278mm]">

        {/* ────────── ENCABEZADO ────────── */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 gap-4">
          <div className="flex items-center gap-4">
            {concesionaria.logoUrl ? (
              <img
                src={concesionaria.logoUrl}
                alt={concesionaria.nombre}
                className="max-h-16 print:max-h-14 max-w-[220px] object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                {concesionaria.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg print:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                {concesionaria.nombre}
              </h1>
              <p className="text-[10.5px] print:text-[8pt] text-slate-600 mt-1 font-medium">
                CUIT: {concesionaria.cuit} · {concesionaria.direccion}
                {concesionaria.ciudad ? ` · ${concesionaria.ciudad}` : ''}
                {concesionaria.telefono ? ` · Tel: ${concesionaria.telefono}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-slate-950 text-white font-black text-[9.5px] print:text-[7.5pt] uppercase tracking-wider rounded">
              Boleto y Mutuo de Crédito
            </span>
            <p className="text-sm print:text-[9.5pt] font-black text-slate-900 font-mono mt-0.5">
              PREST-{prestamo.id_prestamo}
            </p>
            <p className="text-[9.5px] print:text-[7.5pt] text-slate-500">
              Fecha: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* ────────── PARTES INTERVINIENTES ────────── */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] print:text-[7.5pt] mt-2.5">
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

        {/* ────────── RESUMEN FINANCIERO ────────── */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 text-white p-3 rounded-lg text-center mt-2.5">
          <div>
            <span className="text-[8.5px] print:text-[7pt] uppercase font-bold text-slate-400 block">Capital Desembolsado</span>
            <strong className="text-sm print:text-[9.5pt] font-black text-emerald-400 block">$ {money(capitalArs)} ARS</strong>
            <span className="text-[8.5px] print:text-[7pt] text-slate-300 font-mono">U$S {money(capitalUsd)}</span>
          </div>
          <div>
            <span className="text-[8.5px] print:text-[7pt] uppercase font-bold text-slate-400 block">Total a Reintegrar</span>
            <strong className="text-sm print:text-[9.5pt] font-black text-white block">$ {money(totalDevolverArs)} ARS</strong>
            <span className="text-[8.5px] print:text-[7pt] text-emerald-300 font-mono">U$S {money(totalDevolverUsd)}</span>
          </div>
          <div>
            <span className="text-[8.5px] print:text-[7pt] uppercase font-bold text-slate-400 block">Plan de Amortización</span>
            <strong className="text-sm print:text-[9.5pt] font-black text-white block">{cuotasCount} Cuotas Consecutivas</strong>
            <span className="text-[8.5px] print:text-[7pt] text-slate-300 font-mono">TC Referencia: $ {money(rate)}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            CRONOGRAMA DE AMORTIZACIÓN Y VENCIMIENTOS
            Pegado directo debajo del resumen, sin espacio vacío
        ════════════════════════════════════════════════════════════ */}
        <div className="mt-3 print:mt-2">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1 mb-0">
            <h2 className="text-[10px] print:text-[7.5pt] font-black uppercase tracking-wider text-slate-900">
              Cronograma de Amortización y Vencimientos
            </h2>
            <span className="text-[8.5px] print:text-[6.5pt] text-slate-500 font-bold italic">
              {cuotasCount} cuotas consecutivas mensuales
            </span>
          </div>

          {/* ── CASO A: HASTA 12 CUOTAS → 1 tabla ancha con filas generosas ── */}
          {useSingleTable && (
            <table className="w-full border-collapse text-[9px] print:text-[7pt]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left font-black uppercase tracking-wider px-3 py-2 print:py-1.5 w-[60px]">Cuota</th>
                  <th className="text-left font-black uppercase tracking-wider px-3 py-2 print:py-1.5">Vencimiento</th>
                  <th className="text-right font-black uppercase tracking-wider px-3 py-2 print:py-1.5">Importe ARS</th>
                  <th className="text-right font-black uppercase tracking-wider px-3 py-2 print:py-1.5 w-[100px]">Ref. USD</th>
                  <th className="text-center font-black uppercase tracking-wider px-3 py-2 print:py-1.5 w-[80px]">Estado</th>
                  <th className="text-center font-black uppercase tracking-wider px-3 py-2 print:py-1.5 w-[100px]">Control / Firma</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c: any, idx: number) => {
                  const usd = Number(c.monto_usd || 0);
                  const ars = Number(c.monto_ars || 0) || usd * rate;
                  const isPagada = c.estado === 'PAGADA';
                  return (
                    <tr
                      key={c.id_cuota}
                      className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isPagada ? '!bg-emerald-50' : ''}`}
                    >
                      <td className={`px-3 ${rowPadding} font-black text-slate-900`}>#{c.numero_cuota}</td>
                      <td className={`px-3 ${rowPadding} text-slate-700 font-medium`}>
                        {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </td>
                      <td className={`px-3 ${rowPadding} text-right font-black text-slate-900 text-[10px] print:text-[7.5pt]`}>
                        ${Math.round(ars).toLocaleString('es-AR')}
                      </td>
                      <td className={`px-3 ${rowPadding} text-right text-slate-500 font-mono text-[8px] print:text-[6.5pt]`}>
                        U$S {money(usd)}
                      </td>
                      <td className={`px-3 ${rowPadding} text-center`}>
                        <span className={`inline-block text-[7.5px] print:text-[6pt] px-2 py-0.5 rounded-sm font-black uppercase tracking-wide ${
                          isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isPagada ? 'PAGADA' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className={`px-3 ${rowPadding} text-center text-[8px] print:text-[6pt] text-slate-400`}>
                        {c.recibo_nro ? `Rec. ${c.recibo_nro}` : '...........................'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ── CASO B: 13-24 CUOTAS → 2 columnas balanceadas ── */}
          {useTwoCols && (
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {[0, 1].map((colIdx) => {
                const half = Math.ceil(cuotasCount / 2);
                const colCuotas = colIdx === 0 ? cuotas.slice(0, half) : cuotas.slice(half);
                return (
                  <table key={colIdx} className="w-full border-collapse text-[8px] print:text-[6.5pt]">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left font-black uppercase px-2 py-1.5 print:py-1 w-[32px]">N°</th>
                        <th className="text-left font-black uppercase px-2 py-1.5 print:py-1">Vto.</th>
                        <th className="text-right font-black uppercase px-2 py-1.5 print:py-1">ARS</th>
                        <th className="text-right font-black uppercase px-2 py-1.5 print:py-1 w-[55px]">USD</th>
                        <th className="text-center font-black uppercase px-2 py-1.5 print:py-1 w-[44px]">Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colCuotas.map((c: any, idx: number) => {
                        const usd = Number(c.monto_usd || 0);
                        const ars = Number(c.monto_ars || 0) || usd * rate;
                        const isPagada = c.estado === 'PAGADA';
                        return (
                          <tr key={c.id_cuota} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isPagada ? '!bg-emerald-50' : ''}`}>
                            <td className="px-2 py-1.5 print:py-1 font-black">#{c.numero_cuota}</td>
                            <td className="px-2 py-1.5 print:py-1 text-slate-600">
                              {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                            </td>
                            <td className="px-2 py-1.5 print:py-1 text-right font-black">
                              ${Math.round(ars).toLocaleString('es-AR')}
                            </td>
                            <td className="px-2 py-1.5 print:py-1 text-right text-slate-500 font-mono text-[7px] print:text-[5.5pt]">
                              {money(usd)}
                            </td>
                            <td className="px-2 py-1.5 print:py-1 text-center">
                              <span className={`text-[6.5px] print:text-[5pt] px-1 py-0.5 rounded-sm font-black ${
                                isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isPagada ? 'PAG' : 'PEN'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })}
            </div>
          )}

          {/* ── CASO C: MÁS DE 24 CUOTAS → 3 columnas compactas ── */}
          {useThreeCols && (
            <div className="grid grid-cols-3 gap-1.5 mt-0.5 text-[7.5px] print:text-[6pt] font-mono">
              {cuotas.map((c: any) => {
                const usd = Number(c.monto_usd || 0);
                const ars = Number(c.monto_ars || 0) || usd * rate;
                const isPagada = c.estado === 'PAGADA';
                return (
                  <div
                    key={c.id_cuota}
                    className={`flex items-center justify-between px-1.5 py-0.5 rounded border ${
                      isPagada ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="font-bold font-sans">#{c.numero_cuota}</span>
                    <span className="text-slate-600">{new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
                    <span className="font-black">${Math.round(ars).toLocaleString('es-AR')}</span>
                    <span className="text-slate-500 font-mono text-[6.5px]">{money(usd)}</span>
                    <span className={`text-[6.5px] print:text-[5pt] px-1 py-0.5 rounded font-sans font-black ${
                      isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPagada ? 'P' : 'D'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            CLÁUSULAS LEGALES
            Van pegadas después del cronograma
        ════════════════════════════════════════════════════════════ */}
        <div className="mt-3 print:mt-2 space-y-1 text-[8px] print:text-[6.5pt] text-slate-700 leading-tight text-justify border-t border-slate-300 pt-2 print:pt-1.5">
          <p>
            <strong>PRIMERA (Naturaleza del Acto y Desembolso):</strong> La parte Acreedora entrega en este acto a la parte Deudora en calidad de mutuo dinerario con destino financiero el capital desembolsado consignado, sirviendo el presente de suficiente recibo, constancia formal de entrega y carta de pago por los importes percibidos de plena conformidad.
          </p>
          <p>
            <strong>SEGUNDA (Cronograma Irrevocable y Cancelación):</strong> El Deudor asume el reconocimiento formal e irrevocable de la deuda total pactada y se compromete a reintegrarla íntegramente en las fechas y cuotas fijadas en el cronograma superior. En caso de liquidación en pesos, se cancelará al tipo de cambio acordado o liquidación de plaza a la fecha de efectivo cobro.
          </p>
          <p>
            <strong>TERCERA (Mora Automática e Intereses Punitorios):</strong> La falta de pago de cualquier cuota a su respectivo vencimiento constituirá al Deudor en mora de pleno derecho, en forma automática y sin necesidad de intimación o interpelación judicial o extrajudicial alguna. Desde la fecha de mora y hasta el efectivo cobro, se devengará un interés punitorio diario equivalente al doble de la tasa pactada sobre el saldo impago.
          </p>
          <p>
            <strong>CUARTA (Caducidad Anticipada de Plazos):</strong> La falta de cancelación en término de una (1) sola cuota faculta a la Acreedora a declarar de pleno derecho la caducidad anticipada de la totalidad de los plazos pendientes, tornándose de plazo vencido, líquido y exigible el saldo total adeudado.
          </p>
          <p>
            <strong>QUINTA (Fuerza Ejecutiva y Pagaré en Garantía):</strong> Las partes convienen expresamente que este instrumento acredita una deuda líquida y exigible conforme Arts. 1525, 1527 del Código Civil y Comercial de la Nación, gozando de fuerza ejecutiva. En su garantía, el Deudor libra pagaré a la vista sin protesto conforme Art. 101 y ccdtes. del Dec. Ley 5.965/63.
          </p>
          <p>
            <strong>SEXTA (Jurisdicción y Domicilios):</strong> Las partes fijan domicilios especiales en los consignados precedentemente, sometiéndose a la competencia de los Tribunales Ordinarios correspondientes a la jurisdicción de la parte Acreedora, haciendo renuncia expresa a cualquier otro fuero de excepción o federal.
          </p>
        </div>

        {/* ── RECUADRO DE ADVERTENCIA LEGAL ── */}
        <div className="mt-2 print:mt-1.5 border border-slate-900 bg-slate-50 p-2 rounded text-[7.5px] print:text-[6.2pt] leading-tight text-slate-900">
          <p className="font-black uppercase tracking-wider text-slate-950 mb-0.5">
            ⚠️ AVISO LEGAL Y ADVERTENCIA DE RIESGO CREDITICIO (ART. 1525 Y CCDTES. CCCN):
          </p>
          <p className="text-justify font-sans">
            Se notifica expresamente a la Parte Deudora que el presente instrumento constituye reconocimiento de crédito formal. El incumplimiento en los pagos generará la aplicación inmediata de intereses punitorios diarios, habilitando a la Acreedora a promover demanda ejecutiva con traba de embargo preventivo de sueldos, cuentas bancarias e inhibición de bienes, comunicándose de inmediato el estado de morosidad a la Central de Deudores del Banco Central de la República Argentina (BCRA) y bases de antecedentes crediticios (Veraz / Nosis).
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
            FIRMAS — empujadas al fondo de la hoja con mt-auto
            El espacio sobrante queda entre las cláusulas y las firmas,
            dando espacio natural para firma manuscrita
        ════════════════════════════════════════════════════════════ */}
        <div className="mt-auto pt-8 print:pt-6">
          <div className="grid grid-cols-2 gap-16 text-center text-[9.5px] print:text-[7.5pt]">
            <div className="border-t-2 border-slate-900 pt-2 space-y-0.5">
              <p className="font-black uppercase tracking-wider text-slate-950">{concesionaria.nombre}</p>
              <p className="text-slate-500 text-[8px] print:text-[6.5pt]">Parte Acreedora (Prestamista · Firma y Sello)</p>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 space-y-0.5">
              <p className="font-black uppercase tracking-wider text-slate-950">{deudor.nombre_completo}</p>
              <p className="text-slate-500 text-[8px] print:text-[6.5pt]">
                Parte Deudora (Prestatario) · DNI: {deudor.dni || deudor.cuit_cuil || '.......................'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
