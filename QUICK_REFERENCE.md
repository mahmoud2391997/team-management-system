# Quick Reference Guide

## Importing New Types

```typescript
import type { 
  Employee, 
  Department, 
  Task, 
  ActionResult,
  EmployeeInput,
  DepartmentInput,
  TaskInput
} from '@/lib/types'
```

## Using Server Actions

```typescript
const result = await getEmployees()

if (isError(result)) {
  console.error(result.error)  // Show error
} else {
  console.log(result.data)     // Use data
}
```

## Using Custom Hooks

```typescript
'use client'
import { useEmployees } from '@/lib/hooks'

function MyComponent() {
  const { employees, loading, error, refetch } = useEmployees({
    autoFetch: true,      // Auto-fetch on mount
    refetchInterval: 0    // No auto-refetch
  })

  return (
    <>
      {loading && <Skeleton />}
      {error && <ErrorAlert error={error} />}
      {employees.map(emp => <Item key={emp.id} item={emp} />)}
    </>
  )
}
```

## Creating a Server Page

```typescript
export default async function Page() {
  // Fetch on server
  const result = await getData()
  const data = isError(result) ? [] : result.data

  // Pass to container
  return <Container initialData={data} />
}
```

## Creating a Container Component

```typescript
'use client'

export default function Container({ initialData }) {
  // Use hook with autoFetch: false to leverage initial data
  const { data = initialData, loading, refetch } = useData({ autoFetch: false })
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    return data.filter(item => item.name.includes(filter))
  }, [data, filter])

  return (
    <div>
      <input onChange={e => setFilter(e.target.value)} />
      <List data={filtered} onUpdate={refetch} />
    </div>
  )
}
```

## Using Type Guards

```typescript
import { isSuccess, isError } from '@/lib/utils/async-helpers'

const result = await someAction()

if (isError(result)) {
  setError(result.error)
} else {
  setData(result.data)
}
```

## Creating a Custom Hook

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getYourData } from '@/lib/actions/data-actions'
import { isError } from '@/lib/utils/async-helpers'
import type { YourType } from '@/lib/types'

export function useYourData(options = {}) {
  const [data, setData] = useState<YourType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const result = await getYourData()
    if (isError(result)) {
      setError(result.error)
    } else {
      setData(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (options.autoFetch !== false) fetch()
  }, [options.autoFetch, fetch])

  return { data, loading, error, refetch: fetch }
}
```

## Error Handling

```typescript
import { ErrorAlert } from '@/components/providers/error-boundary'

function MyComponent() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data) => {
    const result = await createItem(data)
    
    if (isError(result)) {
      setError(result.error)
    } else {
      // Success
    }
  }

  return (
    <>
      {error && <ErrorAlert error={error} />}
      {/* Form */}
    </>
  )
}
```

## Loading States

```typescript
import { EmployeeListSkeleton, CardSkeleton } from '@/components/ui/skeleton'

function MyComponent({ loading }) {
  return (
    <>
      {loading && <EmployeeListSkeleton />}
      {!loading && <ActualList />}
    </>
  )
}
```

## Caching

```typescript
import { withCache, getCached, setCache } from '@/lib/utils/cache'

// Option 1: Automatic caching
const data = await withCache('employees-key', () => getEmployees(), 5 * 60 * 1000)

// Option 2: Manual caching
const cached = getCached('employees-key')
if (!cached) {
  const fresh = await getEmployees()
  setCache('employees-key', fresh, 5 * 60 * 1000)
}
```

## Performance Monitoring

```typescript
import { measureAsync, logPerformanceSummary } from '@/lib/utils/performance'

// Measure an operation
const result = await measureAsync('fetch-employees', () => getEmployees())

// Log all metrics
if (process.env.NODE_ENV === 'development') {
  logPerformanceSummary()
}
```

## Creating a New Page - Checklist

- [ ] Create `app/(dashboard)/new-page/page.tsx` (Server)
- [ ] Add `export const metadata = { title: '...', description: '...' }`
- [ ] Fetch data: `const result = await getYourData()`
- [ ] Handle error: `const data = isError(result) ? [] : result.data`
- [ ] Create container component
- [ ] Create hook if needed
- [ ] Add to exports in `lib/hooks/index.ts`
- [ ] Test in browser

## Key Files to Reference

| File | Purpose |
|------|---------|
| `lib/types/index.ts` | All TypeScript definitions |
| `lib/utils/async-helpers.ts` | ActionResult, type guards, helpers |
| `lib/utils/cache.ts` | Caching utilities |
| `lib/utils/performance.ts` | Performance monitoring |
| `lib/hooks/index.ts` | All hook exports |
| `components/ui/skeleton.tsx` | Loading components |
| `components/providers/error-boundary.tsx` | Error handling |
| `app/(dashboard)/employees/page.tsx` | Good example of refactored page |
| `components/dashboard/employees-container.tsx` | Good example of container |

## Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot use hooks in server component" | Add `'use client'` at top |
| Data not updating | Call `refetch()` from hook |
| TypeScript errors on ActionResult | Use `isError()` guard first |
| Infinite loops | Use `autoFetch: false` with initial data |
| Missing types | Check `lib/types/index.ts` |
| Server action errors | Check try-catch wrapping and createError() |

## API Quick Reference

### actionResult
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### Type Guards
```typescript
isError(result)    // -> result is ActionError
isSuccess(result)  // -> result is ActionSuccess<T>
```

### Response Builders
```typescript
createSuccess(data)     // -> { success: true, data }
createError(message)    // -> { success: false, error: message }
```

### Async Helpers
```typescript
withErrorHandling(fn)   // Wraps with try-catch
retryWithBackoff(fn)    // Retries with exponential backoff
groupBy(items, keyFn)   // Groups array by key function
safeParse(json, fallback) // Safe JSON parsing
debounce(fn, ms)        // Debounces function calls
```

## Links & Resources

- Full Architecture: See `ARCHITECTURE.md`
- Implementation Guide: See `IMPLEMENTATION_GUIDE.md`
- Pattern Summary: See `DESIGN_PATTERNS_SUMMARY.md`
- Type Definitions: See `lib/types/index.ts`
- Async Utilities: See `lib/utils/async-helpers.ts`

---

**Pro Tips:**
1. Always use `autoFetch: false` when you have server data
2. Use `isError()` guard before accessing `.data`
3. Call `refetch()` after mutations to update UI
4. Use skeleton components for better UX
5. Keep containers focused on state, display components focused on rendering
