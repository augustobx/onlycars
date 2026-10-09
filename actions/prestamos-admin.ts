'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const ADMIN_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

export async function cambiarEstadoSolicitudWebAction(params: {
  solicitudId: number;
  nuevoEstado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';
  resolucionMotivo?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const user = await requireTenantRole(tenant.id, ADMIN_ROLES);

    const solicitud = await db.solicitudPrestamo.findFirst({
      where: { id: params.solicitudId, tenantId: tenant.id },
    });

    if (!solicitud) return { success: false, error: 'Solicitud no encontrada.' };

    await db.solicitudPrestamo.update({
      where: { id: params.solicitudId },
      data: {
        estado: params.nuevoEstado,
        resolucion_motivo: params.resolucionMotivo?.trim() || null,
        fecha_resolucion: ['APROBADO', 'RECHAZADO', 'CANCELADO'].includes(params.nuevoEstado) ? new Date() : null,
        revisadoPorUserId: user.id,
      },
    });

    revalidatePath('/prestamos');
    revalidatePath('/portal/prestamos/validaciones');
    return { success: true };
  } catch (error: any) {
    console.error('Error modificando estado de solicitud web:', error);
    return { success: false, error: error?.message || 'Error al cambiar estado.' };
  }
}

export async function aprobarYGenerarPrestamoAction(params: {
  solicitudId: number;
  capitalEntregadoUsd: number;
  totalDevolverUsd: number;
  cantidadCuotas: number;
  primeraFechaVto: string; // ISO date YYYY-MM-DD
  resolucionMotivo?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const user = await requireTenantRole(tenant.id, ADMIN_ROLES);
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const solicitud = await db.solicitudPrestamo.findFirst({
      where: { id: params.solicitudId, tenantId: tenant.id },
      include: { cliente: true },
    });

    if (!solicitud) return { success: false, error: 'Solicitud no encontrada.' };

    const capital = Number(params.capitalEntregadoUsd);
    const total = Number(params.totalDevolverUsd);
    const cuotasCount = Math.max(1, Number(params.cantidadCuotas));

    if (capital <= 0 || total < capital) {
      return { success: false, error: 'El capital o total a devolver son inválidos.' };
    }

    const valorCuotaUsd = Math.round((total / cuotasCount) * 100) / 100;
    const baseDate = new Date(`${params.primeraFechaVto}T12:00:00`);

    const result = await db.$transaction(async (tx) => {
      // 1. Crear Préstamo formal
      const nuevoPrestamo = await tx.prestamo.create({
        data: {
          tenantId: tenant.id,
          id_cliente: solicitud.id_cliente,
          capital_entregado_usd: capital,
          total_devolver_usd: total,
          cotizacion_dolar_prestamo: dolarActual,
          estado: 'ACTIVO',
        },
      });

      // 2. Generar cuotas
      const cuotasData = [];
      for (let i = 1; i <= cuotasCount; i++) {
        const vtoDate = new Date(baseDate);
        vtoDate.setMonth(vtoDate.getMonth() + (i - 1));
        cuotasData.push({
          tenantId: tenant.id,
          id_prestamo: nuevoPrestamo.id_prestamo,
          numero_cuota: i,
          monto_usd: valorCuotaUsd,
          fecha_vencimiento: vtoDate,
          estado: 'PENDIENTE',
        });
      }

      await tx.prestamoCuota.createMany({ data: cuotasData });

      // 3. Marcar solicitud como Aprobada
      await tx.solicitudPrestamo.update({
        where: { id: solicitud.id },
        data: {
          estado: 'APROBADO',
          resolucion_motivo: params.resolucionMotivo || `Aprobado y generado préstamo #${nuevoPrestamo.id_prestamo}`,
          fecha_resolucion: new Date(),
          revisadoPorUserId: user.id,
        },
      });

      return nuevoPrestamo;
    });

    revalidatePath('/prestamos');
    revalidatePath('/portal/prestamos/validaciones');
    revalidatePath('/portal/prestamos');
    return { success: true, prestamoId: result.id_prestamo };
  } catch (error: any) {
    console.error('Error aprobando y generando préstamo:', error);
    return { success: false, error: error?.message || 'Error al aprobar el préstamo.' };
  }
}
