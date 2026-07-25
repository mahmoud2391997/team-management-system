// Entity Types
export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  team_id: string | null
  created_at: Date
  updated_at: Date
}

export interface Employee {
  id: string
  profile_id: string
  department_id: string | null
  manager_id: string | null
  position: string
  hire_date: Date
  salary: number
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  team_id: string
  created_at: Date
  updated_at: Date
  // Enriched fields
  profile?: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  }
  department?: {
    id: string
    name: string
  }
  manager?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface Department {
  id: string
  name: string
  description?: string
  manager_id?: string
  team_id: string
  created_at: Date
  updated_at: Date
  // Enriched fields
  manager?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  department_id: string
  assignee_id?: string
  created_by?: string
  due_date?: Date
  team_id: string
  created_at: Date
  updated_at: Date
  // Enriched fields
  department?: {
    id: string
    name: string
  }
  assignee?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  creator?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface Team {
  id: string
  name: string
  owner_id: string
  created_at: Date
  updated_at: Date
}

export interface DashboardStats {
  employees: number
  tasks: number
  departments: number
  completedTasks: number
}

// Server Action Response Types
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ActionSuccess<T> = { success: true; data: T }
export type ActionError = { success: false; error: string }

// Permission Types
export type Permission =
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'departments.view'
  | 'departments.create'
  | 'departments.edit'
  | 'departments.delete'
  | 'tasks.view'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'tasks.assign'
  | 'members.view'
  | 'members.invite'
  | 'members.remove'
  | 'members.assign_role'
  | 'roles.manage'
  | 'settings.manage'
  | 'team.delete'

// Input Types for mutations
export interface EmployeeInput {
  profile_id: string
  department_id?: string
  manager_id?: string
  position: string
  hire_date: Date
  salary: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
}

export interface DepartmentInput {
  name: string
  description?: string
  manager_id?: string
}

export interface TaskInput {
  title: string
  description?: string
  department_id: string
  assignee_id?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  due_date?: Date
}

// Filter & Query Types
export interface EmployeeFilters {
  search?: string
  departmentId?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
}

export interface TaskFilters {
  status?: string
  departmentId?: string
  assigneeId?: string
  priority?: string
}

export interface DepartmentFilters {
  search?: string
}
