'use server'

import { connectToDatabase } from '@/lib/mongodb'
import { getSessionFromCookies, hashPassword, comparePassword, setSessionCookie } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function createTeamWithAccount(teamName: string, email: string, password: string) {
  if (!teamName.trim()) return { error: 'Team name is required' }
  if (!email.trim()) return { error: 'Email is required' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }

  const { db } = await connectToDatabase()

  const existingUser = await db.collection('users').findOne({ email: email.toLowerCase().trim() })

  let userId: string

  if (existingUser) {
    const valid = await comparePassword(password, existingUser.password_hash)
    if (!valid) {
      return { error: 'Incorrect password for this account' }
    }
    userId = existingUser._id.toString()
  } else {
    const passwordHash = await hashPassword(password)
    const result = await db.collection('users').insertOne({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      created_at: new Date(),
    })
    userId = result.insertedId.toString()

    await db.collection('profiles').insertOne({
      user_id: userId,
      email: email.toLowerCase().trim(),
      first_name: null,
      last_name: null,
      role: 'ADMIN',
      team_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  const teamResult = await db.collection('teams').insertOne({
    name: teamName.trim(),
    owner_id: userId,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const teamId = teamResult.insertedId.toString()

  await db.collection('profiles').updateOne(
    { user_id: userId },
    { $set: { team_id: teamId, role: 'ADMIN', updated_at: new Date() } }
  )

  await db.collection('team_members').updateOne(
    { user_id: userId, team_id: teamId },
    {
      $set: {
        user_id: userId,
        team_id: teamId,
        role: 'ADMIN',
        is_active: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  )

  await db.collection('departments').insertOne({
    name: 'Engineering',
    icon: 'code',
    manager_id: userId,
    team_id: teamId,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const existingSession = await getSessionFromCookies()
  if (!existingSession || existingSession.userId !== userId) {
    await setSessionCookie({ userId, email: email.toLowerCase().trim() })
  }

  return { success: true }
}

export async function createTeamForUser(teamName: string) {
  if (!teamName.trim()) return { error: 'Team name is required' }

  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const { db } = await connectToDatabase()

  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
  if (!user) return { error: 'User not found' }

  const userId = user._id.toString()

  const teamResult = await db.collection('teams').insertOne({
    name: teamName.trim(),
    owner_id: userId,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const teamId = teamResult.insertedId.toString()

  await db.collection('profiles').updateOne(
    { user_id: userId },
    { $set: { team_id: teamId, role: 'ADMIN', updated_at: new Date() } }
  )

  await db.collection('team_members').updateOne(
    { user_id: userId, team_id: teamId },
    {
      $set: {
        user_id: userId,
        team_id: teamId,
        role: 'ADMIN',
        is_active: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  )

  await db.collection('departments').insertOne({
    name: 'Engineering',
    icon: 'code',
    manager_id: userId,
    team_id: teamId,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return { success: true }
}
