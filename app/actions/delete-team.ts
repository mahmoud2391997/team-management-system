'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'

export async function deleteTeam(teamId: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const profile = await db.collection('profiles').findOne({ user_id: session.userId })
  if (!profile) return { error: 'Not authenticated' }

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

  if (!perms.includes('team.delete')) {
    return { error: "You don't have permission to delete the team" }
  }

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })
  if (!team) return { error: 'Team not found' }
  if (team.owner_id !== session.userId) {
    return { error: 'Only the team owner can delete the team' }
  }

  const departments = await db.collection('departments').find({ team_id: teamId }).toArray()
  const deptIds = departments.map(d => d._id.toString())

  if (deptIds.length > 0) {
    const tasks = await db.collection('tasks').find({ department_id: { $in: deptIds } }).toArray()
    const taskIds = tasks.map(t => t._id.toString())

    if (taskIds.length > 0) {
      await db.collection('subtasks').deleteMany({ task_id: { $in: taskIds } })
      await db.collection('comments').deleteMany({ task_id: { $in: taskIds } })
      await db.collection('tasks').deleteMany({ _id: { $in: taskIds.map(id => new ObjectId(id)) } })
    }

    await db.collection('employees').deleteMany({ department_id: { $in: deptIds } })
    await db.collection('departments').deleteMany({ team_id: teamId })
  }

  const members = await db.collection('team_members').find({ team_id: teamId }).toArray()
  const memberIds = members.map(m => m.user_id)

  for (const userId of memberIds) {
    const otherTeam = await db.collection('team_members').findOne({ user_id: userId, team_id: { $ne: teamId } })
    if (otherTeam) {
      await db.collection('profiles').updateOne(
        { user_id: userId },
        { $set: { team_id: otherTeam.team_id, role: otherTeam.role, updated_at: new Date() } }
      )
    } else {
      await db.collection('profiles').updateOne(
        { user_id: userId },
        { $set: { team_id: null, role: 'EMPLOYEE', updated_at: new Date() } }
      )
    }
  }

  await db.collection('team_members').deleteMany({ team_id: teamId })
  await db.collection('invitations').deleteMany({ team_id: teamId })
  await db.collection('notifications').deleteMany({ team_id: teamId })
  await db.collection('roles').deleteMany({ team_id: teamId })

  await db.collection('teams').deleteOne({ _id: new ObjectId(teamId) })

  const nextMember = await db.collection('team_members').findOne({ user_id: session.userId })
  if (nextMember) {
    await db.collection('profiles').updateOne(
      { user_id: session.userId },
      { $set: { team_id: nextMember.team_id, role: nextMember.role, updated_at: new Date() } }
    )
    return { success: true, nextTeamId: nextMember.team_id }
  }

  return { success: true, nextTeamId: null }
}
