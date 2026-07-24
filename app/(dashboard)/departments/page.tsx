'use client'

import { useEffect, useState } from 'react'
import { getDepartments, getManagerProfiles, createDepartment, updateDepartment, deleteDepartment } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isError } from '@/lib/utils/async-helpers'
import type { Department } from '@/lib/types'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', manager_id: '', icon: '🏢' })

  useEffect(() => {
    fetchDepartments()
    fetchProfiles()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    const result = await getDepartments()
    setDepartments(isError(result) ? [] : result.data)
    setLoading(false)
  }

  const fetchProfiles = async () => {
    const result = await getManagerProfiles()
    setProfiles(isError(result) ? [] : result.data as any[])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name: formData.name,
        icon: formData.icon,
        manager_id: formData.manager_id,
      })
    } else {
      await createDepartment({
        name: formData.name,
        manager_id: formData.manager_id,
        icon: formData.icon,
      })
    }

    setShowForm(false)
    setEditingDept(null)
    setFormData({ name: '', manager_id: '', icon: '🏢' })
    fetchDepartments()
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({ name: dept.name, manager_id: dept.manager_id || '', icon: dept.description || '🏢' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will also delete all employees and tasks in this department.')) {
      await deleteDepartment(id)
      fetchDepartments()
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-2">Manage your organizational departments</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Department</Button>
      </div>

      {showForm && (
        <Card className="p-6 border border-border bg-card mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {editingDept ? 'Edit Department' : 'Add New Department'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Engineering"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-center text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Manager</label>
              <select
                required
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">Select a manager...</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">
                {editingDept ? 'Update Department' : 'Add Department'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEditingDept(null); setFormData({ name: '', manager_id: '', icon: '🏢' }) }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <p className="text-muted-foreground">No departments yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-6 border border-border bg-card hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{dept.icon || '🏢'}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(dept)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(dept.id)}>Delete</Button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{dept.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Manager: {dept.manager?.first_name} {dept.manager?.last_name}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
