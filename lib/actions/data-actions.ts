'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

export async function getUserPermissions(): Promise<Permission[]> {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return []

  const roleName = profile.role
  if (DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName].permissions
  }

  const customRole = await db.collection('roles').findOne({
    team_id: profile.team_id,
    name: roleName,
  })

  return customRole?.permissions || []
}

async function requirePermission(permission: Permission): Promise<{ ok: boolean; error?: string; profile?: any }> {
  const session = await getSessionFromCookies()
  if (!session) return { ok: false, error: 'Not authenticated' }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { ok: false, error: 'No team' }

  const roleName = profile.role
  let perms: Permission[] = []

  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const customRole = await db.collection('roles').findOne({
      team_id: profile.team_id,
      name: roleName,
    })
    perms = customRole?.permissions || []
  }

  if (!perms.includes(permission)) {
    return { ok: false, error: `You don't have permission to ${permissionLabel(permission)}` }
  }

  return { ok: true, profile }
}

function permissionLabel(perm: Permission): string {
  const labels: Record<string, string> = {
    'employees.view': 'view employees',
    'employees.create': 'create employees',
    'employees.edit': 'edit employees',
    'employees.delete': 'delete employees',
    'departments.view': 'view departments',
    'departments.create': 'create departments',
    'departments.edit': 'edit departments',
    'departments.delete': 'delete departments',
    'tasks.view': 'view tasks',
    'tasks.create': 'create tasks',
    'tasks.edit': 'edit tasks',
    'tasks.delete': 'delete tasks',
    'tasks.assign': 'assign tasks',
    'members.view': 'view members',
    'members.invite': 'invite members',
    'members.remove': 'remove members',
    'members.assign_role': 'assign roles',
    'roles.manage': 'manage roles',
    'settings.manage': 'manage settings',
    'team.delete': 'delete team',
  }
  return labels[perm] || perm
}

export async function getProfile(): Promise<Record<string, any> | null> {
  const session = await getSessionFromCookies()
  if (!session) return null

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return null

  return {
    ...profile,
    _id: profile._id.toString(),
    user_id: profile.user_id,
  }
}

export async function getTeamProfile() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team', profile: null }

  return { profile: { ...profile, _id: profile._id.toString(), user_id: profile.user_id }, error: null }
}

export async function getTeamId() {
  const profile = await getProfile()
  return profile?.team_id || null
}

export async function getDashboardStats() {
  const session = await getSessionFromCookies()
  if (!session) return { employees: 0, tasks: 0, departments: 0, completedTasks: 0 }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { employees: 0, tasks: 0, departments: 0, completedTasks: 0 }

  const teamId = profile.team_id

  const [employeeCount, taskCount, departmentCount, completedCount] = await Promise.all([
    db.collection('employees').countDocuments({ team_id: teamId }),
    db.collection('tasks').countDocuments({ team_id: teamId }),
    db.collection('departments').countDocuments({ team_id: teamId }),
    db.collection('tasks').countDocuments({ team_id: teamId, status: 'COMPLETED' }),
  ])

  return { employees: employeeCount, tasks: taskCount, departments: departmentCount, completedTasks: completedCount }
}

export async function getEmployees() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  const employees = await db.collection('employees')
    .find({ team_id: profile.team_id })
    .sort({ created_at: -1 })
    .toArray()

  const enriched = await Promise.all(employees.map(async (emp) => {
    const empProfile = await db.collection('profiles').findOne({ user_id: emp.profile_id })
    const department = emp.department_id ? await db.collection('departments').findOne({ _id: new ObjectId(emp.department_id) }) : null
    const manager = emp.manager_id ? await db.collection('profiles').findOne({ user_id: emp.manager_id }) : null

    return {
      ...emp,
      _id: emp._id.toString(),
      id: emp._id.toString(),
      profile: empProfile ? { id: empProfile.user_id, first_name: empProfile.first_name, last_name: empProfile.last_name, email: empProfile.email, role: empProfile.role } : null,
      department: department ? { id: department._id.toString(), name: department.name } : null,
      manager: manager ? { id: manager.user_id, first_name: manager.first_name, last_name: manager.last_name } : null,
    }
  }))

  return enriched
}

export async function getDepartments() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  const departments = await db.collection('departments')
    .find({ team_id: profile.team_id })
    .sort({ created_at: -1 })
    .toArray()

  const enriched = await Promise.all(departments.map(async (dept) => {
    const manager = dept.manager_id ? await db.collection('profiles').findOne({ user_id: dept.manager_id }) : null
    return {
      ...dept,
      _id: dept._id.toString(),
      id: dept._id.toString(),
      manager: manager ? { id: manager.user_id, first_name: manager.first_name, last_name: manager.last_name } : null,
    }
  }))

  return enriched
}

export async function getTasks(filterDept?: string) {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  const query: any = { team_id: profile.team_id }
  if (filterDept) query.department_id = filterDept

  const tasks = await db.collection('tasks')
    .find(query)
    .sort({ created_at: -1 })
    .toArray()

  const enriched = await Promise.all(tasks.map(async (task) => {
    const department = task.department_id ? await db.collection('departments').findOne({ _id: new ObjectId(task.department_id) }) : null
    const assignee = task.assignee_id ? await db.collection('profiles').findOne({ user_id: task.assignee_id }) : null
    return {
      ...task,
      _id: task._id.toString(),
      id: task._id.toString(),
      department: department ? { id: department._id.toString(), name: department.name } : null,
      assignee: assignee ? { id: assignee.user_id, first_name: assignee.first_name, last_name: assignee.last_name, email: assignee.email } : null,
    }
  }))

  return enriched
}

export async function getProfiles() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  const profiles = await db.collection('profiles')
    .find({ team_id: profile.team_id })
    .sort({ created_at: -1 })
    .toArray()

  return profiles.map(p => ({
    ...p,
    _id: p._id.toString(),
    id: p.user_id,
  }))
}

export async function getManagerProfiles(): Promise<Record<string, any>[]> {
  const profiles = await getProfiles()
  return profiles.filter((p: Record<string, any>) => p.role === 'MANAGER' || p.role === 'ADMIN')
}

export async function getAllProfiles() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()

  const profiles = await db.collection('profiles')
    .find({})
    .toArray()

  return profiles.map(p => ({
    ...p,
    _id: p._id.toString(),
    id: p.user_id,
  }))
}

export async function getTeamMembers() {
  const session = await getSessionFromCookies()
  if (!session) return []

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return []

  const members = await db.collection('profiles')
    .find({ team_id: profile.team_id })
    .toArray()

  return members.map(m => ({
    ...m,
    _id: m._id.toString(),
    id: m.user_id,
  }))
}

export async function getTeam() {
  const session = await getSessionFromCookies()
  if (!session) return null

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return null

  const team = await db.collection('teams').findOne({ _id: new ObjectId(profile.team_id) })
  if (!team) return null

  return {
    id: team._id.toString(),
    name: team.name,
    owner_id: team.owner_id,
  }
}

export async function createEmployee(data: any) {
  const auth = await requirePermission('employees.create')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()

  await db.collection('employees').insertOne({
    ...data,
    team_id: auth.profile.team_id,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true }
}

export async function updateEmployee(id: string, data: any) {
  const auth = await requirePermission('employees.edit')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('employees').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } }
  )
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const auth = await requirePermission('employees.delete')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('employees').deleteOne({ _id: new ObjectId(id) })
  return { success: true }
}

export async function createDepartment(data: any) {
  const auth = await requirePermission('departments.create')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()

  await db.collection('departments').insertOne({
    ...data,
    team_id: auth.profile.team_id,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true }
}

export async function updateDepartment(id: string, data: any) {
  const auth = await requirePermission('departments.edit')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('departments').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } }
  )
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const auth = await requirePermission('departments.delete')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('departments').deleteOne({ _id: new ObjectId(id) })
  return { success: true }
}

export async function createTask(data: any) {
  const auth = await requirePermission('tasks.create')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()

  await db.collection('tasks').insertOne({
    ...data,
    team_id: auth.profile.team_id,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true }
}

export async function updateTask(id: string, data: any) {
  const auth = await requirePermission('tasks.edit')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('tasks').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } }
  )
  return { success: true }
}

export async function deleteTask(id: string) {
  const auth = await requirePermission('tasks.delete')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()
  await db.collection('tasks').deleteOne({ _id: new ObjectId(id) })
  return { success: true }
}

export async function removeFromTeam(memberId: string) {
  const auth = await requirePermission('members.remove')
  if (!auth.ok) return { error: auth.error }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: memberId })
  const currentTeamId = profile?.team_id

  await db.collection('team_members').deleteMany({ user_id: memberId, team_id: currentTeamId })

  if (auth.profile.user_id === memberId) {
    const nextMembership = await db.collection('team_members').findOne({ user_id: memberId })
    if (nextMembership) {
      const nextRole = nextMembership.role || 'EMPLOYEE'
      await db.collection('profiles').updateOne(
        { user_id: memberId },
        { $set: { team_id: nextMembership.team_id, role: nextRole, updated_at: new Date() } }
      )
    } else {
      await db.collection('profiles').updateOne(
        { user_id: memberId },
        { $set: { team_id: null, role: 'EMPLOYEE', updated_at: new Date() } }
      )
    }
  } else {
    await db.collection('profiles').updateOne(
      { user_id: memberId },
      { $set: { team_id: null, role: 'EMPLOYEE', updated_at: new Date() } }
    )
  }

  return { success: true }
}

export async function leaveTeam() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'Not in any team' }

  const currentTeamId = profile.team_id

  await db.collection('team_members').deleteMany({ user_id: session.userId, team_id: currentTeamId })

  const nextMembership = await db.collection('team_members').findOne({ user_id: session.userId })
  if (nextMembership) {
    const nextRole = nextMembership.role || 'EMPLOYEE'
    await db.collection('profiles').updateOne(
      { user_id: session.userId },
      { $set: { team_id: nextMembership.team_id, role: nextRole, updated_at: new Date() } }
    )
  } else {
    await db.collection('profiles').updateOne(
      { user_id: session.userId },
      { $set: { team_id: null, role: 'EMPLOYEE', updated_at: new Date() } }
    )
  }

  return { success: true }
}
