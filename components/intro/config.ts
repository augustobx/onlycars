export interface ConfigIntro {
  /** Nombre del producto o tenant (ej. 'OnlyCars' o el nombre de la concesionaria) */
  producto: string
  /** Área o contexto del servicio (arriba a la izquierda) */
  area: string
  /** Qué hace la plataforma en una frase: subtítulo del nombre */
  bajada: string
}

export const INTRO_DEFAULT: ConfigIntro = {
  producto: 'OnlyCars',
  area: 'NanoLabs · Automotive Cloud',
  bajada: 'Gestión integral para agencias y concesionarias automotrices.',
}
