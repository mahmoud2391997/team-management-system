'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Menu, Users, Briefcase, CheckSquare, Settings, LogOut, Settings2, UserPlus, Bell, ChevronsUpDown, Check, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth-actions'
import { getUserTeams, switchTeam } from '@/app/actions/invitations'
import { usePermissions } from '@/components/dashboard/permissions-context'

const allMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Menu, permission: 'dashboard.view' as const },
  { href: '/employees', label: 'Employees', icon: Users, permission: 'employees.view' as const },
  { href: '/departments', label: 'Departments', icon: Briefcase, permission: 'departments.view' as const },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, permission: 'tasks.view' as const },
  { href: '/members', label: 'Members', icon: UserPlus, permission: 'members.view' as const },
  { href: '/roles', label: 'Roles & Permissions', icon: Settings, permission: 'roles.manage' as const },
  { href: '/notifications', label: 'Notifications', icon: Bell, permission: null },
  { href: '/profile', label: 'Profile', icon: User, permission: null },
  { href: '/settings', label: 'Settings', icon: Settings2, permission: null },
]

const noTeamItems = [
  { href: '/create-team', label: 'Create Team', icon: Plus },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar({ userRole }: { userRole?: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<{ teams: any[]; activeId: string | null; activeName: string; hasTeam: boolean }>({
    teams: [], activeId: null, activeName: '', hasTeam: false,
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { permissions, refreshPermissions } = usePermissions()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [teamsResult, notifResult] = await Promise.all([
        getUserTeams(),
        import('@/app/actions/invitations').then(m => m.getNotifications()),
      ])
      if (cancelled) return
      const list = teamsResult.data || []
      const active = list.find((t: any) => t.id === teamsResult.activeTeamId)
      setTeamData({
        teams: list,
        activeId: teamsResult.activeTeamId,
        activeName: active?.name || '',
        hasTeam: teamsResult.success && list.length > 0,
      })
      if (notifResult.success) {
        setUnreadCount(notifResult.data?.filter((n: any) => !n.read).length || 0)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const menuItems = useMemo(() => {
    if (!teamData.hasTeam) return noTeamItems
    if (permissions.length === 0) return []
    return allMenuItems.filter(item => !item.permission || permissions.includes(item.permission as any))
  }, [teamData.hasTeam, permissions])

  const handleSwitchTeam = useCallback(async (teamId: string) => {
    await switchTeam(teamId)
    setSwitcherOpen(false)
    window.location.reload()
  }, [])

  const handleCreateTeam = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    const { createTeamForUser } = await import('@/app/actions/create-team')
    const result = await createTeamForUser(createName)
    if (result.error) {
      setCreateError(result.error)
      setCreateLoading(false)
      return
    }
    window.location.reload()
  }, [createName])

  return (
    <>
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">TMS</h2>
            {teamData.hasTeam && teamData.activeName && (
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate w-full text-left"
              >
                {teamData.activeName}
                <ChevronsUpDown className="h-3 w-3 shrink-0" />
              </button>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="outline shrink-0">
          <ChevronLeft className={cn('transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {switcherOpen && !collapsed && (
        <div className="absolute top-16 left-0 w-64 bg-card border-b border-border shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Switch Team</p>
            {teamData.teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSwitchTeam(team.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-accent transition-colors',
                  team.id === teamData.activeId && 'bg-accent'
                )}
              >
                <Check className={cn('h-4 w-4', team.id === teamData.activeId ? 'text-primary' : 'text-transparent')} />
                <span className="truncate">{team.name}</span>
              </button>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => { setSwitcherOpen(false); setCreateOpen(true); setCreateName(''); setCreateError(null) }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-accent transition-colors text-primary"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Create New Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'w-full justify-start outline relative h-10 text-sm',
                  collapsed ? 'px-2 justify-center' : 'px-3'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        {!collapsed && userRole && (
          <div className="text-xs text-muted-foreground truncate px-3 py-1">Role: {userRole}</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => { await logout(); window.location.href = '/auth/login' }}
          className={cn(
            'w-full outline text-destructive hover:text-destructive h-10 text-sm',
            collapsed ? 'px-2 justify-center' : 'px-3 justify-start'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="ml-3 font-medium">Logout</span>}
        </Button>
      </div>
    </aside>

    {createOpen && (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[60]">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>Enter a name for your new team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="createTeamName">Team Name</Label>
                <Input id="createTeamName" type="text" placeholder="e.g. My Team" required value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Team'}</Button>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  )
}
