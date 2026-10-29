/**
 * NanoLabs Modular SaaS System
 * Helpers para habilitar/deshabilitar módulos por Tenant y Plan
 */

export const MODULE_KEYS = {
  SOLO_PRESTAMOS: 'solo_prestamos',
  SIN_VEHICULOS: 'sin_vehiculos',
  MODULO_VEHICULOS: 'modulo_vehiculos',
  MODULO_VENTAS: 'modulo_ventas',
  MODULO_PRESTAMOS: 'modulo_prestamos',
  MODULO_CAJA: 'modulo_caja',
} as const;

/**
 * Retorna true si el tenant opera exclusivamente en modo financiero / préstamos y caja.
 */
export function tenantIsFinancialOnly(features: Set<string> | string[] | undefined | null): boolean {
  if (!features) return false;
  const set = features instanceof Set ? features : new Set(features);
  return (
    set.has(MODULE_KEYS.SOLO_PRESTAMOS) ||
    set.has(MODULE_KEYS.SIN_VEHICULOS) ||
    set.has('plan_financiera') ||
    set.has('modo_financiera')
  );
}

/**
 * Indica si el tenant tiene habilitado el módulo de catálogo e inventario vehicular.
 */
export function tenantHasVehicles(features: Set<string> | string[] | undefined | null): boolean {
  return !tenantIsFinancialOnly(features);
}

/**
 * Indica si el tenant tiene habilitado el módulo de ventas y cotizador vehicular.
 */
export function tenantHasSales(features: Set<string> | string[] | undefined | null): boolean {
  return !tenantIsFinancialOnly(features);
}

/**
 * Indica si el tenant tiene habilitado el módulo de préstamos y cuotas.
 */
export function tenantHasLoans(features: Set<string> | string[] | undefined | null): boolean {
  if (!features) return true;
  const set = features instanceof Set ? features : new Set(features);
  return !set.has('sin_prestamos');
}

/**
 * Indica si el tenant tiene habilitado el módulo de caja y gastos.
 */
export function tenantHasCash(features: Set<string> | string[] | undefined | null): boolean {
  if (!features) return true;
  const set = features instanceof Set ? features : new Set(features);
  return !set.has('sin_caja');
}

