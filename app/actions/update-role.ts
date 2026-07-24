'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

export async function updateUserRole(userId: string, role: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const currentProfile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!currentProfile) return { error: 'Not authenticated' }

  const roleName = currentProfile.role
  let perms: Permission[] = []
  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const customRole = await db.collection('roles').findOne({
      team_id: currentProfile.team_id,
      name: roleName,
    })
    perms = customRole?.permissions || []
  }

  if (!perms.includes('members.assign_role')) {
    return { error: "You don't have permission to assign roles" }
  }

  const targetProfile = await db.collection('profiles').findOne({ user_id: userId })
  if (targetProfile?.role === 'ADMIN') {
    const adminCount = await db.collection('profiles').countDocuments({ role: 'ADMIN' })
    if (adminCount === 1) {
      return { error: 'Cannot change the role of the last admin' }
    }
  }

  await db.collection('profiles').updateOne(
    { user_id: userId },
    { $set: { role, updated_at: new Date() } }
  )

  return { success: true }
}
