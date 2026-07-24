'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

export async function deleteTeam(teamId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile) return { error: 'Not authenticated' }

  const roleName = profile.role
  let perms: Permission[] = []
  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const { data: customRole } = await supabase
      .from('roles')
      .select('permissions')
      .eq('team_id', profile.team_id)
      .eq('name', roleName)
      .single()
    perms = customRole?.permissions || []
  }

  if (!perms.includes('team.delete')) return { error: "You don't have permission to delete the team" }

  const { data: team } = await supabase.from('Team').select('*').eq('id', teamId).single()
  if (!team) return { error: 'Team not found' }
  if (team.owner_id !== session.userId) return { error: 'Only the team owner can delete the team' }

  const { data: departments } = await supabase.from('departments').select('id').eq('team_id', teamId)
  const deptIds = (departments || []).map(d => d.id)

  if (deptIds.length > 0) {
    const { data: tasks } = await supabase.from('tasks').select('id').in('department_id', deptIds)
    const taskIds = (tasks || []).map(t => t.id)
    if (taskIds.length > 0) {
      await supabase.from('subtasks').delete().in('task_id', taskIds)
      await supabase.from('comments').delete().in('task_id', taskIds)
      await supabase.from('tasks').delete().in('id', taskIds)
    }
    await supabase.from('employees').delete().in('department_id', deptIds)
    await supabase.from('departments').delete().eq('team_id', teamId)
  }

  const { data: members } = await supabase.from('team_members').select('user_id').eq('team_id', teamId)
  for (const member of (members || [])) {
    const { data: otherTeam } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', member.user_id)
      .neq('team_id', teamId)
      .limit(1)
      .single()

    if (otherTeam) {
      await supabase.from('profiles').update({ team_id: otherTeam.team_id, role: otherTeam.role, updated_at: new Date().toISOString() }).eq('id', member.user_id)
    } else {
      await supabase.from('profiles').update({ team_id: null, role: 'EMPLOYEE', updated_at: new Date().toISOString() }).eq('id', member.user_id)
    }
  }

  await supabase.from('team_members').delete().eq('team_id', teamId)
  await supabase.from('invitations').delete().eq('team_id', teamId)
  await supabase.from('roles').delete().eq('team_id', teamId)

  await supabase.from('Team').delete().eq('id', teamId)

  const { data: nextMember } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', session.userId)
    .limit(1)
    .single()

  if (nextMember) {
    await supabase.from('profiles').update({ team_id: nextMember.team_id, role: nextMember.role, updated_at: new Date().toISOString() }).eq('id', session.userId)
    return { success: true, nextTeamId: nextMember.team_id }
  }

  return { success: true, nextTeamId: null }
}
