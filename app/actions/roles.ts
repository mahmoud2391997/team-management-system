'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { DEFAULT_ROLES, ALL_PERMISSIONS, type Permission } from '@/lib/permissions'

async function getUserPerms(db: any, profile: any): Promise<Permission[]> {
  if (DEFAULT_ROLES[profile.role]) return DEFAULT_ROLES[profile.role].permissions
  const customRole = await db.collection('roles').findOne({ team_id: profile.team_id, name: profile.role })
  return customRole?.permissions || []
}

export async function getTeamRoles() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team', data: [] }

  const customRoles = await db.collection('roles')
    .find({ team_id: profile.team_id })
    .toArray()

  const builtInRoles = Object.entries(DEFAULT_ROLES).map(([key, val]) => ({
    id: key,
    name: key,
    label: val.label,
    permissions: val.permissions,
    is_builtin: true,
  }))

  const custom = customRoles.map(r => ({
    id: r._id.toString(),
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

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(db, profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  const normalizedName = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  if (!normalizedName) return { error: 'Invalid role name' }

  if (DEFAULT_ROLES[normalizedName]) {
    return { error: 'Cannot use a built-in role name' }
  }

  const existing = await db.collection('roles').findOne({
    team_id: profile.team_id,
    name: normalizedName,
  })
  if (existing) {
    return { error: 'A role with this name already exists' }
  }

  const validPerms = permissions.filter(p => ALL_PERMISSIONS.includes(p as Permission))

  await db.collection('roles').insertOne({
    team_id: profile.team_id,
    name: normalizedName,
    label: label.trim() || normalizedName,
    permissions: validPerms,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true }
}

export async function updateRole(roleId: string, label: string, permissions: Permission[]) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(db, profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  if (DEFAULT_ROLES[roleId]) return { error: 'Cannot edit built-in roles' }

  const validPerms = permissions.filter(p => ALL_PERMISSIONS.includes(p as Permission))

  await db.collection('roles').updateOne(
    { _id: new ObjectId(roleId), team_id: profile.team_id },
    { $set: { label: label.trim(), permissions: validPerms, updated_at: new Date() } }
  )

  return { success: true }
}

export async function deleteRole(roleId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team' }
  const perms = await getUserPerms(db, profile)
  if (!perms.includes('roles.manage')) return { error: "You don't have permission to manage roles" }

  if (DEFAULT_ROLES[roleId]) return { error: 'Cannot delete built-in roles' }

  const role = await db.collection('roles').findOne({
    _id: new ObjectId(roleId),
    team_id: profile.team_id,
  })
  if (!role) return { error: 'Role not found' }

  const membersUsingRole = await db.collection('profiles').countDocuments({
    team_id: profile.team_id,
    role: role.name,
  })
  if (membersUsingRole > 0) {
    return { error: `Cannot delete: ${membersUsingRole} member(s) still use this role` }
  }

  await db.collection('roles').deleteOne({ _id: new ObjectId(roleId) })
  return { success: true }
}

export async function getRolePermissions(roleName: string) {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  if (DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName].permissions
  }

  const customRole = await db.collection('roles').findOne({
    team_id: profile.team_id,
    name: roleName,
  })

  return customRole?.permissions || []
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getSessionFromCookies()
  if (!session) return false

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return false

  const roleName = profile.role

  if (DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName].permissions.includes(permission)
  }

  const customRole = await db.collection('roles').findOne({
    team_id: profile.team_id,
    name: roleName,
  })

  return customRole?.permissions?.includes(permission) || false
}
