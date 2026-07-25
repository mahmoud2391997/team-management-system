import { getDashboardStats, getTasks } from '@/lib/actions/data-actions'
import { Card } from '@/components/ui/card'
import { isError } from '@/lib/utils/async-helpers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | Team Management',
  description: 'Team management dashboard with statistics and recent activity',
}

export default async function DashboardPage() {
  const [statsResult, tasksResult] = await Promise.all([
    getDashboardStats(),
    getTasks(),
  ])

  const stats = isError(statsResult) ? { employees: 0, tasks: 0, departments: 0, completedTasks: 0 } : statsResult.data
  const allTasks = isError(tasksResult) ? [] : tasksResult.data

  const completionRate =
    stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0

  // Get recent tasks (last 5, sorted by most recent)
  const recentTasks = allTasks.slice(-5).reverse()

  // Calculate task statistics by status
  const todoTasks = allTasks.filter(t => t.status === 'TODO').length
  const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length
  const reviewTasks = allTasks.filter(t => t.status === 'REVIEW').length

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your team.
        </p>
      </div>

      {/* Key Metrics */}
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

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">To Do</h3>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{todoTasks}</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: stats.tasks > 0 ? `${(todoTasks / stats.tasks) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.tasks > 0 ? Math.round((todoTasks / stats.tasks) * 100) : 0}% of total tasks
          </p>
        </Card>

        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">In Progress</h3>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{inProgressTasks}</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: stats.tasks > 0 ? `${(inProgressTasks / stats.tasks) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.tasks > 0 ? Math.round((inProgressTasks / stats.tasks) * 100) : 0}% of total tasks
          </p>
        </Card>

        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Completed</h3>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{stats.completedTasks}</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: stats.tasks > 0 ? `${(stats.completedTasks / stats.tasks) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0}% of total tasks
          </p>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="p-6 border border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Recent Tasks</h2>
          <Link href="/tasks">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        
        {recentTasks.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No tasks yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        task.priority === 'URGENT' ? 'bg-red-100 text-red-800'
                        : task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800'
                        : task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-800'
                        : task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800'
                        : task.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.assignee && (
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{task.assignee.first_name || task.assignee.email}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Getting Started */}
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
