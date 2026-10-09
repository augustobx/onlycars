import 'server-only';

import crypto from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const scryptAsync = promisify(crypto.scrypt);
export const CLIENT_SESSION_COOKIE = 'onlycars_client_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export interface AuthenticatedCliente {
  id_cliente: number;
  tenantId: string;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  domicilio: string | null;
  localidad: string | null;
}

export async function hashClientePassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyClientePassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    if (!salt || !expectedHex) return false;

    const actual = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, 'hex');
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  }
  return false;
}

export async function createClienteSession(clienteId: number): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.clienteSession.create({
    data: {
      clienteId,
      tokenHash,
      expiresAt,
    },
  });

  await prisma.cliente.update({
    where: { id_cliente: clienteId },
    data: { ultimoAcceso: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    path: '/',
  });

  return rawToken;
}

export async function deleteClienteSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    try {
      await prisma.clienteSession.deleteMany({
        where: { tokenHash },
      });
    } catch {
      // Ignorar si ya fue eliminada
    }
    cookieStore.delete(CLIENT_SESSION_COOKIE);
  }
}

export async function getLoggedCliente(tenantId: string): Promise<AuthenticatedCliente | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();

  const session = await prisma.clienteSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: now },
    },
    include: {
      cliente: true,
    },
  });

  if (!session || !session.cliente) return null;
  if (session.cliente.tenantId !== tenantId) return null;

  return {
    id_cliente: session.cliente.id_cliente,
    tenantId: session.cliente.tenantId,
    nombre_completo: session.cliente.nombre_completo,
    dni: session.cliente.dni,
    telefono: session.cliente.telefono,
    email: session.cliente.email,
    domicilio: session.cliente.domicilio,
    localidad: session.cliente.localidad,
  };
}
