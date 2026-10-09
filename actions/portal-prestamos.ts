'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY, normalizeClientPwaConfig } from '@/lib/client-pwa-config';
import { getLoggedCliente } from '@/lib/client-auth';
import { getObjectStorage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export async function crearSolicitudPrestamoAction(formData: FormData) {
  try {
    const tenant = await getTenantContext();
    if (!tenant.features.has(CLIENT_PWA_FEATURE_KEY)) {
      return { success: false, error: 'El módulo de clientes no está habilitado.' };
    }

    const featureRecord = await db.tenantFeature.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId: tenant.id,
          featureKey: CLIENT_PWA_FEATURE_KEY,
        },
      },
    });
    const config = normalizeClientPwaConfig(featureRecord?.config);
    if (!config.habilitarSolicitudPrestamos) {
      return { success: false, error: 'La solicitud de préstamos está deshabilitada temporalmente.' };
    }

    const cliente = await getLoggedCliente(tenant.id);
    if (!cliente) {
      return { success: false, error: 'Debés iniciar sesión para solicitar un préstamo.' };
    }

    const montoUsd = Math.max(0, parseFloat(String(formData.get('monto_usd') || '0')));
    const montoArs = Math.max(0, parseFloat(String(formData.get('monto_ars') || '0')));
    const cantidadCuotas = Math.max(1, parseInt(String(formData.get('cantidad_cuotas') || '1'), 10));
    const motivo = String(formData.get('motivo') || '').trim();
    const ingresosMensuales = parseFloat(String(formData.get('ingresos_mensuales_ars') || '0')) || null;
    const observaciones = String(formData.get('observaciones_cliente') || '').trim() || null;

    if (montoUsd <= 0 && montoArs <= 0) {
      return { success: false, error: 'Ingresá un monto a solicitar válido.' };
    }

    // Procesar archivos subidos
    const filesToUpload: Array<{ file: File; tipo: string }> = [];
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (key.startsWith('document_file_') && value instanceof File && value.size > 0) {
        const index = key.replace('document_file_', '');
        const tipo = String(formData.get(`document_tipo_${index}`) || 'Documento adjunto').trim();
        filesToUpload.push({ file: value, tipo });
      }
    }

    if (config.requerirDocumentacion && filesToUpload.length === 0) {
      return { success: false, error: 'Es obligatorio adjuntar al menos un documento para respaldar la solicitud.' };
    }

    const storage = getObjectStorage();
    const uploadedDocs: Array<{
      tipo_documento: string;
      nombre_archivo: string;
      url_archivo: string;
      object_key: string;
      mime_type: string;
      size_bytes: number;
    }> = [];

    for (const item of filesToUpload) {
      const buffer = Buffer.from(await item.file.arrayBuffer());
      const res = await storage.upload({
        tenantId: tenant.id,
        folder: 'documents',
        fileName: item.file.name,
        mimeType: item.file.type || 'application/octet-stream',
        buffer,
      });

      uploadedDocs.push({
        tipo_documento: item.tipo,
        nombre_archivo: item.file.name,
        url_archivo: res.url,
        object_key: res.objectKey,
        mime_type: res.mimeType,
        size_bytes: res.sizeBytes,
      });
    }

    const solicitud = await db.$transaction(async (tx) => {
      const created = await tx.solicitudPrestamo.create({
        data: {
          tenantId: tenant.id,
          id_cliente: cliente.id_cliente,
          monto_solicitado_usd: montoUsd,
          monto_solicitado_ars: montoArs > 0 ? montoArs : null,
          cantidad_cuotas: cantidadCuotas,
          motivo: motivo || 'Préstamo personal',
          ingresos_mensuales_ars: ingresosMensuales,
          observaciones_cliente: observaciones,
          estado: 'PENDIENTE',
        },
      });

      if (uploadedDocs.length > 0) {
        await tx.solicitudPrestamoDocumento.createMany({
          data: uploadedDocs.map((doc) => ({
            tenantId: tenant.id,
            solicitudPrestamoId: created.id,
            tipo_documento: doc.tipo_documento,
            nombre_archivo: doc.nombre_archivo,
            url_archivo: doc.url_archivo,
            object_key: doc.object_key,
            mime_type: doc.mime_type,
            size_bytes: doc.size_bytes,
          })),
        });
      }

      return created;
    });

    revalidatePath('/portal/prestamos/validaciones');
    revalidatePath('/prestamos');
    return { success: true, solicitudId: solicitud.id };
  } catch (error: any) {
    console.error('Error creando solicitud de préstamo:', error);
    return { success: false, error: error?.message || 'No se pudo registrar la solicitud.' };
  }
}

export async function cancelarSolicitudClienteAction(solicitudId: number) {
  try {
    const tenant = await getTenantContext();
    const cliente = await getLoggedCliente(tenant.id);
    if (!cliente) return { success: false, error: 'Sesión no iniciada.' };

    const solicitud = await db.solicitudPrestamo.findFirst({
      where: {
        id: solicitudId,
        tenantId: tenant.id,
        id_cliente: cliente.id_cliente,
      },
    });

    if (!solicitud) return { success: false, error: 'Solicitud no encontrada.' };
    if (solicitud.estado !== 'PENDIENTE') {
      return { success: false, error: 'Solo podés cancelar solicitudes pendientes de revisión.' };
    }

    await db.solicitudPrestamo.update({
      where: { id: solicitudId },
      data: { estado: 'CANCELADO' },
    });

    revalidatePath('/portal/prestamos/validaciones');
    revalidatePath('/prestamos');
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelando solicitud:', error);
    return { success: false, error: error?.message || 'No se pudo cancelar.' };
  }
}
