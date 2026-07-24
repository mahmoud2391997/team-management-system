'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

export async function updateUserRole(userId: string, role: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!currentProfile) return { error: 'Not authenticated' }

  const roleName = currentProfile.role
  let perms: Permission[] = []
  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const { data: customRole } = await supabase
      .from('roles')
      .select('permissions')
      .eq('team_id', currentProfile.team_id)
      .eq('name', roleName)
      .single()
    perms = customRole?.permissions || []
  }

  if (!perms.includes('members.assign_role')) {
    return { error: "You don't have permission to assign roles" }
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (targetProfile?.role === 'ADMIN') {
    const { count: adminCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN')

    if ((adminCount || 0) === 1) {
      return { error: 'Cannot change the role of the last admin' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}
