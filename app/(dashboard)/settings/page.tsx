'use client'

import { useEffect, useState } from 'react'
import { getProfile, getTeam, getTeamMembers } from '@/lib/actions/data-actions'
import { deleteTeam } from '@/app/actions/delete-team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const profile = await getProfile()
    if (!profile?.team_id) {
      setLoading(false)
      return
    }

    setCurrentUser(profile)

    const teamData = await getTeam()
    setTeam(teamData)

    const membersData = await getTeamMembers()
    setMembers(membersData)

    setLoading(false)
  }

  const isOwner = currentUser && team && currentUser.id === team.owner_id
  const isAdminCount = members.filter((m: any) => m.role === 'ADMIN').length
  const isOnlyAdmin = currentUser?.role === 'ADMIN' && isAdminCount <= 1
  const canDeleteTeam = currentUser?.role === 'ADMIN'

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteTeam = async () => {
    setActionLoading(true)
    setDeleteError(null)
    try {
      const result = await deleteTeam(team!.id)
      if (result.error) {
        setDeleteError(result.error)
        setActionLoading(false)
        return
      }
      setShowDeleteConfirm(false)
      window.location.href = result.nextTeamId ? '/dashboard' : '/'
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'An unexpected error occurred')
      setActionLoading(false)
    }
  }

  const handleLeaveTeam = async () => {
    setLeaveLoading(true)
    const { leaveTeam } = await import('@/lib/actions/data-actions')
    await leaveTeam()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">You are not part of any team.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>Your team information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{team.name}</p>
            <p className="text-sm text-muted-foreground">Team ID: {team.id}</p>
          </div>
          {canDeleteTeam ? (
            <div>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Only admins can delete the team.</p>
          )}
          {showDeleteConfirm && (
            <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-medium">Delete Team</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete the team, all departments, employees, and tasks.
                All members will be removed from the team.
              </p>
              {deleteError && <p className="text-sm text-destructive mb-4">{deleteError}</p>}
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteTeam} disabled={actionLoading}>
                  {actionLoading ? 'Deleting...' : 'Yes, Delete Team'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isOnlyAdmin && members.length > 1 && (
      <Card>
        <CardHeader>
          <CardTitle>Leave Team</CardTitle>
          <CardDescription>Remove yourself from this team</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You will lose access to this team and all its data.
          </p>
          <Button variant="destructive" size="sm" onClick={handleLeaveTeam} disabled={leaveLoading}>
            {leaveLoading ? 'Leaving...' : 'Leave Team'}
          </Button>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
