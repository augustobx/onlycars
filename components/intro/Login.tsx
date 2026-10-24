'use client'

import { useEffect, useRef, useState } from 'react'
import { Icono } from './Icono'
import { INTRO } from './config'
import { NanoLabsMark } from './NanoLabsMark'
import type { PropsIngreso } from './tipos'
import { crearCielo } from './escena/cielo'
import { crearEscena } from './escena/particulas'
import type { Escena, Fase } from './escena/particulas'

const FASES: Fase[] = ['caos', 'isotipo', 'producto']

const quietoDelSistema = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Login({
  modo,
  ingreso,
}: {
  modo: 'verificando' | 'ingreso' | 'saliendo'
  ingreso?: PropsIngreso
}) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const cielo = useRef<HTMLCanvasElement>(null)
  const escena = useRef<Escena | null>(null)
  const [fase, setFase] = useState<Fase>('caos')
  const [tarjeta, setTarjeta] = useState(false)
  const [quieto] = useState(quietoDelSistema)

  useEffect(() => {
    if (!lienzo.current) return
    const pedida = new URLSearchParams(window.location.search).get('escena') as Fase | null
    const faseFija = pedida && FASES.includes(pedida) ? pedida : undefined
    escena.current = crearEscena(lienzo.current, {
      logoUrl: '/nanolabs/logo-nanolabs.svg',
      quieto,
      faseFija,
      onFase: setFase,
    })
    return () => escena.current?.destruir()
  }, [quieto])

  useEffect(() => {
    if (!cielo.current) return
    const c = crearCielo(cielo.current, quieto)
    return () => c.destruir()
  }, [quieto])

  useEffect(() => {
    if (modo !== 'ingreso') return
    const t = setTimeout(() => setTarjeta(true), quieto ? 0 : 1600)
    return () => clearTimeout(t)
  }, [modo, quieto])

  return (
    <div className={`bhi bh2 bh3${modo === 'saliendo' ? ' bh2--sale' : ''}`} aria-busy={modo === 'verificando'}>
      <div className="bh2-fondo" aria-hidden="true" />
      <canvas ref={cielo} className="bh2-lienzo" aria-hidden="true" />
      <canvas ref={lienzo} className="bh2-lienzo" aria-hidden="true" />
      <div className="bh2-vineta" aria-hidden="true" />

      <header className="bh2-arriba">
        <span className="bh2-marca__area">{INTRO.area}</span>
      </header>

      {fase === 'producto' && (
        <div className="bh3-nombre">
          <h2 className="bh3-nombre__titulo">{INTRO.producto}</h2>
          <p className="bh3-nombre__bajada">{INTRO.bajada}</p>
        </div>
      )}

      <div className="bh2-relato" aria-live="polite">
        <p className="bh2-nanolabs">
          <NanoLabsMark size={22} />
          <span>
            Powered by <strong>NanoLabs</strong>
          </span>
        </p>
        {modo === 'verificando' && (
          <p className="bh2-estado" role="status">
            <span className="bh2-estado__barra" aria-hidden="true" />
            Verificando tu sesión…
          </p>
        )}
      </div>

      {modo !== 'verificando' && ingreso && (
        <Tarjeta visible={tarjeta || modo === 'saliendo'} {...ingreso} />
      )}

      <p className="bh2-pie">NanoLabs · Automotive Cloud · Multi-Tenant Platform</p>
    </div>
  )
}

function Tarjeta({
  visible,
  ambiente,
  error,
  aviso,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
}: PropsIngreso & { visible: boolean }) {
  return (
    <main className={`bh2-tarjeta${visible ? ' bh2-tarjeta--visible' : ''}`} aria-hidden={!visible}>
      <div className="bh2-tarjeta__cuerpo">
        <div className="bh2-tarjeta__cabeza">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF8A2B, #E25700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(243, 115, 32, 0.35)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', lineHeight: '1.1' }}>
                OnlyCars
              </h1>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Dealer Management System
              </p>
            </div>
          </div>
          {ambiente && <span className="bhi-chip bhi-chip--info">{ambiente}</span>}
        </div>

        <p className="bh2-tarjeta__bajada">Ingresá con tus credenciales de concesionaria.</p>

        {error && (
          <div className="bhi-alerta bhi-alerta--danger" role="alert">
            <Icono nombre="error" tamano={20} />
            <div>
              <strong>Error de acceso</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {aviso && (
          <div className="bhi-alerta bhi-alerta--warning">
            <Icono nombre="advertencia" tamano={20} />
            <div>{aviso}</div>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="bhi-campo">
            <label className="bhi-etiqueta" htmlFor="login-email">
              Correo electrónico
            </label>
            <div className="bhi-input-contenedor">
              <span className="bhi-input-icono">
                <Icono nombre="correo" tamano={18} />
              </span>
              <input
                id="login-email"
                type="email"
                required
                tabIndex={visible ? 0 : -1}
                autoComplete="email"
                placeholder="usuario@concesionaria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bhi-input"
              />
            </div>
          </div>

          <div className="bhi-campo">
            <label className="bhi-etiqueta" htmlFor="login-password">
              Contraseña
            </label>
            <div className="bhi-input-contenedor">
              <span className="bhi-input-icono">
                <Icono nombre="candado" tamano={18} />
              </span>
              <input
                id="login-password"
                type="password"
                required
                tabIndex={visible ? 0 : -1}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bhi-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bhi-boton bhi-boton--primario"
            disabled={loading}
            tabIndex={visible ? 0 : -1}
          >
            {loading ? (
              <span className="bhi-girando" aria-hidden="true" />
            ) : (
              <Icono nombre="ingresar" tamano={20} />
            )}
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>

          <p className="bh2-seguro">
            <Icono nombre="candado" tamano={15} />
            Acceso seguro para colaboradores de la concesionaria
          </p>
        </form>
      </div>

      <div className="bh2-tarjeta__pie">
        <span>¿Problemas para ingresar? Contactá al administrador de tu agencia.</span>
      </div>
    </main>
  )
}
