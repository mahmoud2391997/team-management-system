import { getEmployees, getDepartments } from '@/lib/actions/data-actions'
import { Button } from '@/components/ui/button'
import EmployeesContainer from '@/components/dashboard/employees-container'
import { isError } from '@/lib/utils/async-helpers'

export const metadata = {
  title: 'Employees | Team Management',
  description: 'Manage your team members and their assignments',
}

export default async function EmployeesPage() {
  // Fetch data on the server
  const [employeesResult, departmentsResult] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ])

  const employees = isError(employeesResult) ? [] : employeesResult.data
  const departments = isError(departmentsResult) ? [] : departmentsResult.data

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their assignments
          </p>
        </div>
        <Button>+ Add Employee</Button>
      </div>

      <EmployeesContainer
        initialEmployees={employees}
        initialDepartments={departments}
      />
    </div>
  )
}
