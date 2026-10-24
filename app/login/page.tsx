import { headers } from 'next/headers'
import { resolveTenantByHostname, normalizeHostname } from '@/lib/tenant-context'
import TenantLoginClient from './TenantLoginClient'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = 'OnlyCars'
  try {
    const requestHeaders = await headers()
    const host = normalizeHostname(
      requestHeaders.get('x-forwarded-host') ||
      requestHeaders.get('x-tenant-host') ||
      requestHeaders.get('host') ||
      ''
    )
    const resolved = await resolveTenantByHostname(host)
    if (resolved.success) {
      tenantName = resolved.tenant.settings?.appName || resolved.tenant.name
    }
  } catch {
    // fallback
  }

  return {
    title: `${tenantName} | Iniciar Sesión`,
    description: `Ingreso al sistema de gestión de ${tenantName}`,
  }
}

export default async function LoginPage() {
  let tenantName = 'OnlyCars'
  let tenantArea = 'NanoLabs · Automotive Cloud'
  let tenantBajada = 'Gestión integral para agencias y concesionarias automotrices.'

  try {
    const requestHeaders = await headers()
    const host = normalizeHostname(
      requestHeaders.get('x-forwarded-host') ||
      requestHeaders.get('x-tenant-host') ||
      requestHeaders.get('host') ||
      ''
    )
    const resolved = await resolveTenantByHostname(host)
    if (resolved.success) {
      tenantName = resolved.tenant.settings?.appName || resolved.tenant.name
      tenantArea = `${tenantName} · Gestión Comercial`
      tenantBajada = `Sistema de gestión automotriz de ${tenantName}.`
    }
  } catch {
    // fallback
  }

  return (
    <TenantLoginClient
      tenantName={tenantName}
      tenantArea={tenantArea}
      tenantBajada={tenantBajada}
    />
  )
}
