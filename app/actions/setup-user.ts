'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'

export async function setupNewUser() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile) return { error: 'Profile not found' }

  if (profile.team_id) {
    return { success: true, role: profile.role }
  }

  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const isFirstUser = (profileCount || 0) <= 1

  if (isFirstUser) {
    if (profile.role !== 'ADMIN') {
      await supabase
        .from('profiles')
        .update({ role: 'ADMIN', updated_at: new Date().toISOString() })
        .eq('id', session.userId)
    }
    return { success: true, role: 'ADMIN' }
  }

  return { success: true, role: profile.role || 'EMPLOYEE' }
}
