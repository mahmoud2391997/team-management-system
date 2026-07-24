# Team Management System - Architecture Guide

## Overview

This project has been refactored following Next.js 16 best practices with a focus on:
- **Server-First Rendering**: Pages fetch data on the server, sending initial state to client components
- **Type Safety**: Full TypeScript coverage with centralized types
- **Consistent Patterns**: Standardized error handling and response formats
- **Performance**: Reduced JS bundle, optimized data fetching, smart caching

## Architecture Layers

### 1. **Data Layer** (`lib/actions/data-actions.ts`)
Server actions that handle all data operations with permission checks.

**Response Format**:
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

**Example**:
```typescript
const result = await getEmployees()
if (isError(result)) {
  console.error(result.error)
} else {
  console.log(result.data)
}
```

### 2. **Type System** (`lib/types/index.ts`)
Centralized TypeScript definitions for all entities, ensuring type safety across the application.

**Key Types**:
- `Employee`, `Department`, `Task`, `Team`, `Profile`
- `ActionResult<T>` - Standard response wrapper
- Input types for mutations
- Filter types for queries

### 3. **Utilities** (`lib/utils/async-helpers.ts`)
Helper functions for common patterns:
- `createSuccess<T>()` - Create success result
- `createError()` - Create error result
- `withErrorHandling()` - Wrap async functions with error handling
- `retryWithBackoff()` - Retry logic with exponential backoff
- `groupBy()` - Group array items
- `isSuccess()`, `isError()` - Type guards

### 4. **Custom Hooks** (`lib/hooks/`)
Client-side data fetching hooks with built-in loading and error states.

**Available Hooks**:
- `useEmployees()` - Fetch employees with caching
- `useDepartments()` - Fetch departments
- `useTasks()` - Fetch tasks with optional department filter
- `useDashboardStats()` - Fetch dashboard statistics

**Usage**:
```typescript
'use client'
import { useEmployees } from '@/lib/hooks'

export function MyComponent() {
  const { employees, loading, error, refetch } = useEmployees()

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {employees.map(emp => <div key={emp.id}>{emp.profile?.first_name}</div>)}
    </>
  )
}
```

### 5. **Component Architecture**

#### A. Page Components (Server)
- Fetch data using server actions
- Set initial state for client components
- Add metadata for SEO
- Non-interactive

**Example** (`app/(dashboard)/employees/page.tsx`):
```typescript
export default async function EmployeesPage() {
  const [employeesResult, departmentsResult] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ])

  const employees = isError(employeesResult) ? [] : employeesResult.data
  const departments = isError(departmentsResult) ? [] : departmentsResult.data

  return <EmployeesContainer initialEmployees={employees} initialDepartments={departments} />
}
```

#### B. Container Components (Client)
- Manage interactive state (filters, forms, modals)
- Use custom hooks for data management
- Delegate rendering to display components

**Example** (`components/dashboard/employees-container.tsx`):
```typescript
'use client'
import { useEmployees } from '@/lib/hooks'

export default function EmployeesContainer({ initialEmployees, initialDepartments }) {
  const { employees = initialEmployees, loading, refetch } = useEmployees({ autoFetch: false })
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter and render logic here
}
```

#### C. Display Components (Client/Server)
- Pure presentation logic
- Receive data as props
- Reusable across pages

**Example** (`components/dashboard/employee-list.tsx`):
```typescript
export function EmployeeList({ employees, onEdit, onDelete }) {
  return (
    <div>
      {employees.map(emp => (
        <EmployeeCard key={emp.id} employee={emp} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
```

### 6. **UI Components** (`components/ui/`)
Shadcn components and custom loading states.

**Skeleton Components**:
- `CardSkeleton` - Generic loading card
- `EmployeeListSkeleton` - Multiple cards
- `StatCardSkeleton` - Stats card
- `KanbanSkeleton` - Kanban board

## Data Flow

### Reading Data (Queries)

```
User Action
    ↓
Page Component (Server)
    ├─ Calls server action
    ├─ Handles ActionResult
    └─ Passes initial data to Container
    ↓
Container Component (Client)
    ├─ Initializes with server data
    ├─ Uses custom hook for refetching
    ├─ Manages local state (filters)
    └─ Renders Display Components
    ↓
Display Components
    └─ Render UI
```

### Mutating Data (Create/Update/Delete)

```
User Submits Form
    ↓
Form Component (Client)
    ├─ Calls server action
    ├─ Handles ActionResult
    ├─ Shows error/success message
    └─ Calls refetch() from hook
    ↓
Hook Updates State
    ↓
Component Re-renders with New Data
```

## Patterns & Best Practices

### 1. Server Actions
Always wrap database operations with permission checks and return typed results.

```typescript
export async function createEmployee(data: EmployeeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requirePermission('employees.create')
    if (!auth.ok) return createError(auth.error)

    const { db } = await connectToDatabase()
    const result = await db.collection('employees').insertOne({...})

    return createSuccess({ id: result.insertedId.toString() })
  } catch (error) {
    return createError(error.message)
  }
}
```

### 2. Custom Hooks
Use hooks for fetching with automatic error and loading state handling.

```typescript
export function useEmployees(options: UseEmployeesOptions = {}) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const result = await getEmployees()
    if (isError(result)) {
      setError(result.error)
    } else {
      setEmployees(result.data)
    }
  }, [])

  useEffect(() => {
    if (options.autoFetch) fetch()
  }, [options.autoFetch, fetch])

  return { employees, loading, error, refetch: fetch }
}
```

### 3. Type Guards
Use type guards to safely access results.

```typescript
const result = await getEmployees()

if (isError(result)) {
  // result is ActionError here
  console.error(result.error)
} else {
  // result is ActionSuccess<Employee[]> here
  console.log(result.data)
}
```

### 4. Component Composition
Split complex pages into focused components.

```
Page (Server)
  └─ Container (Client) - manages state and orchestration
      ├─ SearchBar - filter input
      ├─ FilterSelect - department filter
      └─ DisplayList - renders items
          └─ CardComponent - individual item
```

## File Structure

```
lib/
  ├─ types/
  │  └─ index.ts           # All TypeScript definitions
  ├─ hooks/
  │  ├─ use-employees.ts   # Employee data hook
  │  ├─ use-departments.ts # Department data hook
  │  ├─ use-tasks.ts       # Task data hook
  │  ├─ use-dashboard-stats.ts
  │  └─ index.ts           # Exports
  ├─ utils/
  │  └─ async-helpers.ts   # Async utilities and helpers
  └─ actions/
     └─ data-actions.ts    # All server actions

components/
  ├─ ui/
  │  └─ skeleton.tsx       # Loading skeletons
  ├─ dashboard/
  │  ├─ employees-container.tsx  # Client orchestrator
  │  ├─ employees-list.tsx       # Display component
  │  ├─ tasks-container.tsx      # Client orchestrator
  │  └─ ...
  └─ providers/
     └─ error-boundary.tsx # Error handling

app/
  └─ (dashboard)/
     ├─ employees/
     │  └─ page.tsx        # Server page
     ├─ tasks/
     │  └─ page.tsx        # Server page
     └─ ...
```

## Performance Considerations

1. **Server Components**: Pages are server components by default, reducing client-side JavaScript
2. **Initial State**: Passing initial data to containers avoids double fetching
3. **Lazy Loading**: Hooks with `autoFetch: false` allow manual control
4. **Revalidation**: Use `refetch()` from hooks for smart data updates
5. **Memoization**: Container components should use `useMemo` for filtered lists

## Next Steps

1. **Add Caching**: Implement Redis/in-memory caching for frequently accessed data
2. **Add Suspense**: Wrap sections with `<Suspense>` for streaming
3. **Add Pagination**: Extend hooks to support pagination for large datasets
4. **Add Optimistic Updates**: Update UI before server confirms
5. **Add Real-time Updates**: WebSocket integration for live data

## Troubleshooting

### Issue: Server component errors in client components
**Solution**: Make sure to use `'use client'` directive at the top of client components that use hooks

### Issue: Infinite refetch loops
**Solution**: Always use `autoFetch: false` when passing initial data from server components

### Issue: Type errors with ActionResult
**Solution**: Always use `isError()` type guard before accessing `.data` property

## Migration Guide

If migrating existing pages to this pattern:

1. Create a container component (mark with `'use client'`)
2. Move state management to container
3. Convert page to server component
4. Fetch data in page, pass to container
5. Update imports to use new type system
6. Test with browser DevTools to verify less JavaScript
