import { NextResponse } from 'next/server';
import { deleteClienteSession } from '@/lib/client-auth';

export async function POST(request: Request) {
  await deleteClienteSession();
  const url = new URL('/portal', request.url);
  return NextResponse.redirect(url, 303);
}
