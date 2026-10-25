import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import PwaCuotasClient from './PwaCuotasClient';

export const dynamic = 'force-dynamic';

export default async function PwaCuotasPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [ventasFinanciadas, prestamosDb] = await Promise.all([
    db.venta.findMany({
      where: { tenantId: tenant.id, forma_pago: 'Cuotas' },
      include: { cliente: true, vehiculo: true, cuotas: { orderBy: { numero_cuota: 'asc' } } },
    }),
    db.prestamo.findMany({
      where: { tenantId: tenant.id },
      include: { cliente: true, cuotas: { orderBy: { numero_cuota: 'asc' } } },
    }),
  ]);

  const cuotas = [
    ...ventasFinanciadas.flatMap((v) =>
      v.cuotas.map((c) => ({
        id_cuota_real: c.id_cuota,
        tipo_origen: 'VENTA' as const,
        id_operacion: `VTA-${v.id_venta}`,
        cliente_nombre: v.cliente.nombre_completo,
        cliente_telefono: v.cliente.telefono || '',
        cliente_dni: v.cliente.dni || v.cliente.cuit_cuil || '',
        detalle_unidad: `${v.vehiculo?.marca || ''} ${v.vehiculo?.modelo || ''} [${v.vehiculo?.patente || 'S/P'}]`.trim(),
        numero_cuota: c.numero_cuota,
        total_cuotas: v.cuotas.length,
        monto_usd: Number(c.monto_usd),
        monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
        cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
        fecha_vencimiento: c.fecha_vencimiento.toISOString(),
        fecha_pago: c.fecha_pago ? c.fecha_pago.toISOString() : null,
        estado: c.estado,
        recibo_nro: c.recibo_nro || null,
      }))
    ),
    ...prestamosDb.flatMap((p) =>
      p.cuotas.map((c) => ({
        id_cuota_real: c.id_cuota,
        tipo_origen: 'PRESTAMO' as const,
        id_operacion: `PRE-${p.id_prestamo}`,
        cliente_nombre: p.cliente.nombre_completo,
        cliente_telefono: p.cliente.telefono || '',
        cliente_dni: p.cliente.dni || p.cliente.cuit_cuil || '',
        detalle_unidad: `Préstamo Personal #${p.id_prestamo}`,
        numero_cuota: c.numero_cuota,
        total_cuotas: p.cuotas.length,
        monto_usd: Number(c.monto_usd),
        monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
        cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
        fecha_vencimiento: c.fecha_vencimiento.toISOString(),
        fecha_pago: c.fecha_pago ? c.fecha_pago.toISOString() : null,
        estado: c.estado,
        recibo_nro: c.recibo_nro || null,
      }))
    ),
  ].sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());

  return <PwaCuotasClient cuotasIniciales={cuotas} dolarActual={dolarActual} tenantName={tenant.name} />;
}
