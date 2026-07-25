'use server'

import { getSupabase } from '@/lib/supabase'
import { hashPassword, setSessionCookie, removeSessionCookie, getSessionFromCookies, getProfileForUser } from '@/lib/auth'

export async function login(email: string, password: string) {
  const supabase = getSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const bcrypt = await import('bcryptjs')
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password' }
  }

  await setSessionCookie({ userId: user.id, email: user.email })

  return { success: true }
}

export async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const passwordHash = await hashPassword(password)

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase().trim(), password_hash: passwordHash })
    .select()
    .single()

  if (insertError || !newUser) {
    return { error: 'Failed to create account' }
  }

  await supabase.from('profiles').insert({
    id: newUser.id,
    email: email.toLowerCase().trim(),
    first_name: firstName || null,
    last_name: lastName || null,
    role: 'EMPLOYEE',
    team_id: null,
  })

  await setSessionCookie({ userId: newUser.id, email: email.toLowerCase().trim() })

  return { success: true, userId: newUser.id }
}

export async function logout() {
  await removeSessionCookie()
  return { success: true }
}

export async function getUserInfo() {
  const session = await getSessionFromCookies()
  if (!session) return null

  const supabase = getSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!user) return null

  const profile = await getProfileForUser(session.userId, session.email)

  return {
    id: user.id,
    email: user.email,
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    role: profile?.team_id ? (profile?.role || 'EMPLOYEE') : 'N/A',
    team_id: profile?.team_id || null,
    created_at: user.created_at,
  }
}

export async function updateProfile(firstName: string, lastName: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  const supabase = getSupabase()

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.userId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function demoLogin() {
  const supabase = getSupabase()
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'freelancing589@gmail.com')
    .single()

  if (!user) return { error: 'Demo account not found' }

  await setSessionCookie({ userId: user.id, email: user.email })
  return { success: true }
}

export async function resetPassword(currentPassword: string, newPassword: string) {
  const session = await getSessionFromCookies()
  if (!session) return { error: 'Not authenticated' }

  if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' }

  const supabase = getSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!user) return { error: 'User not found' }

  const bcrypt = await import('bcryptjs')
  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return { error: 'Current password is incorrect' }

  const newHash = await hashPassword(newPassword)
  await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', session.userId)

  return { success: true }
}
