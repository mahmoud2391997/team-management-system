'use client'

import { useEffect, useState } from 'react'
import { getTeamMembers, getProfile, getTeam } from '@/lib/actions/data-actions'
import { inviteMember, getPendingInvites, revokeInvite } from '@/app/actions/invitations'
import { getTeamRoles } from '@/app/actions/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Trash2, UserPlus, Shield } from 'lucide-react'
import { usePermissions } from '@/components/dashboard/permissions-context'

export default function MembersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EMPLOYEE')
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPromoteConfirm, setShowPromoteConfirm] = useState<string | null>(null)
  const [showDemoteConfirm, setShowDemoteConfirm] = useState<string | null>(null)
  const [demoteRole, setDemoteRole] = useState('MANAGER')
  const { permissions, refreshPermissions } = usePermissions()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const profile = await getProfile()
    if (!profile) return

    setCurrentUser(profile)

    if (profile?.team_id) {
      const teamData = await getTeam()
      setTeam(teamData)

      const members = await getTeamMembers()
      setTeamMembers(members)

      const { data: invites } = await getPendingInvites()
      setPendingInvites(invites || [])

      const rolesResult = await getTeamRoles()
      if (rolesResult.success) setRoles(rolesResult.data || [])
    }

    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setError(null)
    setSuccess(null)

    const result = await inviteMember(inviteEmail, inviteRole)

    if (result.error) {
      setError(result.error)
      setInviteLoading(false)
      return
    }

    setSuccess(`Invitation sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviteRole('EMPLOYEE')
    await refreshPermissions()
    await fetchData()
    setInviteLoading(false)
  }

  const handleRevoke = async (inviteId: string) => {
    await revokeInvite(inviteId)
    await refreshPermissions()
    await fetchData()
  }

  const handlePromoteToAdmin = async (memberId: string) => {
    setActionLoading(true)
    const { updateUserRole } = await import('@/app/actions/update-role')
    await updateUserRole(memberId, 'ADMIN')
    setShowPromoteConfirm(null)
    await refreshPermissions()
    await fetchData()
    setActionLoading(false)
  }

  const handleRemoveAdmin = async (memberId: string, role: string) => {
    setActionLoading(true)
    const { updateUserRole } = await import('@/app/actions/update-role')
    await updateUserRole(memberId, role)
    setShowDemoteConfirm(null)
    await refreshPermissions()
    await fetchData()
    setActionLoading(false)
  }

  const handleRemoveFromTeam = async (memberId: string) => {
    setActionLoading(true)
    const { removeFromTeam } = await import('@/lib/actions/data-actions')
    await removeFromTeam(memberId)
    await refreshPermissions()
    await fetchData()
    setActionLoading(false)
  }

  const canInvite = permissions.includes('members.invite')
  const canManageMembers = permissions.includes('members.remove')
  const adminCount = teamMembers.filter(m => m.role === 'ADMIN').length

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
        <p className="text-muted-foreground mt-2">
          {canInvite ? 'Invite and manage your team members' : 'View your team members'}
        </p>
      </div>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Member
            </CardTitle>
            <CardDescription>
              Send an invitation to join your team with a specific role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1 grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {canInvite && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {invite.role} · Invited {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(invite.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({teamMembers.length})</CardTitle>
          <CardDescription>
            {canManageMembers ? 'Manage team members and their roles. The last admin cannot be edited or removed.' : 'All members in your team'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const isMemberAdmin = member.role === 'ADMIN'
              const isMemberOwner = member.user_id === team?.owner_id
              const isCurrentUser = member.user_id === currentUser?.user_id
              const isLastAdmin = isMemberAdmin && adminCount === 1
              const isLocked = isLastAdmin

              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {member.first_name?.[0] || member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isMemberAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isMemberAdmin && <Shield className="h-3 w-3" />}
                      {member.role}
                    </span>
                    {canManageMembers && !isLocked && (
                      <>
                        {currentUser?.role === 'ADMIN' && !isMemberAdmin && (
                          <Button variant="outline" size="sm" onClick={() => setShowPromoteConfirm(member.user_id)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        )}
                        {currentUser?.role === 'ADMIN' && isMemberAdmin && adminCount > 1 && (
                          <Button variant="outline" size="sm" onClick={() => { setDemoteRole('MANAGER'); setShowDemoteConfirm(member.user_id) }}>
                            Remove Admin
                          </Button>
                        )}
                        {!isLastAdmin && (!isMemberOwner || adminCount > 1) && (
                          <Button variant="outline" size="sm" onClick={() => handleRemoveFromTeam(member.user_id)} className="text-destructive hover:text-destructive">
                            Remove
                          </Button>
                        )}
                      </>
                    )}
                    {canManageMembers && isLastAdmin && (
                      <span className="text-xs text-muted-foreground italic">Last admin</span>
                    )}
                  </div>

                  {showPromoteConfirm === member.user_id && (
                    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                      <Card className="w-96">
                        <CardHeader>
                          <CardTitle>Promote to Admin</CardTitle>
                          <CardDescription>Are you sure you want to make {member.email} an admin?</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Admins can manage team members, departments, and settings.</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handlePromoteToAdmin(member.user_id)} disabled={actionLoading}>
                              {actionLoading ? 'Promoting...' : 'Yes, Promote'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowPromoteConfirm(null)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {showDemoteConfirm === member.user_id && (
                    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                      <Card className="w-96">
                        <CardHeader>
                          <CardTitle>Remove Admin</CardTitle>
                          <CardDescription>Change {member.email}&apos;s role from Admin to:</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <select
                            value={demoteRole}
                            onChange={(e) => setDemoteRole(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm mb-4"
                          >
                            {roles.filter((r: any) => r.name !== 'ADMIN').map((r: any) => (
                              <option key={r.name} value={r.name}>{r.label}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRemoveAdmin(member.user_id, demoteRole)} disabled={actionLoading}>
                              {actionLoading ? 'Updating...' : 'Confirm'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowDemoteConfirm(null)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
