'use client'

import { useState } from 'react'
import { createTeamWithAccount } from '@/app/actions/create-team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import AuthNavbar from '@/components/auth-navbar'

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!isRegistered && password !== repeatPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const result = await createTeamWithAccount(teamName, email, password, isRegistered ? undefined : firstName, isRegistered ? undefined : lastName)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Team</CardTitle>
          <CardDescription>
            Set up your team and account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                placeholder="e.g. My Team"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            {!isRegistered && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="isRegistered"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={isRegistered}
                onChange={(e) => { setIsRegistered(e.target.checked); setRepeatPassword('') }}
              />
              <Label htmlFor="isRegistered" className="text-sm font-normal cursor-pointer">Already registered</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="leader@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{isRegistered ? 'Password' : 'Create Password'}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isRegistered && (
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  minLength={6}
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="underline underline-offset-4">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
