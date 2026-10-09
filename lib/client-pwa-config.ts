export type ClientPwaConfig = {
  habilitarCatalogo: boolean;
  habilitarPlanCuotas: boolean;
  habilitarPrestamos: boolean;
  habilitarSolicitudPrestamos: boolean;
  requerirDocumentacion: boolean;
  tiposDocumentos: string[];
  montoMaximoPrestamoUsd: number;
  whatsappContacto: string;
  mensajeBienvenida: string;
};

export const DEFAULT_CLIENT_PWA_CONFIG: ClientPwaConfig = {
  habilitarCatalogo: true,
  habilitarPlanCuotas: true,
  habilitarPrestamos: true,
  habilitarSolicitudPrestamos: true,
  requerirDocumentacion: true,
  tiposDocumentos: ['DNI Frente y Dorso', 'Recibo de Sueldo / Ingresos', 'Servicio o Domicilio'],
  montoMaximoPrestamoUsd: 10000,
  whatsappContacto: '',
  mensajeBienvenida: 'Bienvenido al portal de clientes. Consultá tus cuotas, préstamos y catálogo de unidades.',
};

export const CLIENT_PWA_FEATURE_KEY = 'pwa_clientes';

export function normalizeClientPwaConfig(value: unknown): ClientPwaConfig {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const tipos = Array.isArray(source.tiposDocumentos)
    ? source.tiposDocumentos.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : DEFAULT_CLIENT_PWA_CONFIG.tiposDocumentos;

  return {
    habilitarCatalogo: typeof source.habilitarCatalogo === 'boolean' ? source.habilitarCatalogo : DEFAULT_CLIENT_PWA_CONFIG.habilitarCatalogo,
    habilitarPlanCuotas: typeof source.habilitarPlanCuotas === 'boolean' ? source.habilitarPlanCuotas : DEFAULT_CLIENT_PWA_CONFIG.habilitarPlanCuotas,
    habilitarPrestamos: typeof source.habilitarPrestamos === 'boolean' ? source.habilitarPrestamos : DEFAULT_CLIENT_PWA_CONFIG.habilitarPrestamos,
    habilitarSolicitudPrestamos: typeof source.habilitarSolicitudPrestamos === 'boolean' ? source.habilitarSolicitudPrestamos : DEFAULT_CLIENT_PWA_CONFIG.habilitarSolicitudPrestamos,
    requerirDocumentacion: typeof source.requerirDocumentacion === 'boolean' ? source.requerirDocumentacion : DEFAULT_CLIENT_PWA_CONFIG.requerirDocumentacion,
    tiposDocumentos: tipos.length > 0 ? tipos : DEFAULT_CLIENT_PWA_CONFIG.tiposDocumentos,
    montoMaximoPrestamoUsd: typeof source.montoMaximoPrestamoUsd === 'number' && source.montoMaximoPrestamoUsd > 0
      ? source.montoMaximoPrestamoUsd
      : DEFAULT_CLIENT_PWA_CONFIG.montoMaximoPrestamoUsd,
    whatsappContacto: typeof source.whatsappContacto === 'string' ? source.whatsappContacto.trim() : '',
    mensajeBienvenida: typeof source.mensajeBienvenida === 'string' && source.mensajeBienvenida.trim()
      ? source.mensajeBienvenida.trim()
      : DEFAULT_CLIENT_PWA_CONFIG.mensajeBienvenida,
  };
}
