'use client'

import { useEffect, useState } from 'react'
import { getProfiles, getProfile } from '@/lib/actions/data-actions'
import { getTeamRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles'
import { updateUserRole } from '@/app/actions/update-role'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Shield, X, Check } from 'lucide-react'
import { ALL_PERMISSIONS, permissionLabel, permissionGroup, type Permission } from '@/lib/permissions'
import { usePermissions } from '@/components/dashboard/permissions-context'

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800',
}

export default function RolesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [newRole, setNewRole] = useState('')
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [createRoleName, setCreateRoleName] = useState('')
  const [createRoleLabel, setCreateRoleLabel] = useState('')
  const [createRolePerms, setCreateRolePerms] = useState<Permission[]>([])
  const [roleLoading, setRoleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { permissions, refreshPermissions } = usePermissions()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const profile = await getProfile()
    if (profile) {
      setCurrentUser({ id: profile.user_id, role: profile.role })
      if (profile.team_id) {
        const data = await getProfiles()
        setProfiles(data)
        const rolesResult = await getTeamRoles()
        if (rolesResult.success) setRoles(rolesResult.data || [])
      }
    }
    setLoading(false)
  }

  const handleRoleUpdate = async (profileId: string, role: string) => {
    const adminCount = profiles.filter(p => p.role === 'ADMIN').length
    const targetProfile = profiles.find(p => p.id === profileId)
    const isLastAdmin = targetProfile?.role === 'ADMIN' && adminCount === 1
    if (isLastAdmin) return

    const result = await updateUserRole(profileId, role)
    if (result.error) {
      setError(result.error)
    } else {
      await refreshPermissions()
      fetchData()
      setEditingProfile(null)
    }
  }

  const handleCreateRole = async () => {
    setRoleLoading(true)
    setError(null)
    const result = await createRole(createRoleName, createRoleLabel, createRolePerms)
    if (result.error) {
      setError(result.error)
      setRoleLoading(false)
      return
    }
    setShowCreateRole(false)
    setCreateRoleName('')
    setCreateRoleLabel('')
    setCreateRolePerms([])
    await refreshPermissions()
    await fetchData()
    setRoleLoading(false)
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return
    setRoleLoading(true)
    setError(null)
    const result = await updateRole(editingRole.id, createRoleLabel, createRolePerms)
    if (result.error) {
      setError(result.error)
      setRoleLoading(false)
      return
    }
    setEditingRole(null)
    setCreateRoleLabel('')
    setCreateRolePerms([])
    await refreshPermissions()
    await fetchData()
    setRoleLoading(false)
  }

  const handleDeleteRole = async (roleId: string) => {
    const result = await deleteRole(roleId)
    if (result.error) {
      setError(result.error)
      return
    }
    await refreshPermissions()
    await fetchData()
  }

  const startEditRole = (role: any) => {
    setEditingRole(role)
    setCreateRoleLabel(role.label)
    setCreateRolePerms([...role.permissions])
    setShowCreateRole(false)
    setError(null)
  }

  const togglePerm = (perm: Permission) => {
    setCreateRolePerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const groupedPerms = ALL_PERMISSIONS.reduce<Record<string, Permission[]>>((acc, perm) => {
    const group = permissionGroup(perm)
    if (!acc[group]) acc[group] = []
    acc[group].push(perm)
    return acc
  }, {})

  const getRoleColor = (roleName: string) => roleColors[roleName] || 'bg-purple-100 text-purple-800'

  const canManageRoles = permissions.includes('roles.manage')
  const canAssignRoles = permissions.includes('members.assign_role')

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-2">{canManageRoles ? 'Create roles, assign permissions, and manage user roles' : 'View your role and permissions'}</p>
        </div>
        {canManageRoles && (
          <Button onClick={() => { setShowCreateRole(!showCreateRole); setEditingRole(null); setError(null); setCreateRoleName(''); setCreateRoleLabel(''); setCreateRolePerms([]) }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {showCreateRole && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
            <CardDescription>Define a new role with specific permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name (code)</Label>
                <Input placeholder="e.g. TEAM_LEAD" value={createRoleName} onChange={e => setCreateRoleName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display Label</Label>
                <Input placeholder="e.g. Team Lead" value={createRoleLabel} onChange={e => setCreateRoleLabel(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group}>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{group}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {perms.map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={createRolePerms.includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="rounded"
                        />
                        {permissionLabel(perm)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateRole} disabled={roleLoading || !createRoleName.trim()}>
                {roleLoading ? 'Creating...' : 'Create Role'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateRole(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingRole && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Role: {editingRole.label}</CardTitle>
            <CardDescription>{editingRole.is_builtin ? 'Built-in role — permissions affect all teams' : 'Custom role — edit permissions'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input value={createRoleLabel} onChange={e => setCreateRoleLabel(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group}>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{group}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {perms.map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={createRolePerms.includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="rounded"
                        />
                        {permissionLabel(perm)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateRole} disabled={roleLoading}>
                {roleLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles
          .filter(role => canManageRoles || role.name === currentUser?.role)
          .map((role) => (
          <Card key={role.id} className="border border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-lg ${getRoleColor(role.name)}`}>
                  {role.label}
                </CardTitle>
                {canManageRoles && !role.is_builtin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditRole(role)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {!role.is_builtin && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <CardDescription>{role.is_builtin ? 'Built-in' : 'Custom'} — {role.permissions.length} permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {role.permissions.map((perm: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                    {permissionLabel(perm as Permission)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {canAssignRoles && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Manage User Roles</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : profiles.length === 0 ? (
            <Card className="p-12 text-center border border-border bg-card">
              <p className="text-muted-foreground">No users found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const adminCount = profiles.filter(p => p.role === 'ADMIN').length
                const isLastAdmin = profile.role === 'ADMIN' && adminCount === 1
                const isSelf = profile.id === currentUser?.id
                const canEditRole = !isLastAdmin

                return (
                  <Card key={profile.id} className="p-4 border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {profile.first_name?.[0] || profile.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {profile.first_name && profile.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile.email}
                            {isSelf && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(profile.role || 'EMPLOYEE')}`}>
                          {profile.role || 'EMPLOYEE'}
                        </span>

                        {canEditRole && (
                          <>
                            {editingProfile?.id === profile.id ? (
                              <div className="flex gap-2">
                                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm">
                                  {roles.map((r) => (
                                    <option key={r.name} value={r.name}>{r.label}</option>
                                  ))}
                                </select>
                                <Button size="sm" onClick={() => newRole && handleRoleUpdate(profile.id, newRole)}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => { setEditingProfile(profile); setNewRole(profile.role || 'EMPLOYEE') }}>
                                Edit Role
                              </Button>
                            )}
                          </>
                        )}
                        {isLastAdmin && (
                          <span className="text-xs text-muted-foreground italic">Last admin — cannot edit</span>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
