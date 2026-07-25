'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function EmployeeList({
  employees,
  onEdit,
  onDelete,
}: {
  employees: any[]
  onEdit: (employee: any) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {employees.map((employee) => (
        <Card
          key={employee.id}
          className="p-4 border border-border bg-card hover:bg-card/80 transition-colors cursor-pointer"
          onClick={() => router.push(`/employees/${employee.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {employee.profile?.first_name?.[0] || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {employee.profile?.first_name} {employee.profile?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {employee.profile?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Position</p>
                <p className="font-medium text-foreground">
                  {employee.position || '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">
                  {employee.department?.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    employee.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : employee.status === 'ON_LEAVE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Salary</p>
                <p className="font-medium text-foreground">
                  {employee.salary ? `$${employee.salary.toLocaleString()}` : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-6" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(employee)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(employee.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
