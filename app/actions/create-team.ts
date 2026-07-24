'use server'

import { getSupabase } from '@/lib/supabase'
import { getSessionFromCookies, hashPassword, comparePassword, setSessionCookie } from '@/lib/auth'

export async function createTeamWithAccount(teamName: string, email: string, password: string) {
  if (!teamName.trim()) return { error: 'Team name is required' }
  if (!email.trim()) return { error: 'Email is required' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }

  const supabase = getSupabase()

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  let userId: string

  if (existingUser) {
    const valid = await comparePassword(password, existingUser.password_hash)
    if (!valid) return { error: 'Incorrect password for this account' }
    userId = existingUser.id
  } else {
    const passwordHash = await hashPassword(password)
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase().trim(), password_hash: passwordHash })
      .select('id')
      .single()

    if (userError || !newUser) return { error: 'Failed to create account' }
    userId = newUser.id

    await supabase.from('profiles').insert({
      id: userId,
      user_id: userId,
      email: email.toLowerCase().trim(),
      first_name: null,
      last_name: null,
      role: 'ADMIN',
      team_id: null,
    })
  }

  const { data: teamResult, error: teamError } = await supabase
    .from('Team')
    .insert({ name: teamName.trim(), owner_id: userId })
    .select('id')
    .single()

  if (teamError || !teamResult) {
    console.error('Team insert error:', JSON.stringify(teamError))
    return { error: teamError?.message || 'Failed to create team' }
  }
  const teamId = teamResult.id

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ team_id: teamId, role: 'ADMIN', updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileErr) console.error('Profile update error:', JSON.stringify(profileErr))

  const { error: tmErr } = await supabase.from('team_members').insert({
    user_id: userId,
    team_id: teamId,
    role: 'ADMIN',
    is_active: true,
  })
  if (tmErr) console.error('team_members insert error:', JSON.stringify(tmErr))

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

  console.log('createTeamForUser session:', JSON.stringify(session))

  const supabase = getSupabase()

  const { data: teamResult, error: teamError } = await supabase
    .from('Team')
    .insert({ name: teamName.trim(), owner_id: session.userId })
    .select('id')
    .single()

  if (teamError || !teamResult) {
    console.error('createTeamForUser - Team insert error:', JSON.stringify(teamError))
    return { error: teamError?.message || 'Failed to create team' }
  }
  const teamId = teamResult.id

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ team_id: teamId, role: 'ADMIN', updated_at: new Date().toISOString() })
    .eq('id', session.userId)
  if (profileErr) console.error('createTeamForUser - Profile update error:', JSON.stringify(profileErr))

  const { error: tmErr } = await supabase.from('team_members').insert({
    user_id: session.userId,
    team_id: teamId,
    role: 'ADMIN',
    is_active: true,
  })
  if (tmErr) console.error('createTeamForUser - team_members insert error:', JSON.stringify(tmErr))

  return { success: true }
}
