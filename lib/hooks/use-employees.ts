'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEmployees } from '@/lib/actions/data-actions'
import type { Employee } from '@/lib/types'
import { isError } from '@/lib/utils/async-helpers'

export interface UseEmployeesOptions {
  autoFetch?: boolean
  refetchInterval?: number
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const { autoFetch = true, refetchInterval = 0 } = options

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getEmployees()

      if (isError(result)) {
        setError(result.error)
        setEmployees([])
      } else {
        setEmployees(result.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees'
      setError(message)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

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
    employees,
    loading,
    error,
    refetch,
  }
}
