import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSupabase } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'team-management-secret-key-change-in-production'
const COOKIE_NAME = 'auth-token'

export interface JWTPayload {
  userId: string
  email: string
}

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  team_id: string | null
  created_at: string
  updated_at: string
}

export interface CurrentUser {
  id: string
  email: string
  profile: UserProfile | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function setSessionCookie(payload: JWTPayload) {
  const token = signToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function removeSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSessionFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionFromCookies()
  if (!session) return null

  const supabase = getSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  return {
    id: user.id,
    email: user.email,
    profile: profile || null,
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSessionFromCookies()
  if (!session) return null

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  return profile || null
}

export async function getRequiredUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}
