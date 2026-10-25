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
  const interesArs = interesUsd * rate;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-emerald-600" />
          Vista previa de boleto y contrato de préstamo
        </span>
        <PrintButton
          label="Imprimir contrato"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none space-y-6 text-sm leading-relaxed">
        {/* ENCABEZADO */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-4">
            {concesionaria.logoUrl && (
              <img
                src={concesionaria.logoUrl}
                alt={concesionaria.nombre}
                className="max-h-16 max-w-[180px] object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                {concesionaria.nombre}
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                CUIT: {concesionaria.cuit} · {concesionaria.direccion}
                {concesionaria.ciudad ? ` · ${concesionaria.ciudad}` : ''}
              </p>
              {concesionaria.telefono && (
                <p className="text-xs text-slate-600 font-medium">
                  Tel: {concesionaria.telefono}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
              Contrato de Mutuo Dinerario
            </span>
            <p className="text-sm font-black text-slate-900 mt-2 font-mono">
              PREST-{prestamo.id_prestamo}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Fecha: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* PARTES INTERVINIENTES */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider mb-1">
              Parte Acreedora (Prestamista)
            </p>
            <p>
              <strong>Razón social:</strong> {concesionaria.nombre}
            </p>
            <p>
              <strong>CUIT:</strong> {concesionaria.cuit}
            </p>
            <p>
              <strong>Domicilio:</strong> {concesionaria.direccion}
            </p>
            {prestamo.location && (
              <p>
                <strong>Sucursal:</strong> {prestamo.location.name}
              </p>
            )}
          </div>
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider mb-1">
              Parte Deudora (Prestatario)
            </p>
            <p>
              <strong>Nombre completo:</strong> {deudor.nombre_completo}
            </p>
            <p>
              <strong>DNI / CUIT:</strong> {deudor.dni || deudor.cuit_cuil || 'S/D'}
            </p>
            <p>
              <strong>Teléfono:</strong> {deudor.telefono || 'S/D'}
            </p>
            <p>
              <strong>Domicilio:</strong> {[deudor.domicilio, deudor.localidad, deudor.provincia].filter(Boolean).join(', ') || 'S/D'}
            </p>
          </div>
        </div>

        {/* CLÁUSULA PRIMERA: CAPITAL ENTREGADO */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-slate-200 pb-1">
            Cláusula Primera: Objeto y Capital Mutuado
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            La parte ACREEDORA entrega en este acto a la parte DEUDORA, en calidad de mutuo dinerario con destino de financiación, la suma líquida de dinero especificada a continuación, sirviendo el presente de eficaz y formal recibo de entrega:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400">Capital en Dólares (USD)</span>
              <strong className="block text-lg font-black text-slate-900 mt-0.5">U$S {money(capitalUsd)}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400">Capital Equivalente (ARS)</span>
              <strong className="block text-lg font-black text-slate-900 mt-0.5">$ {money(capitalArs)}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400">Tipo de Cambio Fijado</span>
              <strong className="block text-lg font-black text-slate-900 mt-0.5 font-mono">$ {money(rate)}</strong>
            </div>
          </div>
        </section>

        {/* CLÁUSULA SEGUNDA: CONDICIONES FINANCIERAS Y TOTAL A DEVOLVER */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-slate-200 pb-1">
            Cláusula Segunda: Reintegro, Intereses y Total Pactado
          </h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">
              Monto total a reintegrar por el prestatario
            </p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              $ {money(totalDevolverArs)} ARS
            </p>
            <p className="text-sm font-bold text-emerald-800">
              USD {money(totalDevolverUsd)} · Interés compensatorio USD {money(interesUsd)}
            </p>
          </div>
          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border">
            <div className="flex justify-between py-1 border-b">
              <span>TNA acordada</span>
              <strong>{Number(prestamo.tna_aplicada || 0)}% nominal anual</strong>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span>Cantidad de cuotas pactadas</span>
              <strong>{prestamo.cuotas.length} cuotas mensuales consecutivas</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Estado formal</span>
              <strong className="text-emerald-700 uppercase font-black">{prestamo.estado}</strong>
            </div>
          </div>
        </section>

        {/* CLÁUSULA TERCERA: PLAN DE CUOTAS */}
        <section className="space-y-2 text-xs">
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-slate-200 pb-1">
            Cláusula Tercera: Cronograma de Vencimientos y Plan de Pagos
          </h2>
          <p className="text-xs text-slate-700 mb-2">
            La amortización del capital y sus intereses compensatorios se efectuará en las fechas estipuladas en el siguiente cronograma:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-black uppercase text-[10px]">
                <tr>
                  <th className="p-2 border-b">Cuota N°</th>
                  <th className="p-2 border-b">Vencimiento</th>
                  <th className="p-2 border-b text-right">Importe USD</th>
                  <th className="p-2 border-b text-right">Contravalor ARS</th>
                  <th className="p-2 border-b text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {prestamo.cuotas.map((c: any) => {
                  const usd = Number(c.monto_usd || 0);
                  const ars = Number(c.monto_ars || 0) || usd * rate;
                  return (
                    <tr key={c.id_cuota} className="hover:bg-slate-50">
                      <td className="p-2 font-bold font-sans">Cuota #{c.numero_cuota}</td>
                      <td className="p-2">
                        {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-2 text-right font-black text-slate-900">
                        U$S {money(usd)}
                      </td>
                      <td className="p-2 text-right text-slate-600">
                        $ {money(ars)}
                      </td>
                      <td className="p-2 text-center font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.estado === 'PAGADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* CLÁUSULAS LEGALES */}
        <div className="space-y-2 text-[11px] text-slate-600 text-justify">
          <p>
            <strong>Cláusula Cuarta (Mora y Caducidad de Plazos):</strong> La falta de pago de cualquiera de las cuotas a su respectivo vencimiento constituirá al DEUDOR en mora de pleno derecho por el mero transcurso del tiempo, sin necesidad de interpelación judicial o extrajudicial alguna. En tal supuesto, la parte ACREEDORA se reserva el derecho de declarar la caducidad de todos los plazos pendientes y exigir el pago íntegro de la deuda con más los intereses moratorios y punitorios correspondientes.
          </p>
          <p>
            <strong>Cláusula Quinta (Imputación y Moneda):</strong> Todo pago que realice el DEUDOR se imputará primeramente a gastos, luego a intereses y finalmente a capital. En caso de cancelaciones en moneda nacional, regirá el tipo de cambio pactado en las condiciones particulares.
          </p>
          <p>
            <strong>Cláusula Sexta (Jurisdicción y Domicilio):</strong> Para todos los efectos legales derivados del presente contrato, las partes fijan domicilios especiales en los consignados precedentemente, sometiéndose a la jurisdicción de los Tribunales Ordinarios competentes, renunciando a cualquier otro fuero que pudiera corresponder.
          </p>
        </div>

        {/* PIE DE IMPRESIÓN */}
        {concesionaria.pieImpresion && (
          <p className="text-[10px] text-slate-500 border-t pt-3">
            {concesionaria.pieImpresion}
          </p>
        )}

        {/* FIRMAS */}
        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase">{concesionaria.nombre}</p>
            <p className="text-slate-500">Parte Acreedora (Prestamista)</p>
          </div>
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase">{deudor.nombre_completo}</p>
            <p className="text-slate-500">
              Parte Deudora · DNI {deudor.dni || '..........'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
