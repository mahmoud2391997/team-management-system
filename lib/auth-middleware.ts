import { NextResponse, type NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'team-management-secret-key-change-in-production'

const protectedRoutes = ['/dashboard', '/employees', '/departments', '/tasks', '/roles', '/settings', '/members', '/notifications', '/profile']

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function verifyTokenEdge(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

    if (header.alg !== 'HS256') return null

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null

    const encoder = new TextEncoder()
    const key = crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const data = encoder.encode(`${parts[0]}.${parts[1]}`)
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )

    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }

  if (!token) {
    if (isProtectedRoute(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    const response = NextResponse.next()
    Object.entries(noCacheHeaders).forEach(([key, value]) => response.headers.set(key, value))
    return response
  }

  let payload: { userId: string; email: string } | null = null

  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payloadData = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const now = Math.floor(Date.now() / 1000)
      if (!payloadData.exp || payloadData.exp >= now) {
        payload = { userId: payloadData.userId, email: payloadData.email }
      }
    }
  } catch {
    // invalid token
  }

  if (isProtectedRoute(request.nextUrl.pathname) && !payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  Object.entries(noCacheHeaders).forEach(([key, value]) => response.headers.set(key, value))
  return response
}
