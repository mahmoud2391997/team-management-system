'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTasks } from '@/lib/actions/data-actions'
import type { Task } from '@/lib/types'
import { isError } from '@/lib/utils/async-helpers'

export interface UseTasksOptions {
  autoFetch?: boolean
  refetchInterval?: number
  filterDept?: string
}

export function useTasks(options: UseTasksOptions = {}) {
  const { autoFetch = true, refetchInterval = 0, filterDept } = options

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTasks(filterDept)

      if (isError(result)) {
        setError(result.error)
        setTasks([])
      } else {
        setTasks(result.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      setError(message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [filterDept])

  useEffect(() => {
    if (autoFetch) {
      fetch()
    }
  }, [autoFetch, fetch])

  useEffect(() => {
    if (refetchInterval > 0) {
      const interval = setInterval(fetch, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [refetchInterval, fetch])

  const refetch = useCallback(fetch, [fetch])

  return {
    tasks,
    loading,
    error,
    refetch,
  }
}
