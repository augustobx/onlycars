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
  const cuotasCount = cuotas.length;

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
                height: 100% !important;
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
                min-height: 282mm !important;
                height: 282mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
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

      {/* HOJA A4 OFICIAL DEL CONTRATO (DISTRIBUCIÓN VERTICAL COMPLETA) */}
      <div className="print-a4-sheet max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-6 sm:p-8 print:p-0 rounded-2xl shadow-xl print:shadow-none text-slate-900 text-xs print:text-[8pt] print:leading-tight flex flex-col justify-between print:min-h-[282mm] print:h-[282mm]">
        {/* BLOQUE SUPERIOR: HEADER, PARTES Y RESUMEN FINANCIERO */}
        <div className="space-y-2.5 print:space-y-2">
          {/* ENCABEZADO */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 gap-4">
            <div className="flex items-center gap-3">
              {concesionaria.logoUrl ? (
                <img
                  src={concesionaria.logoUrl}
                  alt={concesionaria.nombre}
                  className="max-h-11 max-w-[150px] object-contain"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {concesionaria.nombre.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-base print:text-sm font-black tracking-tight text-slate-950 uppercase leading-none">
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
              <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-white font-black text-[9px] print:text-[7pt] uppercase tracking-wider rounded">
                Boleto y Mutuo de Crédito
              </span>
              <p className="text-xs print:text-[8.5pt] font-black text-slate-900 font-mono mt-0.5">
                PREST-{prestamo.id_prestamo}
              </p>
              <p className="text-[9px] print:text-[7pt] text-slate-500">
                Fecha: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          {/* PARTES INTERVINIENTES */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] print:text-[7.5pt]">
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
          <div className="grid grid-cols-4 gap-2 bg-slate-950 text-white p-2.5 rounded-lg text-center">
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
              <strong className="text-xs print:text-[8.5pt] font-black text-white block">{cuotasCount} Cuotas</strong>
              <span className="text-[8px] print:text-[6.5pt] text-slate-300 font-mono">TC: $ {money(rate)}</span>
            </div>
          </div>
        </div>

        {/* BLOQUE MEDIO: CRONOGRAMA DE CUOTAS DINÁMICO SEGÚN CANTIDAD */}
        <div className="my-2 print:my-1.5 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
            <h2 className="text-[9px] print:text-[7pt] font-black uppercase tracking-wider text-slate-900">
              Cronograma de Amortización y Vencimientos
            </h2>
            <span className="text-[8px] print:text-[6.5pt] text-slate-500 font-bold">
              {cuotasCount} cuotas consecutivas mensuales
            </span>
          </div>

          {/* CASO A: HASTA 12 CUOTAS -> 1 SOLA TABLA ANCHA QUE OCUPA EL ALTO DE LA HOJA */}
          {cuotasCount <= 12 && (
            <div className="border border-slate-300 rounded-lg overflow-hidden text-[8.5px] print:text-[7pt] font-mono">
              <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 px-2.5 py-1 font-sans font-black text-slate-700 text-[8px] print:text-[6.5pt] uppercase">
                <span className="col-span-1">Cuota</span>
                <span className="col-span-2">Vencimiento</span>
                <span className="col-span-2 text-right">Importe USD</span>
                <span className="col-span-2 text-right">Referencia ARS</span>
                <span className="col-span-2 text-center">Estado</span>
                <span className="col-span-3 text-right">Control / Firma Recibo</span>
              </div>
              <div className="divide-y divide-slate-200">
                {cuotas.map((c: any) => {
                  const usd = Number(c.monto_usd || 0);
                  const ars = Number(c.monto_ars || 0) || usd * rate;
                  const isPagada = c.estado === 'PAGADA';
                  return (
                    <div
                      key={c.id_cuota}
                      className={`grid grid-cols-12 items-center px-2.5 py-1.5 ${
                        isPagada ? 'bg-emerald-50/50 text-emerald-950' : 'bg-white text-slate-900'
                      }`}
                    >
                      <span className="col-span-1 font-bold font-sans">#{c.numero_cuota}</span>
                      <span className="col-span-2 text-slate-600">
                        {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </span>
                      <span className="col-span-2 text-right font-black">U$S {money(usd)}</span>
                      <span className="col-span-2 text-right text-slate-500 font-sans">
                        ${Math.round(ars).toLocaleString('es-AR')}
                      </span>
                      <span className="col-span-2 text-center">
                        <span
                          className={`text-[7px] print:text-[5.5pt] px-1.5 py-0.5 rounded font-sans font-black ${
                            isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isPagada ? 'PAGADA' : 'PENDIENTE'}
                        </span>
                      </span>
                      <span className="col-span-3 text-right font-sans text-[7.5px] print:text-[6pt] text-slate-400">
                        {c.recibo_nro ? `Recibo: ${c.recibo_nro}` : '...................................................'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CASO B: DE 13 A 24 CUOTAS -> 2 COLUMNAS PERFECTAMENTE BALANCEADAS */}
          {cuotasCount > 12 && cuotasCount <= 24 && (
            <div className="grid grid-cols-2 gap-2 text-[8px] print:text-[6.5pt] font-mono">
              {[0, 1].map((colIdx) => {
                const half = Math.ceil(cuotasCount / 2);
                const colCuotas = colIdx === 0 ? cuotas.slice(0, half) : cuotas.slice(half);
                return (
                  <div key={colIdx} className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-6 bg-slate-100 border-b border-slate-300 px-2 py-0.5 font-sans font-black text-slate-700 text-[7.5px] print:text-[6pt] uppercase">
                      <span className="col-span-1">N°</span>
                      <span className="col-span-2">Vto.</span>
                      <span className="col-span-2 text-right">USD</span>
                      <span className="col-span-1 text-center">Est.</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {colCuotas.map((c: any) => {
                        const usd = Number(c.monto_usd || 0);
                        const isPagada = c.estado === 'PAGADA';
                        return (
                          <div
                            key={c.id_cuota}
                            className={`grid grid-cols-6 items-center px-2 py-1 ${
                              isPagada ? 'bg-emerald-50/50' : 'bg-white'
                            }`}
                          >
                            <span className="col-span-1 font-bold font-sans">#{c.numero_cuota}</span>
                            <span className="col-span-2 text-slate-600">
                              {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                            </span>
                            <span className="col-span-2 text-right font-black">U$S {money(usd)}</span>
                            <span className="col-span-1 text-center">
                              <span
                                className={`text-[6.5px] print:text-[5pt] px-1 py-0.2 rounded font-sans font-black ${
                                  isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isPagada ? 'PAG' : 'PEN'}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CASO C: MÁS DE 24 CUOTAS -> 3 COLUMNAS COMPACTAS */}
          {cuotasCount > 24 && (
            <div className="grid grid-cols-3 gap-1.5 text-[7.5px] print:text-[6pt] font-mono">
              {cuotas.map((c: any) => {
                const usd = Number(c.monto_usd || 0);
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
                    <span className="font-black">U$S {money(usd)}</span>
                    <span
                      className={`text-[6.5px] print:text-[5pt] px-1 py-0.2 rounded font-sans font-black ${
                        isPagada ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPagada ? 'P' : 'D'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BLOQUE INFERIOR: CLÁUSULAS LEGALES, AVISO DE ADVERTENCIA Y FIRMAS */}
        <div className="space-y-2 print:space-y-1.5 border-t border-slate-300 pt-2">
          {/* CLÁUSULAS LEGALES DE MUTUO FINANCIERO */}
          <div className="space-y-1 text-[8px] print:text-[6.5pt] text-slate-700 leading-tight text-justify">
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

          {/* RECUADRO DE ADVERTENCIA LEGAL Y RIESGO CREDITICIO (CLÁUSULA DE AVISO) */}
          <div className="border border-slate-900 bg-slate-50 p-2 rounded text-[7.5px] print:text-[6.2pt] leading-tight text-slate-900">
            <p className="font-black uppercase tracking-wider text-slate-950 mb-0.5">
              ⚠️ AVISO LEGAL Y ADVERTENCIA DE RIESGO CREDITICIO (ART. 1525 Y CCDTES. CCCN):
            </p>
            <p className="text-justify font-sans">
              Se notifica expresamente a la Parte Deudora que el presente instrumento constituye reconocimiento de crédito formal. El incumplimiento en los pagos generará la aplicación inmediata de intereses punitorios diarios, habilitando a la Acreedora a promover demanda ejecutiva con traba de embargo preventivo de sueldos, cuentas bancarias e inhibición de bienes, comunicándose de inmediato el estado de morosidad a la Central de Deudores del Banco Central de la República Argentina (BCRA) y bases de antecedentes crediticios (Veraz / Nosis).
            </p>
          </div>

          {/* ESPACIO DE FIRMAS ANCLADO AL PIE DE PÁGINA */}
          <div className="pt-4 print:pt-3 grid grid-cols-2 gap-8 text-center text-[9px] print:text-[7pt]">
            <div className="border-t border-slate-900 pt-1">
              <p className="font-black uppercase">{concesionaria.nombre}</p>
              <p className="text-slate-500 text-[8px] print:text-[6pt]">Parte Acreedora (Prestamista)</p>
            </div>
            <div className="border-t border-slate-900 pt-1">
              <p className="font-black uppercase">{deudor.nombre_completo}</p>
              <p className="text-slate-500 text-[8px] print:text-[6pt]">
                Parte Deudora · DNI: {deudor.dni || deudor.cuit_cuil || '.......................'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
