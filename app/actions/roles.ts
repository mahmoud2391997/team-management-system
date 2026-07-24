'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, ALL_PERMISSIONS, type Permission } from '@/lib/permissions'

async function getUserPerms(profile: any): Promise<Permission[]> {
  if (DEFAULT_ROLES[profile.role]) return DEFAULT_ROLES[profile.role].permissions
  const supabase = getSupabase()
  const { data: customRole } = await supabase
    .from('roles')
    .select('permissions')
    .eq('team_id', profile.team_id)
    .eq('name', profile.role)
    .single()
  return customRole?.permissions || []
}

export async function getTeamRoles() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team', data: [] }

  const { data: customRoles } = await supabase
    .from('roles')
    .select('*')
    .eq('team_id', profile.team_id)

  const builtInRoles = Object.entries(DEFAULT_ROLES).map(([key, val]) => ({
    id: key,
    name: key,
    label: val.label,
    permissions: val.permissions,
    is_builtin: true,
  }))

  const custom = (customRoles || []).map(r => ({
    id: r.id,
    name: r.name,
    label: r.label,
    permissions: r.permissions,
    is_builtin: false,
  }))

  return { success: true, data: [...builtInRoles, ...custom] }
}

export async function createRole(name: string, label: string, permissions: Permission[]) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  const normalizedName = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  if (!normalizedName) return { error: 'Invalid role name' }

  if (DEFAULT_ROLES[normalizedName]) {
    return { error: 'Cannot use a built-in role name' }
  }

  const { data: existing } = await supabase
    .from('roles')
    .select('id')
    .eq('team_id', profile.team_id)
    .eq('name', normalizedName)
    .single()

  if (existing) {
    return { error: 'A role with this name already exists' }
  }

  const validPerms = permissions.filter(p => ALL_PERMISSIONS.includes(p as Permission))

  const { error } = await supabase
    .from('roles')
    .insert({
      team_id: profile.team_id,
      name: normalizedName,
      label: label.trim() || normalizedName,
      permissions: validPerms,
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateRole(roleId: string, label: string, permissions: Permission[]) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  if (DEFAULT_ROLES[roleId]) return { error: 'Cannot edit built-in roles' }

  const validPerms = permissions.filter(p => ALL_PERMISSIONS.includes(p as Permission))

  const { error } = await supabase
    .from('roles')
    .update({ label: label.trim(), permissions: validPerms, updated_at: new Date().toISOString() })
    .eq('id', roleId)
    .eq('team_id', profile.team_id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteRole(roleId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  if (DEFAULT_ROLES[roleId]) return { error: 'Cannot delete built-in roles' }

  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .eq('team_id', profile.team_id)
    .single()

  if (!role) return { error: 'Role not found' }

  const { count: membersUsingRole } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', profile.team_id)
    .eq('role', role.name)

  if ((membersUsingRole || 0) > 0) {
    return { error: `Cannot delete: ${membersUsingRole} member(s) still use this role` }
  }

  await supabase.from('roles').delete().eq('id', roleId)
  return { success: true }
}

export async function getRolePermissions(roleName: string) {
  const session = await getSessionFromCookies()
  if (!session) return []

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return []

  if (DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName].permissions
  }

  const { data: customRole } = await supabase
    .from('roles')
    .select('permissions')
    .eq('team_id', profile.team_id)
    .eq('name', roleName)
    .single()

  return customRole?.permissions || []
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getSessionFromCookies()
  if (!session) return false

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile) return false

  const roleName = profile.role

  if (DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName].permissions.includes(permission)
  }

  const { data: customRole } = await supabase
    .from('roles')
    .select('permissions')
    .eq('team_id', profile.team_id)
    .eq('name', roleName)
    .single()

  return customRole?.permissions?.includes(permission) || false
}
