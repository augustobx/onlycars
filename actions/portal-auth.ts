'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { CLIENT_PWA_FEATURE_KEY } from '@/lib/client-pwa-config';
import {
  hashClientePassword,
  verifyClientePassword,
  createClienteSession,
  deleteClienteSession,
  getLoggedCliente,
} from '@/lib/client-auth';

function normalizeDni(dni?: string | null): string {
  return String(dni || '').replace(/[^0-9]/g, '').trim();
}

export async function portalLoginAction(formData: { dni: string; password: string }) {
  try {
    const tenant = await getTenantContext();
    if (!tenant.features.has(CLIENT_PWA_FEATURE_KEY)) {
      return { success: false, error: 'El portal de clientes no está habilitado para esta concesionaria.' };
    }

    const cleanDni = normalizeDni(formData.dni);
    const password = String(formData.password || '').trim();

    if (!cleanDni || cleanDni.length < 6) {
      return { success: false, error: 'Ingresá un DNI válido.' };
    }
    if (!password) {
      return { success: false, error: 'Ingresá tu contraseña.' };
    }

    const cliente = await db.cliente.findFirst({
      where: {
        tenantId: tenant.id,
        dni: cleanDni,
      },
    });

    if (!cliente) {
      return {
        success: false,
        error: 'No encontramos una cuenta con ese DNI. Si es tu primera vez, registrate.',
      };
    }

    if (!cliente.passwordHash) {
      return {
        success: false,
        needsPasswordSetup: true,
        error: 'Tu ficha está registrada pero aún no tenés clave creada. Hacé clic en Registrarte para crear tu contraseña.',
      };
    }

    const valid = await verifyClientePassword(password, cliente.passwordHash);
    if (!valid) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    await createClienteSession(cliente.id_cliente);

    return {
      success: true,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre_completo: cliente.nombre_completo,
        dni: cliente.dni,
      },
    };
  } catch (error: any) {
    console.error('Error en login de cliente:', error);
    return { success: false, error: error?.message || 'Error al iniciar sesión.' };
  }
}

export async function portalRegisterAction(formData: {
  dni: string;
  nombre_completo: string;
  telefono?: string;
  email?: string;
  password: string;
}) {
  try {
    const tenant = await getTenantContext();
    if (!tenant.features.has(CLIENT_PWA_FEATURE_KEY)) {
      return { success: false, error: 'El portal de clientes no está habilitado para esta concesionaria.' };
    }

    const cleanDni = normalizeDni(formData.dni);
    const nombre = String(formData.nombre_completo || '').trim();
    const telefono = String(formData.telefono || '').trim() || null;
    const email = String(formData.email || '').trim().toLowerCase() || null;
    const password = String(formData.password || '').trim();

    if (!cleanDni || cleanDni.length < 6) return { success: false, error: 'DNI inválido.' };
    if (!nombre || nombre.length < 3) return { success: false, error: 'Ingresá tu nombre completo.' };
    if (!password || password.length < 4) return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };

    const passwordHash = await hashClientePassword(password);

    const existing = await db.cliente.findFirst({
      where: { tenantId: tenant.id, dni: cleanDni },
    });

    let clienteId: number;

    if (existing) {
      if (existing.passwordHash) {
        return { success: false, error: 'Este DNI ya tiene una clave configurada. Por favor iniciá sesión.' };
      }

      const updated = await db.cliente.update({
        where: { id_cliente: existing.id_cliente },
        data: {
          passwordHash,
          telefono: telefono || existing.telefono,
          email: email || existing.email,
          nombre_completo: nombre || existing.nombre_completo,
        },
      });
      clienteId = updated.id_cliente;
    } else {
      const created = await db.cliente.create({
        data: {
          tenantId: tenant.id,
          dni: cleanDni,
          nombre_completo: nombre,
          telefono,
          email,
          passwordHash,
        },
      });
      clienteId = created.id_cliente;
    }

    await createClienteSession(clienteId);

    return {
      success: true,
      cliente: {
        id_cliente: clienteId,
        nombre_completo: nombre,
        dni: cleanDni,
      },
    };
  } catch (error: any) {
    console.error('Error en registro de cliente:', error);
    return { success: false, error: error?.message || 'Error al procesar el registro.' };
  }
}

export async function portalLogoutAction() {
  await deleteClienteSession();
  return { success: true };
}

export async function getPortalCurrentClientAction() {
  try {
    const tenant = await getTenantContext();
    return await getLoggedCliente(tenant.id);
  } catch {
    return null;
  }
}
