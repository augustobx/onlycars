'use client'

import { useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginAction } from '@/actions/auth'
import { Intro } from '@/components/intro/Intro'
import type { PropsIngreso } from '@/components/intro/tipos'

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
    const destino = redirectParam || homePath

    setTimeout(() => {
      router.push(destino)
      router.refresh()
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
