import { obtenerDatosReciboCuota } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { Receipt, FileText, Printer, CheckCircle2 } from 'lucide-react';
import PrintButton from '@/components/common/PrintButton';

export const dynamic = 'force-dynamic';

const money = (value: number) =>
  Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function ReciboCuotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const idCuota = Number(id);
  if (!Number.isInteger(idCuota)) notFound();

  const sParams = searchParams ? await searchParams : {};
  const tipo = sParams.tipo === 'VENTA' ? 'VENTA' : 'PRESTAMO';

  let data;
  try {
    data = await obtenerDatosReciboCuota(idCuota, tipo);
  } catch (error) {
    notFound();
  }

  const { cuota, operacionDesc, cliente, totalCuotas, cuotasRestantes, concesionaria } = data;
  const ars = Number(cuota.monto_pagado_ars || 0);
  const usd = Number(cuota.monto_usd || 0);
  const rate = Number(cuota.cotizacion_pago || 0);
  const fechaPago = cuota.fecha_pago ? new Date(cuota.fecha_pago) : new Date();

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            @media print {
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 8.5pt !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-receipt-sheet {
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            }
          `,
        }}
      />

      {/* BARRA SUPERIOR DE ACCIÓN (OCULTA AL IMPRIMIR) */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          Comprobante Oficial de Cobranza
        </span>
        <PrintButton
          label="Imprimir Recibo (A4)"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs cursor-pointer"
        />
      </div>

      {/* HOJA DE RECIBO OFICIAL */}
      <div className="print-receipt-sheet max-w-2xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* ENCABEZADO */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            {concesionaria.logoUrl ? (
              <img
                src={concesionaria.logoUrl}
                alt={concesionaria.nombre}
                className="max-h-12 max-w-[150px] object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                {concesionaria.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg print:text-base font-black uppercase tracking-tight text-slate-950">
                {concesionaria.nombre}
              </h1>
              <p className="text-[11px] print:text-[8pt] text-slate-600 mt-0.5">
                CUIT: {concesionaria.cuit} · {concesionaria.direccion}
                {concesionaria.ciudad ? ` · ${concesionaria.ciudad}` : ''}
              </p>
              {concesionaria.telefono && (
                <p className="text-[10px] print:text-[7.5pt] text-slate-500">Tel: {concesionaria.telefono}</p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded">
              Recibo de Cobranza
            </span>
            <p className="text-xs print:text-[9pt] font-mono font-black mt-2 text-slate-900">
              {cuota.recibo_nro || `REC-${cuota.id_cuota}`}
            </p>
            <p className="text-[11px] print:text-[7.5pt] text-slate-500 font-medium">
              Fecha de Cobro: {fechaPago.toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* DATOS DEL PAGADOR */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1 border-b pb-1">
            Datos del Deudor / Pagador
          </p>
          <p>
            <strong>Recibimos de:</strong> {cliente.nombre_completo}
          </p>
          <p>
            <strong>DNI / CUIT:</strong> {cliente.dni || cliente.cuit_cuil || 'S/D'} · <strong>Tel:</strong>{' '}
            {cliente.telefono || 'S/D'}
          </p>
          {cliente.domicilio && (
            <p>
              <strong>Domicilio:</strong> {[cliente.domicilio, cliente.localidad].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* CONCEPTO DEL PAGO */}
        <div className="space-y-2">
          <p className="text-xs text-slate-700">
            En concepto de cancelación formal de <strong>CUOTA DE AMORTIZACIÓN E INTERESES</strong>:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Cuota Cancelada</span>
              <strong className="block text-slate-900 font-black">
                Cuota #{cuota.numero_cuota} de {totalCuotas}
              </strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Operación / Legajo</span>
              <strong className="block text-slate-800 truncate">{operacionDesc}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Vto. Original</span>
              <strong className="block text-slate-800 font-mono">
                {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')}
              </strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Cuotas Restantes</span>
              <strong className="block text-slate-800">
                {cuotasRestantes > 0 ? `${cuotasRestantes} cuotas` : 'Contrato Cancelado'}
              </strong>
            </div>
          </div>
        </div>

        {/* IMPORTE PERCIBIDO (ARS EN FOCO PRINCIPAL) */}
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
            Total Efectivamente Cobrado en Pesos
          </p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono mt-1">
            $ {money(ars)} ARS
          </p>
          <p className="text-xs font-bold text-emerald-800 mt-1 font-mono">
            Equivalente: U$S {money(usd)} · Tipo de Cambio: $ {money(rate)}
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Estado: Cuota Cancelada y Acreditada
          </div>
        </div>

        {/* CLÁUSULA DE CONSTANCIA Y VALIDEZ */}
        <div className="border border-slate-300 bg-slate-50 p-3 rounded-xl text-[10px] print:text-[7pt] text-slate-700 leading-tight space-y-1 text-justify">
          <p>
            <strong>CONSTANCIA DE PAGO:</strong> Se deja constancia de que el presente recibo cancela única y exclusivamente la cuota identificada precedentemente, no implicando renuncia, remisión ni novación respecto de cuotas futuras o saldos pendientes de vencimiento convenidos en el mutuo o boleto original.
          </p>
          {concesionaria.pieImpresion && (
            <p className="border-t border-slate-200 pt-1 text-slate-500">{concesionaria.pieImpresion}</p>
          )}
        </div>

        {/* FIRMAS AL PIE */}
        <div className="pt-8 sm:pt-12 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t-2 border-slate-900 pt-2">
            <p className="font-black uppercase">{concesionaria.nombre}</p>
            <p className="text-slate-500 text-[11px]">Receptor Autorizado (Firma y Sello)</p>
          </div>
          <div className="border-t-2 border-slate-900 pt-2">
            <p className="font-black uppercase">{cliente.nombre_completo}</p>
            <p className="text-slate-500 text-[11px]">Firma del Pagador · DNI: {cliente.dni || 'S/D'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
