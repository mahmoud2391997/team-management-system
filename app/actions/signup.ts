'use server'

import { getSupabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

export async function signUpInvited(email: string, password: string) {
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

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    return { error: 'Failed to create account' }
  }

  await supabase
    .from('profiles')
    .insert({
      id: newUser.id,
      user_id: newUser.id,
      email: email.toLowerCase().trim(),
      first_name: null,
      last_name: null,
      role: 'EMPLOYEE',
      team_id: null,
    })

  return { success: true, userId: newUser.id }
}
