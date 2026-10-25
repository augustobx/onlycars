import type { Metadata } from 'next';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import PwaPrestamosClient from './PwaPrestamosClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars';
  try {
    const tenant = await getTenantContext();
    tenantName = tenant.name;
  } catch {}

  return {
    title: `${tenantName} · Préstamos Móvil`,
    manifest: '/api/pwa/manifest/admin',
    icons: {
      icon: '/icons/admin-192.png',
      apple: '/icons/admin-192.png',
    },
  };
}

export default async function PwaPrestamosPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [prestamosDb, clientesDb] = await Promise.all([
    db.prestamo.findMany({
      where: { tenantId: tenant.id },
      orderBy: { fecha_prestamo: 'desc' },
      include: { cliente: true, cuotas: { orderBy: { numero_cuota: 'asc' } } },
    }),
    db.cliente.findMany({
      where: { tenantId: tenant.id },
      orderBy: { nombre_completo: 'asc' },
      select: {
        id_cliente: true,
        nombre_completo: true,
        dni: true,
        cuit_cuil: true,
        telefono: true,
      },
    }),
  ]);

  const prestamos = prestamosDb.map((p) => ({
    id_prestamo: p.id_prestamo,
    cliente_id: p.cliente.id_cliente,
    cliente_nombre: p.cliente.nombre_completo,
    cliente_dni: p.cliente.dni || p.cliente.cuit_cuil || '',
    cliente_telefono: p.cliente.telefono || '',
    capital_entregado_usd: Number(p.capital_entregado_usd || 0),
    total_devolver_usd: Number(p.total_devolver_usd || 0),
    cotizacion_dolar: Number(p.cotizacion_dolar_prestamo || dolarActual),
    fecha_prestamo: p.fecha_prestamo.toISOString(),
    estado: p.estado,
    cuotas_totales: p.cuotas.length,
    cuotas_pagadas: p.cuotas.filter((c) => c.estado === 'PAGADA').length,
    cuotas: p.cuotas.map((c) => ({
      id_cuota: c.id_cuota,
      numero_cuota: c.numero_cuota,
      monto_usd: Number(c.monto_usd),
      monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
      estado: c.estado,
      fecha_vencimiento: c.fecha_vencimiento.toISOString(),
      recibo_nro: c.recibo_nro || null,
    })),
  }));

  return (
    <PwaPrestamosClient
      prestamosIniciales={prestamos}
      clientes={clientesDb}
      dolarActual={dolarActual}
      tenantName={tenant.name}
    />
  );
}
