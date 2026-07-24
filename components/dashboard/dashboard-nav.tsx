'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth-actions'
import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/actions/data-actions'

export default function DashboardNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile()
      setProfile(data)
    }
    fetchProfile()
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/employees', label: 'Employees', icon: '👥' },
    { href: '/departments', label: 'Departments', icon: '🏢' },
    { href: '/tasks', label: 'Tasks', icon: '✓' },
    { href: '/roles', label: 'Roles', icon: '🔐' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen p-6 space-y-8">
      <div className="text-2xl font-bold text-sidebar-foreground">TMS</div>

      <div className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </Link>
          )
        })}
      </div>

      <div className="space-y-4 border-t border-sidebar-border pt-4">
        {profile && (
          <div className="px-4 py-2">
            <p className="text-sm font-semibold text-sidebar-foreground">
              {profile.first_name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60">{profile.role}</p>
          </div>
        )}
        <button onClick={handleLogout} className="w-full px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
          Logout
        </button>
      </div>
    </nav>
  )
}
