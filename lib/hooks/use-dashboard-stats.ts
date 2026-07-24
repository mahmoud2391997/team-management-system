'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDashboardStats } from '@/lib/actions/data-actions'
import type { DashboardStats } from '@/lib/types'
import { isError } from '@/lib/utils/async-helpers'

export interface UseDashboardStatsOptions {
  autoFetch?: boolean
  refetchInterval?: number
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { autoFetch = true, refetchInterval = 30000 } = options // Auto-refetch every 30s by default

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getDashboardStats()

      if (isError(result)) {
        setError(result.error)
        setStats(null)
      } else {
        setStats(result.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard stats'
      setError(message)
      setStats(null)
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
    stats,
    loading,
    error,
    refetch,
  }
}
