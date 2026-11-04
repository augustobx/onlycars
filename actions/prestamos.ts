'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const FINANCE_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

export async function registrarPrestamo(data: {
  id_cliente: number;
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar: number;
  cuotas: { numero_cuota: number; monto_usd: number; fecha_vencimiento: string }[];
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, FINANCE_ROLES);

    const capital = Number(data.capital_entregado_usd);
    const total = Number(data.total_devolver_usd);
    const rate = Number(data.cotizacion_dolar);
    if (capital <= 0 || total < capital || rate <= 0) return { success: false, error: 'Capital, total a devolver o cotización inválidos.' };
    if (!data.cuotas?.length) return { success: false, error: 'El préstamo requiere un plan de cuotas.' };

    const cliente = await db.cliente.findFirst({ where: { id_cliente: data.id_cliente, tenantId: tenant.id } });
    if (!cliente) return { success: false, error: 'El cliente seleccionado no pertenece a esta concesionaria.' };

    const cuotas = data.cuotas.map((c, index) => ({
      numero_cuota: Number(c.numero_cuota || index + 1),
      monto_usd: Number(c.monto_usd),
      fecha_vencimiento: new Date(c.fecha_vencimiento),
    }));
    if (cuotas.some((c) => c.monto_usd <= 0 || Number.isNaN(c.fecha_vencimiento.getTime()))) return { success: false, error: 'El plan de cuotas contiene valores inválidos.' };

    const result = await db.$transaction(async (tx) => {
      const prestamo = await tx.prestamo.create({ data: { tenantId: tenant.id, id_cliente: data.id_cliente, capital_entregado_usd: capital, total_devolver_usd: total, cotizacion_dolar_prestamo: rate, fecha_prestamo: new Date(), estado: 'ACTIVO' } });
      await tx.prestamoCuota.createMany({ data: cuotas.map((c) => ({ tenantId: tenant.id, id_prestamo: prestamo.id_prestamo, numero_cuota: c.numero_cuota, monto_usd: c.monto_usd, fecha_vencimiento: c.fecha_vencimiento, estado: 'PENDIENTE' })) });
      return prestamo;
    });

    revalidatePath('/prestamos');
    revalidatePath('/cuotas');
    revalidatePath('/caja');
    revalidatePath('/pwa/prestamos');
    revalidatePath('/pwa/cuotas');
    return { success: true, id_prestamo: result.id_prestamo };
  } catch (error) {
    console.error('Error registrando préstamo:', error);
    return { success: false, error: 'Ocurrió un error al registrar el préstamo.' };
  }
}

export async function actualizarPlanPrestamo(data: {
  id_prestamo: number;
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar?: number;
  cuotas: {
    id_cuota?: number;
    numero_cuota: number;
    monto_usd: number;
    fecha_vencimiento: string;
    estado?: string;
  }[];
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, FINANCE_ROLES);

    const capital = Number(data.capital_entregado_usd);
    const total = Number(data.total_devolver_usd);
    const rate = Number(data.cotizacion_dolar || 0);

    if (capital <= 0 || total < capital) {
      return { success: false, error: 'Capital o total a devolver inválidos.' };
    }
    if (!data.cuotas?.length) {
      return { success: false, error: 'El préstamo requiere al menos una cuota.' };
    }

    const prestamo = await db.prestamo.findFirst({
      where: { id_prestamo: data.id_prestamo, tenantId: tenant.id },
      include: {
        cuotas: { orderBy: { numero_cuota: 'asc' } },
        cliente: true,
      },
    });

    if (!prestamo) {
      return { success: false, error: 'Préstamo no encontrado o no pertenece a su concesionaria.' };
    }

    const cuotasPagadasExistentes = prestamo.cuotas.filter((c) => c.estado === 'PAGADA');

    const cuotasNuevas = data.cuotas.map((c, idx) => ({
      numero_cuota: Number(c.numero_cuota || idx + 1),
      monto_usd: Number(c.monto_usd),
      fecha_vencimiento: new Date(c.fecha_vencimiento),
      estado: c.estado || 'PENDIENTE',
    }));

    if (cuotasNuevas.some((c) => c.monto_usd <= 0 || Number.isNaN(c.fecha_vencimiento.getTime()))) {
      return { success: false, error: 'Hay cuotas con importes o fechas inválidas.' };
    }

    await db.$transaction(async (tx) => {
      if (cuotasPagadasExistentes.length === 0) {
        // Ninguna cuota pagada: reemplazar el cronograma completo
        await tx.prestamoCuota.deleteMany({
          where: { id_prestamo: prestamo.id_prestamo, tenantId: tenant.id },
        });

        await tx.prestamoCuota.createMany({
          data: cuotasNuevas.map((c) => ({
            tenantId: tenant.id,
            id_prestamo: prestamo.id_prestamo,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd,
            fecha_vencimiento: c.fecha_vencimiento,
            estado: 'PENDIENTE',
          })),
        });
      } else {
        // Cuotas pagadas existentes: preservar las pagadas, actualizar pendientes
        await tx.prestamoCuota.deleteMany({
          where: {
            id_prestamo: prestamo.id_prestamo,
            tenantId: tenant.id,
            estado: { not: 'PAGADA' },
          },
        });

        const soloPendientes = cuotasNuevas.filter((c) => c.estado !== 'PAGADA');
        if (soloPendientes.length > 0) {
          await tx.prestamoCuota.createMany({
            data: soloPendientes.map((c) => ({
              tenantId: tenant.id,
              id_prestamo: prestamo.id_prestamo,
              numero_cuota: c.numero_cuota,
              monto_usd: c.monto_usd,
              fecha_vencimiento: c.fecha_vencimiento,
              estado: 'PENDIENTE',
            })),
          });
        }
      }

      await tx.prestamo.update({
        where: { id_prestamo: prestamo.id_prestamo },
        data: {
          capital_entregado_usd: capital,
          total_devolver_usd: total,
          ...(rate > 0 ? { cotizacion_dolar_prestamo: rate } : {}),
        },
      });
    });

    revalidatePath('/prestamos');
    revalidatePath('/cuotas');
    revalidatePath('/caja');
    revalidatePath('/pwa/prestamos');
    revalidatePath('/pwa/cuotas');
    revalidatePath('/portal/cuotas');
    revalidatePath('/portal/prestamos');
    revalidatePath(`/documentos/prestamo/${prestamo.id_prestamo}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando plan de préstamo:', error);
    return { success: false, error: error?.message || 'Error al actualizar el plan de préstamo.' };
  }
}

export async function eliminarPrestamo(id_prestamo: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, FINANCE_ROLES);

    const prestamo = await db.prestamo.findFirst({
      where: { id_prestamo, tenantId: tenant.id },
      include: { cuotas: true },
    });

    if (!prestamo) {
      return { success: false, error: 'Préstamo no encontrado.' };
    }

    const tienePagadas = prestamo.cuotas.some((c) => c.estado === 'PAGADA');
    if (tienePagadas) {
      return {
        success: false,
        error: 'No se puede eliminar un préstamo que ya tiene cuotas cobradas.',
      };
    }

    await db.$transaction(async (tx) => {
      await tx.prestamoCuota.deleteMany({
        where: { id_prestamo, tenantId: tenant.id },
      });
      await tx.prestamo.delete({
        where: { id_prestamo },
      });
    });

    revalidatePath('/prestamos');
    revalidatePath('/cuotas');
    revalidatePath('/caja');
    revalidatePath('/pwa/prestamos');
    revalidatePath('/pwa/cuotas');
    revalidatePath('/portal/cuotas');
    revalidatePath('/portal/prestamos');

    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando préstamo:', error);
    return { success: false, error: error?.message || 'Error al eliminar el préstamo.' };
  }
}
