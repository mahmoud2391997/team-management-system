'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDepartments } from '@/lib/actions/data-actions'
import type { Department } from '@/lib/types'
import { isError } from '@/lib/utils/async-helpers'

export interface UseDepartmentsOptions {
  autoFetch?: boolean
  refetchInterval?: number
}

export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { autoFetch = true, refetchInterval = 0 } = options

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getDepartments()

      if (isError(result)) {
        setError(result.error)
        setDepartments([])
      } else {
        setDepartments(result.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch departments'
      setError(message)
      setDepartments([])
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
    departments,
    loading,
    error,
    refetch,
  }
}
