export function CardSkeleton() {
  return (
    <div className="p-4 border border-border rounded-lg bg-card animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-border">
      <div className="flex-1 h-4 bg-muted rounded animate-pulse"></div>
      <div className="flex-1 h-4 bg-muted rounded animate-pulse"></div>
      <div className="flex-1 h-4 bg-muted rounded animate-pulse"></div>
      <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
    </div>
  )
}

export function EmployeeListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 border border-border rounded-lg bg-card animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-8 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-2/3"></div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function KanbanColumnSkeleton() {
  return (
    <div className="bg-muted rounded-lg p-4 min-h-96 animate-pulse space-y-3">
      <div className="h-6 bg-background rounded w-1/2"></div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 bg-background rounded"></div>
      ))}
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  )
}
