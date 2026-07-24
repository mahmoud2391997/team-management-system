import { getDashboardStats } from '@/lib/actions/data-actions'
import { Card } from '@/components/ui/card'
import { isError } from '@/lib/utils/async-helpers'

export default async function DashboardPage() {
  const result = await getDashboardStats()
  const stats = isError(result) ? { employees: 0, tasks: 0, departments: 0, completedTasks: 0 } : result.data

  const completionRate =
    stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Total Employees</div>
          <div className="text-3xl font-bold text-foreground mt-2">{stats.employees}</div>
          <p className="text-xs text-muted-foreground mt-2">Active staff members</p>
        </Card>

        <Card className="p-6 border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Departments</div>
          <div className="text-3xl font-bold text-foreground mt-2">{stats.departments}</div>
          <p className="text-xs text-muted-foreground mt-2">Organization units</p>
        </Card>

        <Card className="p-6 border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
          <div className="text-3xl font-bold text-foreground mt-2">{stats.tasks}</div>
          <p className="text-xs text-muted-foreground mt-2">Across all departments</p>
        </Card>

        <Card className="p-6 border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Completion Rate</div>
          <div className="text-3xl font-bold text-foreground mt-2">{completionRate}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedTasks} of {stats.tasks} completed
          </p>
        </Card>
      </div>

      <Card className="p-8 border border-border bg-card">
        <h2 className="text-2xl font-bold text-foreground mb-4">Getting Started</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">1. Create Departments</div>
            <p className="text-sm text-muted-foreground">
              Set up your organizational structure by creating departments and assigning managers.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">2. Add Employees</div>
            <p className="text-sm text-muted-foreground">
              Add team members to departments and set their roles and positions.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">3. Create Tasks</div>
            <p className="text-sm text-muted-foreground">
              Assign tasks to employees and track progress using the Kanban board.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
