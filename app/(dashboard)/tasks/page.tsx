'use client'

import { useEffect, useState } from 'react'
import { getTasks, getDepartments, getProfiles, createTask, updateTask, deleteTask } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const statusColumns = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'REVIEW', label: 'Review', color: 'bg-yellow-100' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [filterDept, setFilterDept] = useState('')
  const [formData, setFormData] = useState({
    title: '', description: '', department_id: '', assignee_id: '', status: 'TODO', priority: 'MEDIUM', due_date: '',
  })

  useEffect(() => {
    fetchTasks()
    fetchDepartments()
    fetchProfiles()
  }, [filterDept])

  const fetchTasks = async () => {
    setLoading(true)
    const data = await getTasks(filterDept || undefined)
    setTasks(data)
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const data = await getDepartments()
    setDepartments(data)
  }

  const fetchProfiles = async () => {
    const data = await getProfiles()
    setProfiles(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskData = {
      title: formData.title,
      description: formData.description,
      department_id: formData.department_id,
      assignee_id: formData.assignee_id || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date ? new Date(formData.due_date) : null,
    }

    if (editingTask) {
      await updateTask(editingTask.id, taskData)
    } else {
      await createTask(taskData)
    }

    setShowForm(false)
    setEditingTask(null)
    setFormData({ title: '', description: '', department_id: '', assignee_id: '', status: 'TODO', priority: 'MEDIUM', due_date: '' })
    fetchTasks()
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status: newStatus })
    fetchTasks()
  }

  const handleEdit = (task: any) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      department_id: task.department_id,
      assignee_id: task.assignee_id || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id)
      fetchTasks()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage and track team tasks</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Task</Button>
      </div>

      {showForm && (
        <Card className="p-6 border border-border bg-card mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Task Title</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter task description" className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Department</label>
                <select required value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option value="">Select a department...</option>
                  {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assign To</label>
                <select value={formData.assignee_id} onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option value="">Unassigned</option>
                  {profiles.map((profile) => (<option key={profile.id} value={profile.id}>{profile.first_name} {profile.last_name}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                  {statusColumns.map((col) => (<option key={col.id} value={col.id}>{col.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground" />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">{editingTask ? 'Update Task' : 'Add Task'}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingTask(null); setFormData({ title: '', description: '', department_id: '', assignee_id: '', status: 'TODO', priority: 'MEDIUM', due_date: '' }) }} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex gap-4 mb-6">
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-4 py-2 border border-border rounded-lg bg-background text-foreground">
          <option value="">All Departments</option>
          {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {statusColumns.map((column) => (
            <div key={column.id} className={`${column.color} rounded-lg p-4 min-h-96`}>
              <h3 className="font-semibold text-foreground mb-4">
                {column.label}
                <span className="text-muted-foreground ml-2">({tasks.filter((t) => t.status === column.id).length})</span>
              </h3>
              <div className="space-y-3">
                {tasks.filter((task) => task.status === column.id).map((task) => (
                  <Card key={task.id} className="p-4 bg-card border border-border cursor-pointer hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground text-sm">{task.title}</h4>
                      {task.description && <p className="text-xs text-muted-foreground">{task.description.substring(0, 50)}...</p>}
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        {task.assignee && <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{task.assignee.first_name}</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(task)} className="flex-1">Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)} className="flex-1">Delete</Button>
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
