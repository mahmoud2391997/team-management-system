import { getProfile, getCurrentUser } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'
import { RouteGuard } from '@/components/dashboard/route-guard'
import { PermissionsProvider } from '@/components/dashboard/permissions-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  let profile = user.profile

  let permissions: Permission[] = []
  if (profile?.team_id) {
    const { db } = await connectToDatabase()
    if (DEFAULT_ROLES[profile.role]) {
      permissions = DEFAULT_ROLES[profile.role].permissions
    } else {
      const customRole = await db.collection('roles').findOne({
        team_id: profile.team_id,
        name: profile.role,
      })
      permissions = customRole?.permissions || []
    }
  }

  return (
    <PermissionsProvider>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={profile?.team_id ? profile?.role : undefined} />
        <main className="flex-1 overflow-y-auto ml-64">
          <RouteGuard permissions={permissions} hasTeam={!!profile?.team_id}>
            {children}
          </RouteGuard>
        </main>
      </div>
    </PermissionsProvider>
  )
}
