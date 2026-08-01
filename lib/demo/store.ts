const TEAM_ID = 'team-demo'
const ADMIN_ID = 'u-admin'

export const DEMO_USER = { id: ADMIN_ID, email: 'freelancing589@gmail.com' }

function iso(daysAgo: number = 0, hoursAgo: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function isoFuture(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

function hashFor(password: string): string {
  return `$2a$12$demo${password}${'0'.repeat(40)}`
}

const PROFILE_FIELDS = {
  created_at: iso(120),
  updated_at: iso(2),
}

const db: Record<string, any[]> = {
  Team: [
    {
      id: TEAM_ID,
      name: 'Acme Labs',
      owner_id: ADMIN_ID,
      created_at: iso(120),
      updated_at: iso(2),
    },
  ],

  users: [
    { id: ADMIN_ID, email: 'freelancing589@gmail.com', password_hash: hashFor('demo1234'), created_at: iso(120) },
    { id: 'u-mgr-eng', email: 'omar.khan@demo.com', password_hash: hashFor('demo1234'), created_at: iso(110) },
    { id: 'u-mgr-design', email: 'lina.hassan@demo.com', password_hash: hashFor('demo1234'), created_at: iso(108) },
    { id: 'u-mgr-mkt', email: 'nadia.ali@demo.com', password_hash: hashFor('demo1234'), created_at: iso(105) },
    { id: 'u-emp-e1', email: 'adam.smith@demo.com', password_hash: hashFor('demo1234'), created_at: iso(100) },
    { id: 'u-emp-e2', email: 'emma.jones@demo.com', password_hash: hashFor('demo1234'), created_at: iso(98) },
    { id: 'u-emp-e3', email: 'liam.brown@demo.com', password_hash: hashFor('demo1234'), created_at: iso(95) },
    { id: 'u-emp-d1', email: 'mia.garcia@demo.com', password_hash: hashFor('demo1234'), created_at: iso(90) },
    { id: 'u-emp-d2', email: 'noah.wilson@demo.com', password_hash: hashFor('demo1234'), created_at: iso(88) },
    { id: 'u-emp-m1', email: 'ava.martinez@demo.com', password_hash: hashFor('demo1234'), created_at: iso(85) },
    { id: 'u-emp-m2', email: 'ethan.taylor@demo.com', password_hash: hashFor('demo1234'), created_at: iso(82) },
    { id: 'u-emp-h1', email: 'sophia.davis@demo.com', password_hash: hashFor('demo1234'), created_at: iso(80) },
  ],

  profiles: [
    { id: ADMIN_ID, email: 'freelancing589@gmail.com', first_name: 'Sara', last_name: 'Miller', role: 'ADMIN', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-mgr-eng', email: 'omar.khan@demo.com', first_name: 'Omar', last_name: 'Khan', role: 'MANAGER', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-mgr-design', email: 'lina.hassan@demo.com', first_name: 'Lina', last_name: 'Hassan', role: 'MANAGER', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-mgr-mkt', email: 'nadia.ali@demo.com', first_name: 'Nadia', last_name: 'Ali', role: 'MANAGER', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-e1', email: 'adam.smith@demo.com', first_name: 'Adam', last_name: 'Smith', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-e2', email: 'emma.jones@demo.com', first_name: 'Emma', last_name: 'Jones', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-e3', email: 'liam.brown@demo.com', first_name: 'Liam', last_name: 'Brown', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-d1', email: 'mia.garcia@demo.com', first_name: 'Mia', last_name: 'Garcia', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-d2', email: 'noah.wilson@demo.com', first_name: 'Noah', last_name: 'Wilson', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-m1', email: 'ava.martinez@demo.com', first_name: 'Ava', last_name: 'Martinez', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-m2', email: 'ethan.taylor@demo.com', first_name: 'Ethan', last_name: 'Taylor', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
    { id: 'u-emp-h1', email: 'sophia.davis@demo.com', first_name: 'Sophia', last_name: 'Davis', role: 'EMPLOYEE', team_id: TEAM_ID, ...PROFILE_FIELDS },
  ],

  team_members: [
    { id: 'tm-admin', user_id: ADMIN_ID, team_id: TEAM_ID, role: 'ADMIN', is_active: true, created_at: iso(120), updated_at: iso(2) },
    { id: 'tm-mgr-eng', user_id: 'u-mgr-eng', team_id: TEAM_ID, role: 'MANAGER', is_active: true, created_at: iso(110), updated_at: iso(2) },
    { id: 'tm-mgr-design', user_id: 'u-mgr-design', team_id: TEAM_ID, role: 'MANAGER', is_active: true, created_at: iso(108), updated_at: iso(2) },
    { id: 'tm-mgr-mkt', user_id: 'u-mgr-mkt', team_id: TEAM_ID, role: 'MANAGER', is_active: true, created_at: iso(105), updated_at: iso(2) },
    { id: 'tm-e1', user_id: 'u-emp-e1', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(100), updated_at: iso(2) },
    { id: 'tm-e2', user_id: 'u-emp-e2', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(98), updated_at: iso(2) },
    { id: 'tm-e3', user_id: 'u-emp-e3', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(95), updated_at: iso(2) },
    { id: 'tm-d1', user_id: 'u-emp-d1', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(90), updated_at: iso(2) },
    { id: 'tm-d2', user_id: 'u-emp-d2', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(88), updated_at: iso(2) },
    { id: 'tm-m1', user_id: 'u-emp-m1', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(85), updated_at: iso(2) },
    { id: 'tm-m2', user_id: 'u-emp-m2', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(82), updated_at: iso(2) },
    { id: 'tm-h1', user_id: 'u-emp-h1', team_id: TEAM_ID, role: 'EMPLOYEE', is_active: true, created_at: iso(80), updated_at: iso(2) },
  ],

  departments: [
    { id: 'dept-eng', name: 'Engineering', description: 'Builds and maintains the product.', manager_id: 'u-mgr-eng', team_id: TEAM_ID, created_at: iso(100), updated_at: iso(3) },
    { id: 'dept-design', name: 'Design', description: 'Owns UX, UI and brand.', manager_id: 'u-mgr-design', team_id: TEAM_ID, created_at: iso(98), updated_at: iso(3) },
    { id: 'dept-mkt', name: 'Marketing', description: 'Grows awareness and demand.', manager_id: 'u-mgr-mkt', team_id: TEAM_ID, created_at: iso(95), updated_at: iso(3) },
    { id: 'dept-hr', name: 'People Ops', description: 'Supports hiring and culture.', manager_id: ADMIN_ID, team_id: TEAM_ID, created_at: iso(90), updated_at: iso(3) },
  ],

  employees: [
    { id: 'emp-admin', profile_id: ADMIN_ID, department_id: 'dept-hr', manager_id: null, position: 'Operations Manager', join_date: iso(365), salary: 120000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(365), updated_at: iso(2) },
    { id: 'emp-e1', profile_id: 'u-emp-e1', department_id: 'dept-eng', manager_id: 'u-mgr-eng', position: 'Frontend Engineer', join_date: iso(300), salary: 85000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(300), updated_at: iso(2) },
    { id: 'emp-e2', profile_id: 'u-emp-e2', department_id: 'dept-eng', manager_id: 'u-mgr-eng', position: 'Backend Engineer', join_date: iso(250), salary: 90000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(250), updated_at: iso(2) },
    { id: 'emp-e3', profile_id: 'u-emp-e3', department_id: 'dept-eng', manager_id: 'u-mgr-eng', position: 'DevOps Engineer', join_date: iso(200), salary: 95000, status: 'ON_LEAVE', team_id: TEAM_ID, created_at: iso(200), updated_at: iso(2) },
    { id: 'emp-d1', profile_id: 'u-emp-d1', department_id: 'dept-design', manager_id: 'u-mgr-design', position: 'UI Designer', join_date: iso(180), salary: 70000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(180), updated_at: iso(2) },
    { id: 'emp-d2', profile_id: 'u-emp-d2', department_id: 'dept-design', manager_id: 'u-mgr-design', position: 'UX Researcher', join_date: iso(160), salary: 72000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(160), updated_at: iso(2) },
    { id: 'emp-m1', profile_id: 'u-emp-m1', department_id: 'dept-mkt', manager_id: 'u-mgr-mkt', position: 'Marketing Specialist', join_date: iso(140), salary: 65000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(140), updated_at: iso(2) },
    { id: 'emp-m2', profile_id: 'u-emp-m2', department_id: 'dept-mkt', manager_id: 'u-mgr-mkt', position: 'Content Writer', join_date: iso(120), salary: 62000, status: 'INACTIVE', team_id: TEAM_ID, created_at: iso(120), updated_at: iso(2) },
    { id: 'emp-h1', profile_id: 'u-emp-h1', department_id: 'dept-hr', manager_id: ADMIN_ID, position: 'HR Coordinator', join_date: iso(100), salary: 60000, status: 'ACTIVE', team_id: TEAM_ID, created_at: iso(100), updated_at: iso(2) },
  ],

  tasks: [
    { id: 'task-1', title: 'Ship onboarding revamp', description: 'Redesign the new-hire onboarding flow end to end.', status: 'IN_PROGRESS', priority: 'HIGH', department_id: 'dept-design', assignee_id: 'u-emp-d1', created_by: ADMIN_ID, due_date: isoFuture(5), team_id: TEAM_ID, created_at: iso(2), updated_at: iso(1) },
    { id: 'task-2', title: 'Fix auth token refresh bug', description: 'Users get logged out randomly; reproduce and fix.', status: 'TODO', priority: 'URGENT', department_id: 'dept-eng', assignee_id: 'u-emp-e2', created_by: 'u-mgr-eng', due_date: isoFuture(2), team_id: TEAM_ID, created_at: iso(1), updated_at: iso(0, 5) },
    { id: 'task-3', title: 'Q3 marketing campaign', description: 'Plan and launch the Q3 demand generation campaign.', status: 'IN_PROGRESS', priority: 'MEDIUM', department_id: 'dept-mkt', assignee_id: 'u-emp-m1', created_by: 'u-mgr-mkt', due_date: isoFuture(10), team_id: TEAM_ID, created_at: iso(4), updated_at: iso(1) },
    { id: 'task-4', title: 'Migrate CI to new runner', description: 'Move builds from the legacy runner to the new stack.', status: 'REVIEW', priority: 'MEDIUM', department_id: 'dept-eng', assignee_id: 'u-emp-e3', created_by: 'u-mgr-eng', due_date: isoFuture(3), team_id: TEAM_ID, created_at: iso(3), updated_at: iso(0, 10) },
    { id: 'task-5', title: 'Prepare hiring plan', description: 'Draft headcount plan for the next two quarters.', status: 'COMPLETED', priority: 'LOW', department_id: 'dept-hr', assignee_id: 'u-emp-h1', created_by: ADMIN_ID, due_date: iso(1), team_id: TEAM_ID, created_at: iso(10), updated_at: iso(1) },
    { id: 'task-6', title: 'Refresh design system', description: 'Update color tokens and component variants.', status: 'TODO', priority: 'HIGH', department_id: 'dept-design', assignee_id: 'u-emp-d2', created_by: 'u-mgr-design', due_date: isoFuture(7), team_id: TEAM_ID, created_at: iso(2, 5), updated_at: iso(2) },
    { id: 'task-7', title: 'API rate limiting', description: 'Add rate limiting to public endpoints.', status: 'IN_PROGRESS', priority: 'HIGH', department_id: 'dept-eng', assignee_id: 'u-emp-e2', created_by: ADMIN_ID, due_date: isoFuture(6), team_id: TEAM_ID, created_at: iso(5), updated_at: iso(1) },
    { id: 'task-8', title: 'Customer story video', description: 'Produce a testimonial video with the design team.', status: 'TODO', priority: 'MEDIUM', department_id: 'dept-mkt', assignee_id: 'u-emp-m1', created_by: ADMIN_ID, due_date: isoFuture(12), team_id: TEAM_ID, created_at: iso(6), updated_at: iso(3) },
    { id: 'task-9', title: 'Add employee self-serve portal', description: 'Let employees update their own profile details.', status: 'REVIEW', priority: 'MEDIUM', department_id: 'dept-eng', assignee_id: 'u-emp-e1', created_by: ADMIN_ID, due_date: isoFuture(4), team_id: TEAM_ID, created_at: iso(7), updated_at: iso(0, 8) },
    { id: 'task-10', title: 'Review benefits package', description: 'Benchmark benefits against market rates.', status: 'COMPLETED', priority: 'LOW', department_id: 'dept-hr', assignee_id: ADMIN_ID, created_by: ADMIN_ID, due_date: iso(3), team_id: TEAM_ID, created_at: iso(12), updated_at: iso(3) },
    { id: 'task-11', title: 'Landing page A/B test', description: 'Run an A/B test on the hero section copy.', status: 'TODO', priority: 'LOW', department_id: 'dept-design', assignee_id: 'u-emp-d1', created_by: 'u-mgr-design', due_date: isoFuture(9), team_id: TEAM_ID, created_at: iso(3, 2), updated_at: iso(2, 6) },
    { id: 'task-12', title: 'Data backup audit', description: 'Verify backup schedules and restore drills.', status: 'COMPLETED', priority: 'MEDIUM', department_id: 'dept-eng', assignee_id: 'u-emp-e3', created_by: 'u-mgr-eng', due_date: iso(2), team_id: TEAM_ID, created_at: iso(14), updated_at: iso(2) },
  ],

  notifications: [
    { id: 'notif-1', user_id: ADMIN_ID, type: 'task_status_changed', title: 'Task Status Updated', message: 'Omar Khan changed "Fix auth token refresh bug" to In Progress', data: { task_id: 'task-2', changed_by: 'u-mgr-eng', new_status: 'IN_PROGRESS' }, read: false, team_id: TEAM_ID, created_at: iso(0, 5), updated_at: iso(0, 5) },
    { id: 'notif-2', user_id: ADMIN_ID, type: 'task_assigned', title: 'Task Assigned', message: 'Lina Hassan assigned you a task: Review benefits package', data: { task_id: 'task-10', assigned_by: 'u-mgr-design' }, read: true, team_id: TEAM_ID, created_at: iso(2), updated_at: iso(2) },
  ],

  invitations: [
    { id: 'invite-1', team_id: TEAM_ID, email: 'new.join@demo.com', role: 'EMPLOYEE', invited_by: ADMIN_ID, accepted_at: null, created_at: iso(2), updated_at: iso(2) },
  ],

  roles: [
    { id: 'role-qa', team_id: TEAM_ID, name: 'QA', label: 'Quality Assurance', permissions: ['tasks.view', 'tasks.create', 'tasks.edit', 'employees.view', 'dashboard.view'], created_at: iso(40), updated_at: iso(5) },
  ],

  subtasks: [],
  comments: [],
}

export function getTableRows(name: string): any[] {
  if (!db[name]) db[name] = []
  return db[name]
}

export function getDb(): Record<string, any[]> {
  return db
}

export { TEAM_ID }
