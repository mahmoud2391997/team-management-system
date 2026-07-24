'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { hashPassword, setSessionCookie, removeSessionCookie, getSessionFromCookies } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function login(email: string, password: string) {
  const { db } = await connectToDatabase()

  const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const bcrypt = await import('bcryptjs')
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password' }
  }

  await setSessionCookie({
    userId: user._id.toString(),
    email: user.email,
  })

  return { success: true }
}

export async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
  const { db } = await connectToDatabase()

  const existing = await db.collection('users').findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const passwordHash = await hashPassword(password)

  const result = await db.collection('users').insertOne({
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    created_at: new Date(),
  })

  await db.collection('profiles').insertOne({
    user_id: result.insertedId.toString(),
    email: email.toLowerCase().trim(),
    first_name: firstName || null,
    last_name: lastName || null,
    role: 'EMPLOYEE',
    team_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  })

  await setSessionCookie({
    userId: result.insertedId.toString(),
    email: email.toLowerCase().trim(),
  })

  return { success: true, userId: result.insertedId.toString() }
}

export async function logout() {
  await removeSessionCookie()
  return { success: true }
}

export async function getUserInfo() {
  const session = await getSessionFromCookies()
  if (!session) return null

  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
  if (!user) return null

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })

  return {
    id: user._id.toString(),
    email: user.email,
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    role: profile?.team_id ? (profile?.role || 'EMPLOYEE') : 'N/A',
    team_id: profile?.team_id || null,
    created_at: user.created_at,
  }
}

export async function resetPassword(currentPassword: string, newPassword: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' }

  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
  if (!user) return { error: 'User not found' }

  const bcrypt = await import('bcryptjs')
  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return { error: 'Current password is incorrect' }

  const newHash = await hashPassword(newPassword)
  await db.collection('users').updateOne(
    { _id: new ObjectId(session.userId) },
    { $set: { password_hash: newHash } }
  )

  return { success: true }
}
