import { Suspense } from 'react'
import { getTasks, getDepartments, getProfile } from '@/lib/actions/data-actions'
import TasksContainer from '@/components/dashboard/tasks-container'
import { KanbanSkeleton } from '@/components/ui/skeleton'
import { isError } from '@/lib/utils/async-helpers'

export const metadata = {
  title: 'Tasks | Team Management',
  description: 'Manage and track team tasks',
}

async function TasksContent() {
  const [tasksResult, departmentsResult, profileResult] = await Promise.all([
    getTasks(),
    getDepartments(),
    getProfile(),
  ])

  const tasks = isError(tasksResult) ? [] : tasksResult.data
  const departments = isError(departmentsResult) ? [] : departmentsResult.data
  const currentUserId = profileResult?.id || ''

  return (
    <TasksContainer
      initialTasks={tasks}
      initialDepartments={departments}
      currentUserId={currentUserId}
    />
  )
}

export default function TasksPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-2">Manage and track team tasks</p>
      </div>

      <Suspense fallback={<KanbanSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  )
}
