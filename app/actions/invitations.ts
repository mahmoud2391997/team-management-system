'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

async function checkPermission(permission: Permission): Promise<{ allowed: boolean; profile?: any; db?: any }> {
  const session = await getSessionFromCookies()
  if (!session) return { allowed: false }

  const { db } = await connectToDatabase()
  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return { allowed: false }

  const roleName = profile.role
  let perms: Permission[] = []

  if (DEFAULT_ROLES[roleName]) {
    perms = DEFAULT_ROLES[roleName].permissions
  } else {
    const customRole = await db.collection('roles').findOne({
      team_id: profile.team_id,
      name: roleName,
    })
    perms = customRole?.permissions || []
  }

  if (!perms.includes(permission)) return { allowed: false }
  return { allowed: true, profile, db }
}

export async function inviteMember(email: string, role: string) {
  const { allowed, profile: currentProfile, db } = await checkPermission('members.invite')
  if (!allowed || !currentProfile) return { error: 'You don\'t have permission to invite members' }

  const session = await getSessionFromCookies()
  const teamId = currentProfile.team_id
  if (!teamId || !session) return { error: 'No team' }

  if (email.trim().toLowerCase() === session.email?.toLowerCase()) {
    return { error: 'You cannot invite yourself to the team' }
  }

  const targetProfile = await db.collection('profiles').findOne({ email: email.trim().toLowerCase() })
  if (targetProfile) {
    const existingMember = await db.collection('team_members').findOne({
      user_id: targetProfile.user_id,
      team_id: teamId,
    })
    if (existingMember) {
      return { error: 'This user is already on your team' }
    }
  }

  const existingInvite = await db.collection('invitations').findOne({
    email: email.trim().toLowerCase(),
    team_id: teamId,
    accepted_at: null,
  })
  if (existingInvite) {
    return { error: 'This email already has a pending invitation' }
  }

  const inviteResult = await db.collection('invitations').insertOne({
    team_id: teamId,
    email: email.trim().toLowerCase(),
    role,
    invited_by: session.userId,
    accepted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const inviteId = inviteResult.insertedId.toString()

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
  let emailSent = false
  let emailError: string | null = null

  try {
    const { sendTeamInviteEmail, sendSignupInviteEmail } = await import('@/lib/email')

    if (targetProfile) {
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

  if (targetProfile) {
    await db.collection('notifications').insertOne({
      user_id: targetProfile.user_id,
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
      team_id: teamId,
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  if (!emailSent) {
    return { success: true, message: `Invitation recorded but email failed: ${emailError}. The user can still join via the notification.` }
  }

  return { success: true, message: `Invitation email sent to ${email}` }
}

export async function getNotifications() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const { db } = await connectToDatabase()

  const data = await db.collection('notifications')
    .find({ user_id: session.userId })
    .sort({ created_at: -1 })
    .toArray()

  const validNotifications: any[] = []

  for (const n of data) {
    if (n.type === 'team_invitation') {
      const nData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data
      if (!nData?.invitation_id) continue

      const inviteCheck = await db.collection('invitations').findOne({
        _id: new ObjectId(nData.invitation_id),
      })

      if (!inviteCheck) {
        await db.collection('notifications').deleteOne({ _id: n._id })
        continue
      }
    }
    validNotifications.push({
      ...n,
      _id: n._id.toString(),
    })
  }

  return { success: true, data: validNotifications }
}

export async function markNotificationRead(notificationId: string) {
  const { db } = await connectToDatabase()
  await db.collection('notifications').updateOne(
    { _id: new ObjectId(notificationId) },
    { $set: { read: true, updated_at: new Date() } }
  )
  return { success: true }
}

export async function acceptTeamInvitation(notificationId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const notification = await db.collection('notifications').findOne({
    _id: new ObjectId(notificationId),
    user_id: session.userId,
  })

  if (!notification) return { error: 'Notification not found' }

  const data = typeof notification.data === 'string'
    ? JSON.parse(notification.data)
    : notification.data

  const { invitation_id, team_id, role } = data

  await db.collection('team_members').updateOne(
    { user_id: session.userId, team_id },
    {
      $set: {
        user_id: session.userId,
        team_id,
        role,
        is_active: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  )

  await db.collection('profiles').updateOne(
    { user_id: session.userId },
    { $set: { team_id, role, updated_at: new Date() } }
  )

  if (invitation_id) {
    await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitation_id) },
      { $set: { accepted_at: new Date(), updated_at: new Date() } }
    )
  }

  await db.collection('notifications').updateOne(
    { _id: new ObjectId(notificationId) },
    { $set: { read: true, updated_at: new Date() } }
  )

  return { success: true }
}

export async function switchTeam(teamId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const membership = await db.collection('team_members').findOne({
    user_id: session.userId,
    team_id: teamId,
  })

  if (!membership) {
    const profile = await db.collection('profiles').findOne({ user_id: session.userId })
    if (profile?.team_id !== teamId) {
      return { error: 'You are not a member of this team' }
    }
  }

  const teamRole = membership?.role || 'EMPLOYEE'

  await db.collection('profiles').updateOne(
    { user_id: session.userId },
    { $set: { team_id: teamId, role: teamRole, updated_at: new Date() } }
  )

  await db.collection('team_members').updateOne(
    { user_id: session.userId, team_id: teamId },
    { $set: { is_active: true, updated_at: new Date() } }
  )

  await db.collection('team_members').updateMany(
    { user_id: session.userId, team_id: { $ne: teamId } },
    { $set: { is_active: false, updated_at: new Date() } }
  )

  return { success: true }
}

export async function getUserTeams() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  const activeTeamId = profile?.team_id || null

  const memberTeams = await db.collection('team_members')
    .find({ user_id: session.userId })
    .toArray()

  const teamIds = [...new Set(memberTeams.map(m => m.team_id))]

  if (teamIds.length === 0) return { success: true, data: [], activeTeamId: null }

  const teams = await db.collection('teams')
    .find({ _id: { $in: teamIds.map(id => new ObjectId(id)) } })
    .toArray()

  const result = teams.map(t => ({ id: t._id.toString(), name: t.name }))

  if (activeTeamId && !result.find(t => t.id === activeTeamId) && result.length > 0) {
    const fallback = result[0]
    await db.collection('profiles').updateOne(
      { user_id: session.userId },
      { $set: { team_id: fallback.id, updated_at: new Date() } }
    )
    return { success: true, data: result, activeTeamId: fallback.id }
  }

  return { success: true, data: result, activeTeamId }
}

export async function getPendingInvites() {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated', data: [] }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile?.team_id) return { error: 'No team', data: [] }

  const data = await db.collection('invitations')
    .find({ team_id: profile.team_id, accepted_at: null })
    .sort({ created_at: -1 })
    .toArray()

  return {
    success: true,
    data: data.map(d => ({
      ...d,
      _id: d._id.toString(),
      id: d._id.toString(),
    })),
  }
}

export async function revokeInvite(inviteId: string) {
  const { allowed, profile: currentProfile, db } = await checkPermission('members.remove')
  if (!allowed || !currentProfile) return { error: 'You don\'t have permission to revoke invitations' }

  const invite = await db.collection('invitations').findOne({
    _id: new ObjectId(inviteId),
    team_id: currentProfile.team_id,
  })

  if (!invite) return { error: 'Invitation not found' }

  const targetProfile = await db.collection('profiles').findOne({ email: invite.email })
  if (targetProfile) {
    await db.collection('notifications').deleteOne({
      user_id: targetProfile.user_id,
      type: 'team_invitation',
      'data.invitation_id': inviteId,
    })
  }

  await db.collection('invitations').deleteOne({
    _id: new ObjectId(inviteId),
    team_id: currentProfile.team_id,
  })

  return { success: true }
}

export async function checkInvitation(email: string) {
  const { db } = await connectToDatabase()

  const data = await db.collection('invitations').findOne({
    email: email.trim().toLowerCase(),
    accepted_at: null,
  })

  if (!data) return { invited: false }
  return {
    invited: true,
    teamId: data.team_id,
    role: data.role,
  }
}

export async function createInviteNotifications(userId: string, email: string) {
  const { db } = await connectToDatabase()

  const pendingInvites = await db.collection('invitations')
    .find({ email: email.toLowerCase().trim(), accepted_at: null })
    .toArray()

  for (const invite of pendingInvites) {
    const existingNotif = await db.collection('notifications').findOne({
      user_id: userId,
      type: 'team_invitation',
      'data.invitation_id': invite._id.toString(),
    })
    if (existingNotif) continue

    const team = await db.collection('teams').findOne({ _id: new ObjectId(invite.team_id) })
    const invitedByUser = await db.collection('users').findOne({ _id: new ObjectId(invite.invited_by) })

    await db.collection('notifications').insertOne({
      user_id: userId,
      type: 'team_invitation',
      title: 'Team Invitation',
      message: `You've been invited to join ${team?.name || 'a team'} as ${invite.role}`,
      data: {
        invitation_id: invite._id.toString(),
        team_id: invite.team_id,
        team_name: team?.name,
        role: invite.role,
        invited_by: invitedByUser?.email || 'Someone',
      },
      read: false,
      team_id: invite.team_id,
      created_at: new Date(),
      updated_at: new Date(),
    })
  }
}
