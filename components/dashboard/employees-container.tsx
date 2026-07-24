'use client'

import { useState, useMemo } from 'react'
import { useEmployees, useDepartments } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeListSkeleton } from '@/components/ui/skeleton'
import EmployeeForm from '@/components/dashboard/employee-form'
import EmployeeList from '@/components/dashboard/employee-list'
import type { Employee, Department } from '@/lib/types'

interface EmployeesContainerProps {
  initialEmployees: Employee[]
  initialDepartments: Department[]
}

export default function EmployeesContainer({
  initialEmployees,
  initialDepartments,
}: EmployeesContainerProps) {
  const { employees = initialEmployees, loading, refetch } = useEmployees({ autoFetch: false })
  const { departments = initialDepartments } = useDepartments({ autoFetch: false })
  
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        emp.profile?.first_name?.toLowerCase().includes(searchLower) ||
        emp.profile?.last_name?.toLowerCase().includes(searchLower) ||
        emp.profile?.email?.toLowerCase().includes(searchLower)

      const matchesDept = !filterDept || emp.department_id === filterDept

      return matchesSearch && matchesDept
    })
  }, [employees, searchTerm, filterDept])

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleCloseForm = async () => {
    setShowForm(false)
    setEditingEmployee(null)
    await refetch()
  }

  const handleDelete = async () => {
    await refetch()
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          departments={departments}
          onClose={handleCloseForm}
        />
      )}

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

      {loading ? (
        <EmployeeListSkeleton />
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
