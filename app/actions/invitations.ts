'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/auth'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

async function checkPermission(permission: Permission): Promise<{ allowed: boolean; profile?: any }> {
  const session = await getSessionFromCookies()
  if (!session) return { allowed: false }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!profile) return { allowed: false }

  const roleName = profile.role
  let perms: Permission[] = []

  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const { data: customRole } = await supabase
      .from('roles')
      .select('permissions')
      .eq('team_id', profile.team_id)
      .eq('name', roleName)
      .single()
    perms = customRole?.permissions || []
  }

  if (!perms.includes(permission)) return { allowed: false }
  return { allowed: true, profile }
}

export async function inviteMember(email: string, role: string) {
  const { allowed, profile: currentProfile } = await checkPermission('members.invite')
  if (!allowed || !currentProfile) return { error: 'You don\'t have permission to invite members' }

  const session = await getSessionFromCookies()
  const teamId = currentProfile.team_id
  if (!teamId || !session) return { error: 'No team' }

  if (email.trim().toLowerCase() === session.email?.toLowerCase()) {
    return { error: 'You cannot invite yourself to the team' }
  }

  const supabase = getSupabase()

  const emailLower = email.trim().toLowerCase()

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', emailLower)
    .single()

  const isRegistered = !!existingUser

  if (existingUser) {
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('user_id', existingUser.id)
      .eq('team_id', teamId)
      .single()

    if (existingMember) {
      await supabase
        .from('profiles')
        .update({ team_id: teamId, role: existingMember.role || role, updated_at: new Date().toISOString() })
        .eq('id', existingUser.id)

      return { error: 'This user is already on your team' }
    }
  }

  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .eq('team_id', teamId)
    .is('accepted_at', null)
    .single()

  if (existingInvite) {
    return { error: 'This email already has a pending invitation' }
  }

  const { data: inviteResult, error: inviteError } = await supabase
    .from('invitations')
    .insert({
      team_id: teamId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: session.userId,
    })
    .select('id')
    .single()

  if (inviteError) return { error: inviteError.message }

  const inviteId = inviteResult.id

  const { data: team } = await supabase
    .from('Team')
    .select('name')
    .eq('id', teamId)
    .single()

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
  let emailSent = false
  let emailError: string | null = null

  try {
    const { sendTeamInviteEmail, sendSignupInviteEmail } = await import('@/lib/email')

    if (isRegistered) {
      await sendTeamInviteEmail({
        to: email.trim(),
        teamName: team?.name || 'a team',
        role,
        loginUrl: `${siteUrl}/auth/login`,
      })
    } else {
      await sendSignupInviteEmail({
        to: email.trim(),
        teamName: team?.name || 'a team',
        role,
        signupUrl: `${siteUrl}/auth/sign-up`,
        invitedBy: session.email || 'Someone',
      })
    }
    emailSent = true
  } catch (e: any) {
    console.error('Email send failed:', e)
    emailError = e.message || 'Failed to send email'
  }

  if (isRegistered) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: existingUser!.id,
          type: 'team_invitation',
          title: 'Team Invitation',
          message: `You've been invited to join ${team?.name || 'a team'} as ${role}`,
          data: {
            invitation_id: inviteId,
            team_id: teamId,
            team_name: team?.name,
            role,
            invited_by: session.email,
          },
          read: false,
        })
    } catch (e) {
      console.error('Notification insert failed:', e)
    }
  }

  if (!emailSent) {
    return { success: true, message: `Invitation recorded but email failed: ${emailError}. The user can still join via the notification.`, isRegistered }
  }

  if (isRegistered) {
    return { success: true, message: `Invitation sent to ${email} (existing user — login link sent)`, isRegistered }
  }

  return { success: true, message: `Invitation sent to ${email} (new user — signup link sent)`, isRegistered }
}

export async function getNotifications() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const supabase = getSupabase()

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false })

  const validNotifications: any[] = []

  for (const n of (data || [])) {
    if (n.type === 'team_invitation') {
      const nData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data
      if (!nData?.invitation_id) {
        await supabase.from('notifications').delete().eq('id', n.id)
        continue
      }

      const { data: inviteCheck } = await supabase
        .from('invitations')
        .select('id, accepted_at')
        .eq('id', nData.invitation_id)
        .single()

      if (!inviteCheck || inviteCheck.accepted_at) {
        await supabase.from('notifications').delete().eq('id', n.id)
        continue
      }
    }
    validNotifications.push(n)
  }

  return { success: true, data: validNotifications }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabase()
  await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)

  return { success: true }
}

export async function getUnreadNotificationCount() {
  const session = await getSessionFromCookies()
  if (!session) return { success: true, count: 0 }

  const supabase = getSupabase()

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.userId)
    .eq('read', false)

  return { success: true, count: count || 0 }
}

export async function markAllNotificationsRead() {
  const session = await getSessionFromCookies()
  if (!session) return { success: false }

  const supabase = getSupabase()

  await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('user_id', session.userId)
    .eq('read', false)

  return { success: true }
}

export async function acceptTeamInvitation(notificationId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', session.userId)
    .single()

  console.log('Accept invitation - notification:', notification, 'error:', notifError)

  if (notifError || !notification) return { error: 'Notification not found' }

  const data = typeof notification.data === 'string'
    ? JSON.parse(notification.data)
    : notification.data

  console.log('Accept invitation - data:', data)

  if (!data) return { error: 'Invalid notification data' }

  const { invitation_id, team_id, role } = data

  console.log('Accept invitation - team_id:', team_id, 'role:', role, 'invitation_id:', invitation_id)

  if (!team_id) return { error: 'No team associated with this invitation' }

  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', session.userId)
    .eq('team_id', team_id)
    .single()

  console.log('Accept invitation - existingMember:', existingMember)

  if (existingMember) {
    await supabase
      .from('team_members')
      .update({ role: role || 'EMPLOYEE', is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existingMember.id)
  } else {
    const { data: insertResult, error: memberError } = await supabase
      .from('team_members')
      .insert({
        user_id: session.userId,
        team_id,
        role: role || 'EMPLOYEE',
        is_active: true,
      })
      .select()

    console.log('Accept invitation - insert result:', insertResult, 'error:', memberError)

    if (memberError) return { error: `Failed to join team: ${memberError.message}` }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ team_id, role: role || 'EMPLOYEE', updated_at: new Date().toISOString() })
    .eq('id', session.userId)

  console.log('Accept invitation - profile update error:', profileError)

  // If profile doesn't exist, create it
  if (profileError) {
    console.log('Profile update failed, trying to create profile')
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.userId)
      .single()

    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: session.userId,
        email: userData?.email || session.email,
        team_id,
        role: role || 'EMPLOYEE',
        first_name: null,
        last_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    console.log('Accept invitation - profile create error:', createError)

    if (createError) return { error: `Failed to create profile: ${createError.message}` }
  }

  if (invitation_id) {
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', invitation_id)
  }

  await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)

  return { success: true }
}

export async function switchTeam(teamId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: membership } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', session.userId)
    .eq('team_id', teamId)
    .single()

  if (!membership) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', session.userId)
      .single()

    if (profile?.team_id !== teamId) {
      return { error: 'You are not a member of this team' }
    }
  }

  const teamRole = membership?.role || 'EMPLOYEE'

  await supabase
    .from('profiles')
    .update({ team_id: teamId, role: teamRole, updated_at: new Date().toISOString() })
    .eq('id', session.userId)

  await supabase
    .from('team_members')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('user_id', session.userId)
    .eq('team_id', teamId)

  await supabase
    .from('team_members')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', session.userId)
    .neq('team_id', teamId)

  return { success: true }
}

export async function getUserTeams() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  const activeTeamId = profile?.team_id || null

  const { data: memberTeams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', session.userId)

  const teamIds = [...new Set((memberTeams || []).map(m => m.team_id))]

  if (teamIds.length === 0) return { success: true, data: [], activeTeamId: null }

  const { data: teams } = await supabase
    .from('Team')
    .select('id, name')
    .in('id', teamIds)

  const result = (teams || []).map(t => ({ id: t.id, name: t.name }))

  if (activeTeamId && !result.find(t => t.id === activeTeamId) && result.length > 0) {
    const fallback = result[0]
    await supabase
      .from('profiles')
      .update({ team_id: fallback.id, updated_at: new Date().toISOString() })
      .eq('id', session.userId)
    return { success: true, data: result, activeTeamId: fallback.id }
  }

  return { success: true, data: result, activeTeamId }
}

export async function getPendingInvites() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', session.userId)
    .single()

  if (!profile?.team_id) return { error: 'No team', data: [] }

  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('team_id', profile.team_id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return {
    success: true,
    data: data || [],
  }
}

export async function revokeInvite(inviteId: string) {
  const { allowed, profile: currentProfile } = await checkPermission('members.remove')
  if (!allowed || !currentProfile) return { error: 'You don\'t have permission to revoke invitations' }

  const supabase = getSupabase()

  const { data: invite } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', inviteId)
    .eq('team_id', currentProfile.team_id)
    .single()

  if (!invite) return { error: 'Invitation not found' }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', invite.email)
    .single()

  if (targetProfile) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetProfile.id)
        .eq('type', 'team_invitation')
    } catch (e) {
      console.error('Failed to delete notification:', e)
    }
  }

  await supabase
    .from('invitations')
    .delete()
    .eq('id', inviteId)
    .eq('team_id', currentProfile.team_id)

  return { success: true }
}

export async function checkInvitation(email: string) {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('invitations')
    .select('team_id, role')
    .eq('email', email.trim().toLowerCase())
    .is('accepted_at', null)
    .single()

  if (!data) return { invited: false }
  return {
    invited: true,
    teamId: data.team_id,
    role: data.role,
  }
}

export async function createInviteNotifications(userId: string, email: string) {
  const supabase = getSupabase()

  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .is('accepted_at', null)

  for (const invite of (pendingInvites || [])) {
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'team_invitation')
      .single()

    if (existingNotif) continue

    const { data: team } = await supabase
      .from('Team')
      .select('name')
      .eq('id', invite.team_id)
      .single()

    const { data: invitedByUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', invite.invited_by)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'team_invitation',
        title: 'Team Invitation',
        message: `You've been invited to join ${team?.name || 'a team'} as ${invite.role}`,
        data: {
          invitation_id: invite.id,
          team_id: invite.team_id,
          team_name: team?.name,
          role: invite.role,
          invited_by: invitedByUser?.email || 'Someone',
        },
        read: false,
      })
  }
}

export async function declineTeamInvitation(notificationId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { data: notification } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', session.userId)
    .single()

  if (!notification) return { error: 'Notification not found' }

  const data = typeof notification.data === 'string'
    ? JSON.parse(notification.data)
    : notification.data

  const { invitation_id, team_id, team_name } = data

  await supabase
    .from('notifications')
    .update({
      type: 'invitation_declined',
      title: 'Invitation Declined',
      message: `You declined the invitation to join ${team_name || 'a team'}`,
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (invitation_id) {
    const { data: invite } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single()

    if (invite) {
      const { data: inviterUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', invite.invited_by)
        .single()

      if (inviterUser) {
        await supabase
          .from('notifications')
          .insert({
            user_id: inviterUser.id,
            type: 'invitation_declined',
            title: 'Invitation Declined',
            message: `${session.email || 'Someone'} declined the invitation to join ${team_name || 'your team'}`,
            data: {
              invitation_id,
              team_id,
              team_name,
              declined_by: session.email,
            },
            read: false,
          })
      }
    }

    await supabase.from('invitations').delete().eq('id', invitation_id)
  }

  return { success: true }
}
