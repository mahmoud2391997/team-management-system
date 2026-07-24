'use client'

import { useEffect, useState } from 'react'
import { getEmployees, getDepartments, deleteEmployee } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import EmployeeForm from '@/components/dashboard/employee-form'
import EmployeeList from '@/components/dashboard/employee-list'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const data = await getEmployees()
    setEmployees(data)
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const data = await getDepartments()
    setDepartments(data)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id)
      fetchEmployees()
    }
  }

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingEmployee(null)
    fetchEmployees()
  }

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      emp.profile?.first_name?.toLowerCase().includes(searchLower) ||
      emp.profile?.last_name?.toLowerCase().includes(searchLower) ||
      emp.profile?.email?.toLowerCase().includes(searchLower)

    const matchesDept = !filterDept || emp.department_id === filterDept

    return matchesSearch && matchesDept
  })

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their assignments
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Employee</Button>
      </div>

      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          departments={departments}
          onClose={handleCloseForm}
        />
      )}

      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
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
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <p className="text-muted-foreground">
            {searchTerm || filterDept
              ? 'No employees match your filters'
              : 'No employees yet. Create one to get started.'}
          </p>
        </Card>
      ) : (
        <EmployeeList
          employees={filteredEmployees}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
