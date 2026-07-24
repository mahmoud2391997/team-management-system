'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Permission } from '@/lib/permissions'

const routePermissions: Record<string, Permission> = {
  '/dashboard': 'dashboard.view',
  '/employees': 'employees.view',
  '/departments': 'departments.view',
  '/tasks': 'tasks.view',
  '/members': 'members.view',
  '/roles': 'roles.manage',
}

const freeRoutes = ['/notifications', '/profile', '/create-team']

export function RouteGuard({ permissions, hasTeam, children }: { permissions: Permission[]; hasTeam: boolean; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!hasTeam && !freeRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
      router.replace('/profile')
      return
    }
    for (const [route, requiredPerm] of Object.entries(routePermissions)) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        if (!permissions.includes(requiredPerm)) {
          router.replace('/dashboard')
          return
        }
        break
      }
    }
  }, [pathname, permissions, hasTeam, router])

  if (!hasTeam && !freeRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return null
  }
  for (const [route, requiredPerm] of Object.entries(routePermissions)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!permissions.includes(requiredPerm)) {
        return null
      }
      break
    }
  }

  return <>{children}</>
}
