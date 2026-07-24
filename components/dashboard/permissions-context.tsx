'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { getUserPermissions } from '@/lib/actions/data-actions'
import type { Permission } from '@/lib/permissions'

interface PermissionsContextValue {
  permissions: Permission[]
  loading: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  loading: true,
  refreshPermissions: async () => {},
})

export function usePermissions() {
  return useContext(PermissionsContext)
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  const refreshPermissions = useCallback(async () => {
    const perms = await getUserPermissions()
    setPermissions(perms)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  const value = useMemo(() => ({ permissions, loading, refreshPermissions }), [permissions, loading, refreshPermissions])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}
