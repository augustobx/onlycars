'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import {
  CLIENT_PWA_FEATURE_KEY,
  ClientPwaConfig,
  normalizeClientPwaConfig,
} from '@/lib/client-pwa-config';
import { revalidatePath } from 'next/cache';

const CONFIG_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER];

export async function guardarPortalClientesConfigAction(input: ClientPwaConfig) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);

    const isFeatureEnabled = tenant.features.has(CLIENT_PWA_FEATURE_KEY);
    if (!isFeatureEnabled) {
      return {
        success: false,
        error: 'El módulo App Clientes es un módulo Premium y debe estar activado por SuperAdmin.',
      };
    }

    const config = normalizeClientPwaConfig(input);

    await db.tenantFeature.upsert({
      where: {
        tenantId_featureKey: {
          tenantId: tenant.id,
          featureKey: CLIENT_PWA_FEATURE_KEY,
        },
      },
      update: {
        config,
      },
      create: {
        tenantId: tenant.id,
        featureKey: CLIENT_PWA_FEATURE_KEY,
        isEnabled: true,
        hubManaged: tenant.plan.hubManaged,
        hubInherit: tenant.plan.hubManaged,
        config,
      },
    });

    revalidatePath('/configuracion');
    revalidatePath('/portal', 'layout');
    return { success: true, config };
  } catch (error: any) {
    console.error('Error guardando configuración de portal de clientes:', error);
    return {
      success: false,
      error: error?.message || 'No se pudo guardar la configuración del portal.',
    };
  }
}
