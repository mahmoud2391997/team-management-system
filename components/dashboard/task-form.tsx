'use client'

import { useState, useEffect } from 'react'
import { createTask, updateTask, getEmployees } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Task } from '@/lib/types'

export default function TaskForm({
  task,
  departments,
  onClose,
}: {
  task?: Task | null
  departments: any[]
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [assignees, setAssignees] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'TODO',
    department_id: task?.department_id ?? '',
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
  })

  const isEditing = !!task

  useEffect(() => {
    getEmployees().then((result) => {
      if (!result.error) setAllEmployees(result.data)
    })
  }, [])

  useEffect(() => {
    if (formData.department_id) {
      const deptEmployees = allEmployees
        .filter((e) => e.department_id === formData.department_id && e.profile)
        .map((e) => e.profile)
      if (isEditing && task?.assignee_id) {
        const currentAssignee = allEmployees.find((e) => e.profile_id === task.assignee_id)
        if (currentAssignee?.profile && !deptEmployees.find((p: any) => p.id === task.assignee_id)) {
          deptEmployees.unshift(currentAssignee.profile)
        }
      }
      setAssignees(deptEmployees)
    } else {
      const all = allEmployees.filter((e) => e.profile).map((e) => e.profile)
      if (isEditing && task?.assignee_id) {
        const currentAssignee = allEmployees.find((e) => e.profile_id === task.assignee_id)
        if (currentAssignee?.profile && !all.find((p: any) => p.id === task.assignee_id)) {
          all.unshift(currentAssignee.profile)
        }
      }
      setAssignees(all)
    }
  }, [formData.department_id, allEmployees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: formData.status,
      department_id: formData.department_id || null,
      assignee_id: formData.assignee_id || null,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    }

    const result = isEditing
      ? await updateTask(task.id, payload)
      : await createTask(payload)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onClose()
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Task' : 'Add Task'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                disabled={!formData.department_id}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!formData.department_id
                  ? <option value="">Select a department first</option>
                  : <option value="">Unassigned</option>
                }
                {assignees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name || p.last_name ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : p.email} ({p.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Task')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
