import { Suspense } from 'react'
import { getEmployees, getDepartments } from '@/lib/actions/data-actions'
import EmployeesContainer from '@/components/dashboard/employees-container'
import { EmployeeListSkeleton } from '@/components/ui/skeleton'
import { isError } from '@/lib/utils/async-helpers'

export const metadata = {
  title: 'Employees | Team Management',
  description: 'Manage your team members and their assignments',
}

async function EmployeesContent() {
  const [employeesResult, departmentsResult] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ])

  const employees = isError(employeesResult) ? [] : employeesResult.data
  const departments = isError(departmentsResult) ? [] : departmentsResult.data

  return (
    <EmployeesContainer
      initialEmployees={employees}
      initialDepartments={departments}
    />
  )
}

export default function EmployeesPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Employees</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team members and their assignments
        </p>
      </div>

      <Suspense fallback={<EmployeeListSkeleton />}>
        <EmployeesContent />
      </Suspense>
    </div>
  )
}
