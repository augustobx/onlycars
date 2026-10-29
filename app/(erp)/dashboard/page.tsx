import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { tenantIsFinancialOnly } from "@/lib/tenant-modules";
import DashboardClient from "./DashboardClient";
import DashboardFinancieroClient from "./DashboardFinancieroClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  // MODO FINANCIERO / SOLO PRÉSTAMOS Y CAJA
  if (tenantIsFinancialOnly(tenant.features)) {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const [
      prestamosActivos,
      cuotasPendientesMes,
      cuotasVencidas,
      clientesTotal,
      prestamosStats,
      cuotasMes,
    ] = await Promise.all([
      db.prestamo.count({ where: { tenantId: tenant.id, estado: 'ACTIVO' } }),
      db.prestamoCuota.count({
        where: { tenantId: tenant.id, estado: 'PENDIENTE', fecha_vencimiento: { gte: inicioMes, lte: finMes } },
      }),
      db.prestamoCuota.count({
        where: { tenantId: tenant.id, estado: 'PENDIENTE', fecha_vencimiento: { lt: ahora } },
      }),
      db.cliente.count({ where: { tenantId: tenant.id } }),
      db.prestamo.aggregate({
        where: { tenantId: tenant.id, estado: 'ACTIVO' },
        _sum: { capital_entregado_usd: true, total_devolver_usd: true },
      }),
      db.prestamoCuota.findMany({
        where: { tenantId: tenant.id, estado: 'PAGADA', fecha_pago: { gte: inicioMes } },
        select: { monto_usd: true, monto_pagado_ars: true, cotizacion_pago: true },
      }),
    ]);

    const capitalColocadoUsd = Number(prestamosStats._sum.capital_entregado_usd || 0);
    const capitalColocadoArs = capitalColocadoUsd * dolarActual;
    const totalDevolverUsd = Number(prestamosStats._sum.total_devolver_usd || 0);
    const totalDevolverArs = totalDevolverUsd * dolarActual;

    const cobranzasMesUsd = cuotasMes.reduce((sum, c) => sum + Number(c.monto_usd || 0), 0);
    const cobranzasMesArs = cuotasMes.reduce((sum, c) => {
      const stored = Number(c.monto_pagado_ars || 0);
      return sum + (stored > 0 ? stored : Number(c.monto_usd || 0) * Number(c.cotizacion_pago || dolarActual));
    }, 0);

    return (
      <DashboardFinancieroClient
        dolarActual={dolarActual}
        stats={{
          prestamosActivos,
          cuotasPendientesMes,
          cuotasVencidas,
          clientesTotal,
          capitalColocadoUsd,
          capitalColocadoArs,
          totalDevolverUsd,
          totalDevolverArs,
          cobranzasMesUsd,
          cobranzasMesArs,
          saldoCajaAproximadoUsd: 0,
          saldoCajaAproximadoArs: 0,
        }}
      />
    );
  }

  // MODO CONCESIONARIA ESTÁNDAR
  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

  const [
    stockDisponible,
    tareasPendientes,
    ventasMes,
    enReparacion,
    totalOperaciones,
    capitalStock,
  ] = await Promise.all([
    db.vehiculo.count({ where: { tenantId: tenant.id, estado: 'LISTO_PARA_VENTA' } }),
    db.tarea.count({ where: { vehiculo: { tenantId: tenant.id }, estado_tarea: 'PENDIENTE' } }),
    db.venta.findMany({
      where: { tenantId: tenant.id, fecha_venta: { gte: treintaDiasAtras } },
      select: { precio_final_usd: true, cotizacion_dolar_venta: true },
    }),
    db.vehiculo.count({ where: { tenantId: tenant.id, estado: 'EN_PREPARACION' } }),
    db.venta.count({ where: { tenantId: tenant.id } }),
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { not: 'VENDIDO' } },
      select: { precio_compra_usd: true, precio_compra_ars: true },
    }),
  ]);

  const ventasMesUsd = ventasMes.reduce((sum, v) => sum + Number(v.precio_final_usd || 0), 0);
  const ventasMesArs = ventasMes.reduce((sum, v) => sum + Number(v.precio_final_usd || 0) * Number(v.cotizacion_dolar_venta || dolarActual), 0);
  const capitalStockUsd = capitalStock.reduce((sum, v) => sum + Number(v.precio_compra_usd || 0), 0);
  const capitalStockArs = capitalStock.reduce((sum, v) => {
    const storedArs = Number(v.precio_compra_ars || 0);
    return sum + (storedArs > 0 ? storedArs : Number(v.precio_compra_usd || 0) * dolarActual);
  }, 0);

  return (
    <DashboardClient
      dolarActual={dolarActual}
      stats={{
        stockDisponible,
        tareasPendientes,
        ventasMesUsd,
        ventasMesArs,
        enReparacion,
        totalOperaciones,
        capitalStockUsd,
        capitalStockArs,
      }}
    />
  );
}
