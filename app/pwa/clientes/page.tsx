import type { Metadata } from 'next';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';
import PwaClientesClient, { type PwaClienteItem } from './PwaClientesClient';

export const dynamic = 'force-dynamic';
const CLIENT_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars';
  try {
    const tenant = await getTenantContext();
    tenantName = tenant.name;
  } catch {}

  return {
    title: `${tenantName} · Clientes Móvil`,
    manifest: '/api/pwa/manifest/admin',
    icons: {
      icon: '/icons/admin-192.png',
      apple: '/icons/admin-192.png',
    },
  };
}

export default async function PwaClientesPage() {
  const tenant = await getTenantContext();
  try {
    await requireTenantRole(tenant.id, CLIENT_ROLES);
  } catch {
    redirect('/pwa/admin');
  }

  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const clientesDb = await db.cliente.findMany({
    where: { tenantId: tenant.id },
    orderBy: { id_cliente: 'desc' },
    include: {
      prestamos: {
        include: {
          cuotas: {
            orderBy: { numero_cuota: 'asc' },
          },
        },
      },
      ventas: {
        where: { forma_pago: 'Cuotas' },
        include: {
          cuotas: {
            orderBy: { numero_cuota: 'asc' },
          },
        },
      },
    },
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const clientes: PwaClienteItem[] = clientesDb.map((c) => {
    // Recopilar todas las cuotas de préstamos y ventas financiadas
    const allCuotas: Array<{
      id_cuota: number;
      numero_cuota: number;
      total_cuotas: number;
      monto_usd: number;
      monto_ars: number;
      fecha_vencimiento: string;
      estado: string;
      id_operacion: string;
      isVencida: boolean;
      isHoy: boolean;
      diasMora: number;
    }> = [];

    c.prestamos.forEach((p) => {
      const rate = Number(p.cotizacion_dolar_prestamo || dolarActual);
      p.cuotas.forEach((cuota) => {
        const vtoDate = new Date(cuota.fecha_vencimiento);
        vtoDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((hoy.getTime() - vtoDate.getTime()) / (1000 * 60 * 60 * 24));
        const isVencida = cuota.estado === 'PENDIENTE' && diffDays > 0;
        const isHoy = cuota.estado === 'PENDIENTE' && diffDays === 0;

        allCuotas.push({
          id_cuota: cuota.id_cuota,
          numero_cuota: cuota.numero_cuota,
          total_cuotas: p.cuotas.length,
          monto_usd: Number(cuota.monto_usd),
          monto_ars: Number(cuota.monto_pagado_ars || Number(cuota.monto_usd) * rate),
          fecha_vencimiento: cuota.fecha_vencimiento.toISOString(),
          estado: cuota.estado,
          id_operacion: `PREST-${p.id_prestamo}`,
          isVencida,
          isHoy,
          diasMora: Math.max(0, diffDays),
        });
      });
    });

    c.ventas.forEach((v) => {
      const rate = Number(v.cotizacion_dolar_venta || dolarActual);
      v.cuotas.forEach((cuota) => {
        const vtoDate = new Date(cuota.fecha_vencimiento);
        vtoDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((hoy.getTime() - vtoDate.getTime()) / (1000 * 60 * 60 * 24));
        const isVencida = cuota.estado === 'PENDIENTE' && diffDays > 0;
        const isHoy = cuota.estado === 'PENDIENTE' && diffDays === 0;

        allCuotas.push({
          id_cuota: cuota.id_cuota,
          numero_cuota: cuota.numero_cuota,
          total_cuotas: v.cuotas.length,
          monto_usd: Number(cuota.monto_usd),
          monto_ars: Number(cuota.monto_pagado_ars || Number(cuota.monto_usd) * rate),
          fecha_vencimiento: cuota.fecha_vencimiento.toISOString(),
          estado: cuota.estado,
          id_operacion: `VTA-${v.id_venta}`,
          isVencida,
          isHoy,
          diasMora: Math.max(0, diffDays),
        });
      });
    });

    const cuotasPendientes = allCuotas.filter((cu) => cu.estado === 'PENDIENTE');
    const cuotasVencidas = cuotasPendientes.filter((cu) => cu.isVencida);
    const cuotasHoy = cuotasPendientes.filter((cu) => cu.isHoy);

    const deudaArs = cuotasPendientes.reduce((acc, cu) => acc + cu.monto_ars, 0);
    const deudaUsd = cuotasPendientes.reduce((acc, cu) => acc + cu.monto_usd, 0);

    // Priorizar la cuota más crítica para notificar por WhatsApp
    // Si hay vencidas, agarrar la más antigua (mayor mora).
    // Si no, la que vence hoy o la próxima por vencer.
    let cuotaNotificar = null;
    if (cuotasVencidas.length > 0) {
      cuotasVencidas.sort((a, b) => b.diasMora - a.diasMora);
      cuotaNotificar = cuotasVencidas[0];
    } else if (cuotasHoy.length > 0) {
      cuotaNotificar = cuotasHoy[0];
    } else if (cuotasPendientes.length > 0) {
      cuotasPendientes.sort(
        (a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()
      );
      cuotaNotificar = cuotasPendientes[0];
    }

    return {
      id_cliente: c.id_cliente,
      nombre_completo: c.nombre_completo,
      dni: c.dni || c.cuit_cuil || '',
      cuit_cuil: c.cuit_cuil || '',
      telefono: c.telefono || '',
      email: c.email || '',
      domicilio: [c.domicilio, c.localidad].filter(Boolean).join(', '),
      notas: c.notas || '',
      totalCreditos: c.prestamos.length + c.ventas.length,
      creditosActivos: c.prestamos.filter((p) => p.estado === 'ACTIVO').length,
      totalCuotasPendientes: cuotasPendientes.length,
      totalCuotasVencidas: cuotasVencidas.length,
      deudaTotalArs: deudaArs,
      deudaTotalUsd: deudaUsd,
      cuotaNotificar,
    };
  });

  return (
    <PwaClientesClient
      clientesIniciales={clientes}
      dolarActual={dolarActual}
      tenantName={tenant.name}
      tenantCuit={(tenant.settings as any)?.cuit || undefined}
    />
  );
}

