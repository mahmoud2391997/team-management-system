import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Document, WithId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'team-management-secret-key-change-in-production'
const COOKIE_NAME = 'auth-token'

export interface JWTPayload {
  userId: string
  email: string
}

export interface UserProfile extends Document {
  _id: ObjectId
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  team_id: string | null
  created_at: Date
  updated_at: Date
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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

  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
  if (!user) return null

  const profile = await db.collection('profiles').findOne({ user_id: session.userId }) as UserProfile | null

  return {
    id: user._id.toString(),
    email: user.email,
    profile: profile ? {
      ...profile,
      _id: profile._id,
    } : null,
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSessionFromCookies()
  if (!session) return null

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId }) as UserProfile | null
  return profile
}

export async function getRequiredUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}
