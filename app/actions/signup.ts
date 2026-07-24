'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'

export async function signUpInvited(email: string, password: string) {
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
    first_name: null,
    last_name: null,
    role: 'EMPLOYEE',
    team_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true, userId: result.insertedId.toString() }
}
