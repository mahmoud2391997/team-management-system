'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'
import type { ActionResult, Employee, Department, Task, DashboardStats } from '@/lib/types'
import { createSuccess, createError } from '@/lib/utils/async-helpers'

export async function getUserPermissions(): Promise<Permission[]> {
  const session = await getSessionFromCookies()
  if (!session) return []

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile) return []

  if (DEFAULT_ROLES[profile.role]) return DEFAULT_ROLES[profile.role].permissions

  const { data: customRole } = await supabase
    .from('roles')
    .select('permissions')
    .eq('team_id', profile.team_id)
    .eq('name', profile.role)
    .single()

  return customRole?.permissions || []
}

async function requirePermission(permission: Permission): Promise<{ ok: boolean; error?: string; profile?: any }> {
  const session = await getSessionFromCookies()
  if (!session) return { ok: false, error: 'Not authenticated' }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { ok: false, error: 'No team' }

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

  if (!perms.includes(permission)) {
    return { ok: false, error: `You don't have permission` }
  }

  return { ok: true, profile }
}

export async function getProfile(): Promise<Record<string, any> | null> {
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

export async function getTeamProfile() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team', profile: null }
  return { profile, error: null }
}

export async function getTeamId() {
  const profile = await getProfile()
  return profile?.team_id || null
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const session = await getSessionFromCookies()
    if (!session) return createSuccess({ employees: 0, tasks: 0, departments: 0, completedTasks: 0 })

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    if (!profile?.team_id) return createSuccess({ employees: 0, tasks: 0, departments: 0, completedTasks: 0 })

    const teamId = profile.team_id

    const [empResult, taskResult, deptResult, completedResult] = await Promise.all([
      supabase.from('employees').select('*', { count: 'exact', head: true }).eq('department_id',
        supabase.from('departments').select('id').eq('team_id', teamId)
      ),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('departments').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    ])

    // Simpler approach: get dept ids first, then count
    const { data: depts } = await supabase.from('departments').select('id').eq('team_id', teamId)
    const deptIds = (depts || []).map(d => d.id)

    const [empCount, taskCount, completedCount] = await Promise.all([
      deptIds.length > 0
        ? supabase.from('employees').select('*', { count: 'exact', head: true }).in('department_id', deptIds)
        : { count: 0 },
      deptIds.length > 0
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('department_id', deptIds)
        : { count: 0 },
      deptIds.length > 0
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('department_id', deptIds).eq('status', 'COMPLETED')
        : { count: 0 },
    ])

    return createSuccess({
      employees: empCount.count || 0,
      tasks: taskCount.count || 0,
      departments: deptResult.count || 0,
      completedTasks: completedCount.count || 0,
    })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to fetch stats')
  }
}

export async function getEmployees(): Promise<ActionResult<Employee[]>> {
  try {
    const session = await getSessionFromCookies()
    if (!session) return createSuccess([])

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    if (!profile?.team_id) return createSuccess([])

    const { data: depts } = await supabase.from('departments').select('id').eq('team_id', profile.team_id)
    const deptIds = (depts || []).map(d => d.id)

    if (deptIds.length === 0) return createSuccess([])

    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .in('department_id', deptIds)
      .order('created_at', { ascending: false })

    if (!employees || employees.length === 0) return createSuccess([])

    const enriched = await Promise.all(employees.map(async (emp) => {
      const { data: empProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('id', emp.profile_id)
        .single()

      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', emp.department_id)
        .single()

      const { data: manager } = emp.manager_id
        ? await supabase.from('profiles').select('id, first_name, last_name').eq('id', emp.manager_id).single()
        : { data: null }

      return {
        ...emp,
        profile: empProfile || null,
        department: department || null,
        manager: manager || null,
      }
    }))

    return createSuccess(enriched as any as Employee[])
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to fetch employees')
  }
}

export async function getDepartments(): Promise<ActionResult<Department[]>> {
  try {
    const session = await getSessionFromCookies()
    if (!session) return createSuccess([])

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    if (!profile?.team_id) return createSuccess([])

    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })

    if (!departments || departments.length === 0) return createSuccess([])

    const enriched = await Promise.all(departments.map(async (dept) => {
      const { data: manager } = dept.manager_id
        ? await supabase.from('profiles').select('id, email, first_name, last_name').eq('id', dept.manager_id).single()
        : { data: null }

      return { ...dept, manager: manager || null }
    }))

    return createSuccess(enriched as any as Department[])
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to fetch departments')
  }
}

export async function getTasks(filterDept?: string): Promise<ActionResult<Task[]>> {
  try {
    const session = await getSessionFromCookies()
    if (!session) return createSuccess([])

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    if (!profile?.team_id) return createSuccess([])

    const { data: depts } = await supabase.from('departments').select('id').eq('team_id', profile.team_id)
    const deptIds = (depts || []).map(d => d.id)

    if (deptIds.length === 0) return createSuccess([])

    let query = supabase.from('tasks').select('*').in('department_id', deptIds)
    if (filterDept) query = query.eq('department_id', filterDept)

    const { data: tasks } = await query.order('created_at', { ascending: false })
    if (!tasks || tasks.length === 0) return createSuccess([])

    const enriched = await Promise.all(tasks.map(async (task) => {
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', task.department_id)
        .single()

      const { data: assignee } = task.assignee_id
        ? await supabase.from('profiles').select('id, first_name, last_name, email').eq('id', task.assignee_id).single()
        : { data: null }

      return { ...task, department: department || null, assignee: assignee || null }
    }))

    return createSuccess(enriched as any as Task[])
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to fetch tasks')
  }
}

export async function getProfiles(): Promise<ActionResult<Record<string, any>[]>> {
  try {
    const session = await getSessionFromCookies()
    if (!session) return createSuccess([])

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    let teamId = profile?.team_id

    if (!teamId) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      teamId = membership?.team_id
    }

    if (!teamId) return createSuccess([])

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    return createSuccess((profiles || []).map(p => ({ ...p, id: p.id })))
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to fetch profiles')
  }
}

export async function getManagerProfiles(): Promise<ActionResult<Record<string, any>[]>> {
  const result = await getProfiles()
  if (result.error) return result
  return createSuccess(result.data.filter((p: any) => p.role === 'MANAGER' || p.role === 'ADMIN'))
}

export async function getAllProfiles() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const supabase = getSupabase()
  const { data: profiles } = await supabase.from('profiles').select('*')
  return (profiles || []).map(p => ({ ...p, id: p.id }))
}

export async function getTeamMembers() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return []

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', profile.team_id)

  return (members || []).map(m => ({ ...m, id: m.id }))
}

export async function getTeam() {
  const session = await getSessionFromCookies()
  if (!session) return null

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return null

  const { data: team } = await supabase
    .from('Team')
    .select('id, name, owner_id')
    .eq('id', profile.team_id)
    .single()

  return team || null
}

export async function createEmployee(data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('employees.create')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { data: result, error } = await supabase
      .from('employees')
      .insert(data)
      .select('id')
      .single()

    if (error) return createError(error.message)
    return createSuccess({ id: result.id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to create employee')
  }
}

export async function updateEmployee(id: string, data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('employees.edit')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase
      .from('employees')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to update employee')
  }
}

export async function deleteEmployee(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('employees.delete')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to delete employee')
  }
}

export async function createDepartment(data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('departments.create')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { data: result, error } = await supabase
      .from('departments')
      .insert({ ...data, team_id: auth.profile.team_id })
      .select('id')
      .single()

    if (error) return createError(error.message)
    return createSuccess({ id: result.id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to create department')
  }
}

export async function updateDepartment(id: string, data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('departments.edit')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase
      .from('departments')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to update department')
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('departments.delete')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to delete department')
  }
}

export async function createTask(data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('tasks.create')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select('id')
      .single()

    if (error) return createError(error.message)
    return createSuccess({ id: result.id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to create task')
  }
}

export async function updateTask(id: string, data: any): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('tasks.edit')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase
      .from('tasks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to update task')
  }
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('tasks.delete')
    if (!auth.ok) return createError(auth.error!)

    const supabase = getSupabase()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return createError(error.message)
    return createSuccess({ id })
  } catch (error) {
    return createError(error instanceof Error ? error.message : 'Failed to delete task')
  }
}

export async function removeFromTeam(memberId: string) {
  const auth = await requirePermission('members.remove')
  if (!auth.ok) return { error: auth.error }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', memberId)
    .single()

  const currentTeamId = profile?.team_id

  await supabase.from('team_members').delete().eq('user_id', memberId).eq('team_id', currentTeamId)

  if (auth.profile.id === memberId) {
    const { data: nextMembership } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', memberId)
      .limit(1)
      .single()

    if (nextMembership) {
      await supabase
        .from('profiles')
        .update({ team_id: nextMembership.team_id, role: nextMembership.role, updated_at: new Date().toISOString() })
        .eq('id', memberId)
    } else {
      await supabase
        .from('profiles')
        .update({ team_id: null, role: 'EMPLOYEE', updated_at: new Date().toISOString() })
        .eq('id', memberId)
    }
  } else {
    await supabase
      .from('profiles')
      .update({ team_id: null, role: 'EMPLOYEE', updated_at: new Date().toISOString() })
      .eq('id', memberId)
  }

  return { success: true }
}

export async function leaveTeam() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'Not in any team' }

  await supabase.from('team_members').delete().eq('user_id', session.userId).eq('team_id', profile.team_id)

  const { data: nextMembership } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', session.userId)
    .limit(1)
    .single()

  if (nextMembership) {
    await supabase
      .from('profiles')
      .update({ team_id: nextMembership.team_id, role: nextMembership.role, updated_at: new Date().toISOString() })
      .eq('id', session.userId)
  } else {
    await supabase
      .from('profiles')
      .update({ team_id: null, role: 'EMPLOYEE', updated_at: new Date().toISOString() })
      .eq('id', session.userId)
  }

  return { success: true }
}

function isError(result: any): boolean {
  return result?.error !== undefined
}
