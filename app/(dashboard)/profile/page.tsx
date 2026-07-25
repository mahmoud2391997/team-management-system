'use client'

import { useEffect, useState } from 'react'
import { getUserInfo, resetPassword, updateProfile } from '@/lib/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Shield, User } from 'lucide-react'

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    setLoading(true)
    const info = await getUserInfo()
    setUserInfo(info)
    setEditFirstName(info?.first_name || '')
    setEditLastName(info?.last_name || '')
    setLoading(false)
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameLoading(true)
    setNameError(null)
    setNameSuccess(null)

    const result = await updateProfile(editFirstName, editLastName)
    if (result.error) {
      setNameError(result.error)
    } else {
      setNameSuccess('Name updated successfully')
      setUserInfo((prev: any) => ({ ...prev, first_name: editFirstName || null, last_name: editLastName || null }))
    }
    setNameLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwLoading(true)
    setPwError(null)
    setPwSuccess(null)

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      setPwLoading(false)
      return
    }

    const result = await resetPassword(currentPassword, newPassword)
    if (result.error) {
      setPwError(result.error)
    } else {
      setPwSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPwLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Could not load profile.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-2">View your account details and reset your password</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary text-2xl">
                {(editFirstName || userInfo.first_name)?.[0] || userInfo.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl">
                {(editFirstName || userInfo.first_name) && (editLastName || userInfo.last_name)
                  ? `${editFirstName || userInfo.first_name} ${editLastName || userInfo.last_name}`
                  : userInfo.email}
              </CardTitle>
              <CardDescription>{userInfo.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUpdateName} className="space-y-4 max-w-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            {nameSuccess && <p className="text-sm text-green-600">{nameSuccess}</p>}
            <Button type="submit" size="sm" disabled={nameLoading}>
              {nameLoading ? 'Saving...' : 'Save Name'}
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{userInfo.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Role</p>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium">{userInfo.role}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Member Since</p>
              <p className="font-medium">{new Date(userInfo.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">{pwSuccess}</p>}
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
