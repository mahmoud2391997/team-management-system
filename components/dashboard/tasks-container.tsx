'use client'

import { useState } from 'react'
import { useTasks, useDepartments } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KanbanSkeleton } from '@/components/ui/skeleton'
import type { Task, Department } from '@/lib/types'

const statusColumns = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'REVIEW', label: 'Review', color: 'bg-yellow-100' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
]

interface TasksContainerProps {
  initialTasks: Task[]
  initialDepartments: Department[]
}

export default function TasksContainer({
  initialTasks,
  initialDepartments,
}: TasksContainerProps) {
  const { tasks = initialTasks, loading, refetch } = useTasks({ autoFetch: false })
  const { departments = initialDepartments } = useDepartments({ autoFetch: false })
  
  const [filterDept, setFilterDept] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const filteredTasks = tasks.filter(task => {
    if (!filterDept) return true
    return task.department_id === filterDept
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTaskUpdate = async () => {
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <KanbanSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {statusColumns.map((column) => (
            <div
              key={column.id}
              className={`${column.color} rounded-lg p-4 min-h-96`}
            >
              <h3 className="font-semibold text-foreground mb-4">
                {column.label}
                <span className="text-muted-foreground ml-2">
                  ({filteredTasks.filter((t) => t.status === column.id).length})
                </span>
              </h3>
              <div className="space-y-3">
                {filteredTasks
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 bg-card border border-border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground text-sm">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">
                            {task.description.substring(0, 50)}...
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          {task.assignee && (
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {task.assignee.first_name}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task)
                              setShowForm(true)
                            }}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1">
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
