import { getTasks, getDepartments } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import TasksContainer from '@/components/dashboard/tasks-container'
import { isError } from '@/lib/utils/async-helpers'

export const metadata = {
  title: 'Tasks | Team Management',
  description: 'Manage and track team tasks',
}

export default async function TasksPage() {
  // Fetch data on the server
  const [tasksResult, departmentsResult] = await Promise.all([
    getTasks(),
    getDepartments(),
  ])

  const tasks = isError(tasksResult) ? [] : tasksResult.data
  const departments = isError(departmentsResult) ? [] : departmentsResult.data

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage and track team tasks</p>
        </div>
        <Button>+ Add Task</Button>
      </div>

      <TasksContainer
        initialTasks={tasks}
        initialDepartments={departments}
      />
    </div>
  )
}
