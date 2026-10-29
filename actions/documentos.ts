'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { managedModuleEnabled } from '@/lib/hub-features';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';

const DOC_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

async function contextoDocumental() {
  const tenant = await getTenantContext();
  await requireTenantRole(tenant.id, DOC_ROLES);
  const [settings, brandingFeature] = await Promise.all([
    db.tenantSettings.findUnique({ where: { tenantId: tenant.id } }),
    db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'branding_documentos' } } }),
  ]);
  const branding = managedModuleEnabled(tenant, 'branding_documentos') ? (brandingFeature?.config as any) || {} : {};
  return { tenant, settings, branding };
}

export async function obtenerDatosBoleto(id_venta: number) {
  const { tenant, settings, branding } = await contextoDocumental();
  const venta = await db.venta.findUnique({
    where: { id_venta, tenantId: tenant.id },
    include: {
      vehiculo: true,
      cliente: true,
      vendedor: { select: { name: true, email: true } },
      cuotas: { orderBy: { numero_cuota: 'asc' } },
      location: true,
    },
  });
  if (!venta) throw new Error('Venta no encontrada.');

  const vehiculoPermuta = venta.id_vehiculo_permuta
    ? await db.vehiculo.findUnique({ where: { id_vehiculo: venta.id_vehiculo_permuta, tenantId: tenant.id } })
    : null;

  const logoBoleto = branding.logoVenta || settings?.logoUrl || null;

  return {
    venta,
    vehiculoPermuta,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      ciudad: tenant.city || '',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      email: settings?.emailContacto || tenant.email || '',
      logoUrl: logoBoleto,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}

export async function obtenerDatosBoletoPrestamo(id_prestamo: number) {
  const { tenant, settings, branding } = await contextoDocumental();
  const prestamo = await db.prestamo.findUnique({
    where: { id_prestamo, tenantId: tenant.id },
    include: {
      cliente: true,
      cuotas: { orderBy: { numero_cuota: 'asc' } },
    },
  });
  if (!prestamo) throw new Error('Préstamo no encontrado.');

  const logoPrestamo = branding.logoPrestamo || settings?.logoUrl || null;

  return {
    prestamo,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      ciudad: tenant.city || '',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      email: settings?.emailContacto || tenant.email || '',
      logoUrl: logoPrestamo,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}

export async function obtenerDatosReciboSenia(id_senia: number) {
  const { tenant, settings } = await contextoDocumental();
  const senia = await db.senia.findUnique({
    where: { id_senia, tenantId: tenant.id },
    include: { vehiculo: true, cliente: true, location: true },
  });
  if (!senia) throw new Error('Seña no encontrada.');

  return {
    senia,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      logoUrl: settings?.logoUrl || null,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}

export async function obtenerFichaParabrisas(id_vehiculo: number) {
  const { tenant, settings } = await contextoDocumental();
  const vehiculo = await db.vehiculo.findUnique({
    where: { id_vehiculo, tenantId: tenant.id },
    include: { location: true },
  });
  if (!vehiculo) throw new Error('Vehículo no encontrado.');

  return {
    vehiculo,
    concesionaria: {
      nombre: settings?.appName || tenant.name,
      telefono: settings?.telefonoContacto || tenant.phone || '',
      whatsapp: settings?.whatsappLead || '',
      dolar: settings?.dolarActual || 1400,
      tna: settings?.tnaFinanciacion || 48,
      logoUrl: settings?.logoUrl || null,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}


export async function obtenerDatosReciboCuota(id_cuota: number, tipo: 'PRESTAMO' | 'VENTA' = 'PRESTAMO') {
  const { tenant, settings, branding } = await contextoDocumental();

  let cuotaData: any = null;
  let operacionDesc = '';
  let cliente: any = null;
  let totalCuotas = 1;
  let cuotasRestantes = 0;

  if (tipo === 'PRESTAMO') {
    const cuota = await db.prestamoCuota.findUnique({
      where: { id_cuota },
      include: {
        prestamo: {
          include: {
            cliente: true,
            cuotas: { orderBy: { numero_cuota: 'asc' } },
          },
        },
      },
    });
    if (!cuota || cuota.prestamo.tenantId !== tenant.id) throw new Error('Cuota de préstamo no encontrada.');
    cuotaData = cuota;
    cliente = cuota.prestamo.cliente;
    operacionDesc = `Préstamo Personal #${cuota.prestamo.id_prestamo}`;
    totalCuotas = cuota.prestamo.cuotas.length;
    cuotasRestantes = cuota.prestamo.cuotas.filter((c) => c.estado === 'PENDIENTE').length;
  } else {
    const cuota = await db.ventaCuota.findUnique({
      where: { id_cuota },
      include: {
        venta: {
          include: {
            cliente: true,
            vehiculo: true,
            cuotas: { orderBy: { numero_cuota: 'asc' } },
          },
        },
      },
    });
    if (!cuota || cuota.venta.tenantId !== tenant.id) throw new Error('Cuota de venta no encontrada.');
    cuotaData = cuota;
    cliente = cuota.venta.cliente;
    operacionDesc = `Financiación Vehicular: ${cuota.venta.vehiculo?.marca || ''} ${cuota.venta.vehiculo?.modelo || ''} [${cuota.venta.vehiculo?.patente || 'S/P'}]`;
    totalCuotas = cuota.venta.cuotas.length;
    cuotasRestantes = cuota.venta.cuotas.filter((c) => c.estado === 'PENDIENTE').length;
  }

  const logoRecibo = (branding as any)?.logoRecibo || settings?.logoUrl || null;

  return {
    cuota: cuotaData,
    tipo,
    operacionDesc,
    cliente,
    totalCuotas,
    cuotasRestantes,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      ciudad: tenant.city || '',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      email: settings?.emailContacto || tenant.email || '',
      logoUrl: logoRecibo,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}
