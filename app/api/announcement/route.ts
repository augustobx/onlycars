import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let memoryCache: { data: any; expiry: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (memoryCache && memoryCache.expiry > now) {
    return NextResponse.json(memoryCache.data);
  }

  try {
    const hubUrl = process.env.HUB_ANNOUNCEMENT_URL || 'https://hub.nanoapps.ar/api/announcements/onlycars';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(hubUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const fallback = { active: false };
      memoryCache = { data: fallback, expiry: now + 30000 };
      return NextResponse.json(fallback);
    }

    const payload = await res.json();
    const result = payload?.data || { active: false };
    memoryCache = { data: result, expiry: now + 20000 };
    return NextResponse.json(result);
  } catch (error) {
    console.warn('[OnlyCars Announcement] Hub fallback active (no-op):', error instanceof Error ? error.message : error);
    const fallback = { active: false };
    memoryCache = { data: fallback, expiry: now + 30000 };
    return NextResponse.json(fallback);
  }
}
