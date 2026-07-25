'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getEmployees, deleteEmployee } from '@/lib/actions/data-actions'
import EmployeeForm from '@/components/dashboard/employee-form'
import EmployeeList from '@/components/dashboard/employee-list'
import DeleteModal from '@/components/ui/delete-modal'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Employee, Department } from '@/lib/types'

const ITEMS_PER_PAGE = 10

interface EmployeesContainerProps {
  initialEmployees: Employee[]
  initialDepartments: Department[]
}

export default function EmployeesContainer({
  initialEmployees,
  initialDepartments,
}: EmployeesContainerProps) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [departments] = useState(initialDepartments)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  // Reset to first page when search/filter changes
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredEmployees.slice(startIndex, endIndex)
  }, [filteredEmployees, currentPage])

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  // Reset pagination when search term changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Reset pagination when department filter changes
  const handleDeptFilterChange = (dept: string) => {
    setFilterDept(dept)
    setCurrentPage(1)
  }

  const handleCloseForm = async (saved?: boolean) => {
    setShowForm(false)
    setEditingEmployee(null)
    if (saved) {
      const result = await getEmployees()
      if (!result.error) setEmployees(result.data)
    }
  }

  const handleDeleteClick = (id: string) => {
    const emp = employees.find((e) => e.id === id)
    if (emp) {
      setDeleteTarget(emp)
      setDeleteError(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteEmployee(deleteTarget.id)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete employee')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          departments={departments}
          existingProfileIds={employees.map(e => e.profile_id)}
          onClose={handleCloseForm}
        />
      )}

      <DeleteModal
        open={!!deleteTarget}
        title="Remove Employee"
        description={`Are you sure you want to remove ${deleteTarget?.profile?.first_name} ${deleteTarget?.profile?.last_name} (${deleteTarget?.profile?.email}) from the team?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
        loading={deleting}
      />

      {deleteError && (
        <Card className="p-4 border border-destructive bg-destructive/10 text-sm text-destructive">
          {deleteError}
        </Card>
      )}

      <div className="flex gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        />
        <select
          value={filterDept}
          onChange={(e) => handleDeptFilterChange(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <Button onClick={() => { setEditingEmployee(null); setShowForm(true) }}>+ Add Employee</Button>
      </div>

      {filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <p className="text-muted-foreground">
            {searchTerm || filterDept
              ? 'No employees match your filters'
              : 'No employees yet. Create one to get started.'}
          </p>
        </Card>
      ) : (
        <>
          <EmployeeList
            employees={paginatedEmployees}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
