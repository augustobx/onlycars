export interface ConfigIntro {
  /** Nombre del producto / proceso, tal como lo ve el usuario. Va grande en la mitad izquierda. */
  producto: string
  /** Área o contexto del servicio: arriba a la izquierda. */
  area: string
  /** Qué hace la plataforma en una frase: subtítulo del nombre. */
  bajada: string
}

export const INTRO: ConfigIntro = {
  producto: 'OnlyCars',
  area: 'NanoLabs · Automotive Cloud',
  bajada: 'Gestión integral para agencias y concesionarias automotrices.',
}
