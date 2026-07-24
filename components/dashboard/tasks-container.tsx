'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import TaskForm from '@/components/dashboard/task-form'
import { GripVertical } from 'lucide-react'
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
  const [tasks, setTasks] = useState(initialTasks)
  const [departments] = useState(initialDepartments)
  const [filterDept, setFilterDept] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filteredTasks = tasks.filter(task => !filterDept || task.department_id === filterDept)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(taskId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    setDraggedId(null)
    setDragOverColumn(null)

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === columnId) return

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: columnId } : t))

    const { updateTask } = await import('@/lib/actions/data-actions')
    await updateTask(taskId, { status: columnId })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    const { deleteTask } = await import('@/lib/actions/data-actions')
    await deleteTask(taskId)
  }

  const handleCloseForm = async () => {
    setShowForm(false)
    setEditingTask(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <TaskForm
          task={editingTask}
          departments={departments}
          onClose={handleCloseForm}
        />
      )}

      <div className="flex gap-4 items-center justify-between">
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
        <Button onClick={() => { setEditingTask(null); setShowForm(true) }}>+ Add Task</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.status === column.id)
          const isOver = dragOverColumn === column.id
          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`${column.color} rounded-lg p-4 min-h-96 transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <h3 className="font-semibold text-foreground mb-4">
                {column.label}
                <span className="text-muted-foreground ml-2">
                  ({columnTasks.length})
                </span>
              </h3>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 bg-card border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedId === task.id ? 'opacity-40' : ''}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 cursor-grab" />
                        <h4 className="font-semibold text-foreground text-sm flex-1">
                          {task.title}
                        </h4>
                      </div>
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
                        {task.department && (
                          <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                            {task.department.name}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                            {task.assignee.first_name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(task)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(task.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
