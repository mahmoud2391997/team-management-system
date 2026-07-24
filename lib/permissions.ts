export const ALL_PERMISSIONS = [
  'dashboard.view',
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.delete',
  'departments.view',
  'departments.create',
  'departments.edit',
  'departments.delete',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.delete',
  'tasks.assign',
  'members.view',
  'members.invite',
  'members.remove',
  'members.assign_role',
  'roles.manage',
  'settings.manage',
  'team.delete',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const DEFAULT_ROLES: Record<string, { label: string; permissions: Permission[] }> = {
  ADMIN: {
    label: 'Administrator',
    permissions: [...ALL_PERMISSIONS],
  },
  MANAGER: {
    label: 'Manager',
    permissions: [
      'dashboard.view',
      'employees.view',
      'employees.create',
      'employees.edit',
      'departments.view',
      'departments.create',
      'departments.edit',
      'tasks.view',
      'tasks.create',
      'tasks.edit',
      'tasks.delete',
      'tasks.assign',
      'members.view',
      'roles.manage',
    ],
  },
  EMPLOYEE: {
    label: 'Employee',
    permissions: [
      'dashboard.view',
      'tasks.view',
      'employees.view',
      'departments.view',
      'members.view',
    ],
  },
}

export function permissionLabel(perm: Permission): string {
  const labels: Record<string, string> = {
    'dashboard.view': 'View Dashboard',
    'employees.view': 'View Employees',
    'employees.create': 'Create Employees',
    'employees.edit': 'Edit Employees',
    'employees.delete': 'Delete Employees',
    'departments.view': 'View Departments',
    'departments.create': 'Create Departments',
    'departments.edit': 'Edit Departments',
    'departments.delete': 'Delete Departments',
    'tasks.view': 'View Tasks',
    'tasks.create': 'Create Tasks',
    'tasks.edit': 'Edit Tasks',
    'tasks.delete': 'Delete Tasks',
    'tasks.assign': 'Assign Tasks',
    'members.view': 'View Members',
    'members.invite': 'Invite Members',
    'members.remove': 'Remove Members',
    'members.assign_role': 'Assign Roles to Members',
    'roles.manage': 'Manage Roles',
    'settings.manage': 'Manage Settings',
    'team.delete': 'Delete Team',
  }
  return labels[perm] || perm
}

export function permissionGroup(perm: Permission): string {
  if (perm.startsWith('employees.')) return 'Employees'
  if (perm.startsWith('departments.')) return 'Departments'
  if (perm.startsWith('tasks.')) return 'Tasks'
  if (perm.startsWith('members.')) return 'Members'
  if (perm.startsWith('roles.')) return 'Roles'
  if (perm.startsWith('settings.')) return 'Settings'
  if (perm.startsWith('team.')) return 'Team'
  if (perm.startsWith('dashboard.')) return 'Dashboard'
  return 'Other'
}
