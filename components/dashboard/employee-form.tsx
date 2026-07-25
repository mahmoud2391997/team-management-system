'use client'

import { useState, useEffect } from 'react'
import { getProfiles, createEmployee, updateEmployee } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function EmployeeForm({
  employee,
  departments,
  existingProfileIds = [],
  onClose,
}: {
  employee?: any
  departments: any[]
  existingProfileIds?: string[]
  onClose: (saved?: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    profile_id: employee?.profile_id || '',
    department_id: employee?.department_id || '',
    position: employee?.position || '',
    join_date: employee?.join_date ? new Date(employee.join_date).toISOString().split('T')[0] : '',
    salary: employee?.salary || '',
    status: employee?.status || 'ACTIVE',
    manager_id: employee?.manager_id || '',
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    const result = await getProfiles()
    setProfiles(result.data ?? [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (employee) {
        result = await updateEmployee(employee.id || employee._id, {
          department_id: formData.department_id,
          position: formData.position,
          join_date: formData.join_date ? new Date(formData.join_date) : null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          status: formData.status,
          manager_id: formData.manager_id || null,
        })
      } else {
        result = await createEmployee({
          profile_id: formData.profile_id,
          department_id: formData.department_id,
          position: formData.position,
          join_date: formData.join_date ? new Date(formData.join_date) : null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          status: formData.status,
          manager_id: formData.manager_id || null,
        })
      }

      if (result.error) {
        setError(result.error)
        return
      }

      onClose(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border border-border bg-card mb-8">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {employee ? 'Edit Employee' : 'Add New Employee'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!employee && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Profile</label>
            <select
              required
              value={formData.profile_id}
              onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Choose a user...</option>
              {profiles
                .filter((p) => employee ? p.id === employee.profile_id : !existingProfileIds.includes(p.id))
                .map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.email} ({profile.email}) - {profile.role}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Department</label>
          <select
            required
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">Select a department...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Senior Developer"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Join Date</label>
            <input
              type="date"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Salary</label>
            <input
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Manager (Optional)</label>
          <select
            value={formData.manager_id}
            onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">No Manager</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.email} ({profile.email}) - {profile.role}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </form>
    </Card>
  )
}
