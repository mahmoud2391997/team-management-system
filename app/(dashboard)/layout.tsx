import { getProfile, getCurrentUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'
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

  if (!profile) {
    const supabase = getSupabase()

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: membership?.role || 'EMPLOYEE',
        team_id: membership?.team_id || null,
      })

    if (!insertErr) {
      profile = {
        id: user.id,
        email: user.email,
        first_name: null,
        last_name: null,
        role: membership?.role || 'EMPLOYEE',
        team_id: membership?.team_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  } else if (!profile.team_id) {
    const supabase = getSupabase()
    const { data: activeMembership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeMembership) {
      await supabase
        .from('profiles')
        .update({ team_id: activeMembership.team_id, role: activeMembership.role || profile.role, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      profile = { ...profile, team_id: activeMembership.team_id, role: activeMembership.role || profile.role }
    }
  }

  let permissions: Permission[] = []
  if (profile?.team_id) {
    const supabase = getSupabase()
    if (DEFAULT_ROLES[profile.role]) {
      permissions = DEFAULT_ROLES[profile.role].permissions
    } else {
      const { data: customRole } = await supabase
        .from('roles')
        .select('permissions')
        .eq('team_id', profile.team_id)
        .eq('name', profile.role)
        .single()
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
