'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'

export async function setupNewUser() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return { error: 'Profile not found' }

  if (profile.team_id) {
    return { success: true, role: profile.role }
  }

  const profileCount = await db.collection('profiles').countDocuments()

  const isFirstUser = profileCount <= 1

  if (isFirstUser) {
    if (profile.role !== 'ADMIN') {
      await db.collection('profiles').updateOne(
        { user_id: session.userId },
        { $set: { role: 'ADMIN', updated_at: new Date() } }
      )
    }
    return { success: true, role: 'ADMIN' }
  }

  return { success: true, role: profile.role || 'EMPLOYEE' }
}
