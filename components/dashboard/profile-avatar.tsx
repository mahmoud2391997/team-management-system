'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProfileAvatar({
  userId,
  firstName,
  lastName,
  email,
  employeeId,
}: {
  userId: string
  firstName: string | null
  lastName: string | null
  email: string
  employeeId: string | null
}) {
  const initials = (firstName?.[0] || email?.[0] || '?').toUpperCase()

  const href = employeeId ? `/employees/${employeeId}` : '/profile'

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-primary">{initials}</span>
      </div>
      <div className="hidden lg:block min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : email}
        </p>
      </div>
    </Link>
  )
}
