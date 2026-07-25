'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function EmployeeDetailModal({
  open,
  employee,
  onClose,
  onEdit,
}: {
  open: boolean
  employee: any
  onClose: () => void
  onEdit: (employee: any) => void
}) {
  if (!open || !employee) return null

  const profile = employee.profile
  const department = employee.department
  const manager = employee.manager

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 p-6 w-full max-w-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile?.first_name?.[0] || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Role</p>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{profile?.role || '-'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                employee.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : employee.status === 'ON_LEAVE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{department?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="text-sm font-medium">{employee.position || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="text-sm font-medium">
                {employee.salary ? `$${employee.salary.toLocaleString()}` : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Join Date</p>
              <p className="text-sm font-medium">
                {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>

          {manager && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Manager</p>
              <p className="text-sm font-medium">
                {manager.first_name || manager.last_name
                  ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
                  : manager.email || '-'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1" onClick={() => { onClose(); onEdit(employee) }}>Edit</Button>
        </div>
      </Card>
    </div>
  )
}
