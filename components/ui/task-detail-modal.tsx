'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

export default function TaskDetailModal({
  open,
  task,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  open: boolean
  task: any
  onClose: () => void
  onEdit: (task: any) => void
  onDelete: (taskId: string) => void
  canEdit?: boolean
  canDelete?: boolean
}) {
  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 p-6 w-full max-w-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground pr-8">{task.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {task.description}
          </p>
        )}

        {!task.description && (
          <p className="text-sm text-muted-foreground italic mb-6">No description</p>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[task.status] || task.status}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Priority</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                {task.priority}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{task.department?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Assignee</p>
              <p className="text-sm font-medium">
                {task.assignee
                  ? `${task.assignee.first_name || ''} ${task.assignee.last_name || ''}`.trim() || task.assignee.email || '-'
                  : 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Assigned By</p>
            <p className="text-sm font-medium">
              {task.creator
                ? `${task.creator.first_name || ''} ${task.creator.last_name || ''}`.trim() || task.creator.email || '-'
                : '-'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-6 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          {canEdit && (
            <Button className="flex-1" onClick={() => { onClose(); onEdit(task) }}>Edit</Button>
          )}
          {canDelete && (
            <Button variant="destructive" className="flex-1" onClick={() => { onClose(); onDelete(task.id) }}>Delete</Button>
          )}
        </div>
      </Card>
    </div>
  )
}
