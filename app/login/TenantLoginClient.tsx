'use client'

import { useState, Suspense, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginAction } from '@/actions/auth'
import { Intro } from '@/components/intro/Intro'
import type { PropsIngreso } from '@/components/intro/tipos'
import { TableroAnuncios, type AnnouncementData } from '@/components/theme/TableroAnuncios'

function TenantLoginForm({
  tenantName,
  tenantArea,
  tenantBajada,
}: {
  tenantName: string
  tenantArea: string
  tenantBajada: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState<'verificando' | 'ingreso' | 'adentro'>('ingreso')

  // Control del Tablero de Anuncios y ciclo de la animación de Login
  const [anuncio, setAnuncio] = useState<AnnouncementData | null>(null)
  const [tableroAbierto, setTableroAbierto] = useState(false)
  const [animacionLoginIniciada, setAnimacionLoginIniciada] = useState(false)

  useEffect(() => {
    let mounted = true
    async function verificarAnuncio() {
      try {
        const res = await fetch('/api/announcement', { cache: 'no-store' })
        if (!res.ok) {
          if (mounted) setAnimacionLoginIniciada(true)
          return
        }
        const data = await res.json()
        if (!mounted) return

        if (data && data.active && data.id) {
          const dismissedKey = 'onlycars_announcement_dismissed_' + data.id
          if (localStorage.getItem(dismissedKey) !== 'true') {
            setAnuncio(data)
            setTableroAbierto(true)
            // Mientras está el tablero, la animación del login queda detenida
            return
          }
        }
        // Sin anuncio o ya descartado: se inicia la animación del login normalmente
        setAnimacionLoginIniciada(true)
      } catch {
        if (mounted) setAnimacionLoginIniciada(true)
      }
    }
    verificarAnuncio()
    return () => {
      mounted = false
    }
  }, [])

  const cerrarTablero = () => {
    setTableroAbierto(false)
    // Al cerrar el tablero se inicia la animación del login
    setAnimacionLoginIniciada(true)
  }

  const descartarPermanente = () => {
    if (anuncio?.id) {
      localStorage.setItem('onlycars_announcement_dismissed_' + anuncio.id, 'true')
    }
    cerrarTablero()
  }

  const aviso = useMemo(() => {
    if (errorParam === 'superadmin_required') {
      return 'Acceso restringido: se requieren privilegios de SuperAdmin.'
    }
    if (errorParam === 'tenant_access_denied') {
      return `Tu usuario no tiene acceso a ${tenantName}.`
    }
    return null
  }, [errorParam, tenantName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await loginAction({ email, password })

    if (!res.success) {
      if ('suspended' in res && res.suspended) {
        router.push('/suspendido')
        return
      }
      setError(res.error || 'Credenciales incorrectas.')
      setLoading(false)
      return
    }

    setEstado('adentro')
    const homePath = res.user?.homePath || '/'
    const requested = redirectParam || homePath
    const destino = requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')
      ? requested
      : homePath

    setTimeout(() => {
      window.location.assign(destino)
    }, 650)
  }

  const ambiente = process.env.NODE_ENV === 'development' ? 'Local' : null

  const ingresoProps: PropsIngreso = {
    ambiente,
    error: error || null,
    aviso,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    onSubmit: handleSubmit,
  }

  // Si el tablero está abierto, se muestra únicamente el tablero sobre el espacio cósmico
  // SIN ejecutar la animación del login detrás.
  if (tableroAbierto && anuncio) {
    return (
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(38% 46% at 30% 46%, rgba(190, 75, 4, 0.34) 0%, rgba(190, 75, 4, 0) 72%), radial-gradient(90% 80% at 40% 45%, rgba(50, 18, 1, 0.9) 0%, rgba(50, 18, 1, 0) 75%), #0D0501',
        }}
      >
        <TableroAnuncios
          anuncio={anuncio}
          onClose={cerrarTablero}
          onDismissPermanent={descartarPermanente}
          systemName={tenantName}
        />
      </div>
    )
  }

  // Mientras se consulta la existencia de un anuncio (primeros ms), mantenemos el fondo neutro
  if (!animacionLoginIniciada) {
    return (
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(38% 46% at 30% 46%, rgba(190, 75, 4, 0.34) 0%, rgba(190, 75, 4, 0) 72%), radial-gradient(90% 80% at 40% 45%, rgba(50, 18, 1, 0.9) 0%, rgba(50, 18, 1, 0) 75%), #0D0501',
        }}
      />
    )
  }

  // Solo cuando animacionLoginIniciada es true (al cerrar el tablero o sin anuncio),
  // se monta <Intro /> iniciando la animación de partículas y escena cósmica desde cero.
  return (
    <Intro
      estado={estado}
      ingreso={ingresoProps}
      config={{
        producto: tenantName,
        area: tenantArea,
        bajada: tenantBajada,
      }}
    />
  )
}

export default function TenantLoginClient({
  tenantName,
  tenantArea,
  tenantBajada,
}: {
  tenantName: string
  tenantArea: string
  tenantBajada: string
}) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'radial-gradient(38% 46% at 30% 46%, rgba(190, 75, 4, 0.34) 0%, rgba(190, 75, 4, 0) 72%), radial-gradient(90% 80% at 40% 45%, rgba(50, 18, 1, 0.9) 0%, rgba(50, 18, 1, 0) 75%), #0D0501',
          }}
        />
      }
    >
      <TenantLoginForm
        tenantName={tenantName}
        tenantArea={tenantArea}
        tenantBajada={tenantBajada}
      />
    </Suspense>
  )
}
