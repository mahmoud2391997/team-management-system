'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNotifications, acceptTeamInvitation, declineTeamInvitation, markAllNotificationsRead } from '@/app/actions/invitations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getNotifications()
    if (result.success) {
      setNotifications(result.data || [])
    }
    await markAllNotificationsRead()
    setLoading(false)
  }

  const handleAccept = async (notificationId: string) => {
    setActionId(notificationId)
    setError(null)
    try {
      const result = await acceptTeamInvitation(notificationId)
      if (result?.error) {
        setError(result.error)
        setActionId(null)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      setActionId(null)
    }
  }

  const handleDecline = async (notificationId: string) => {
    setActionId(notificationId)
    setError(null)
    try {
      const result = await declineTeamInvitation(notificationId)
      if (result?.error) {
        setError(result.error)
        setActionId(null)
      } else {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setActionId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
      setActionId(null)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        </p>
      </div>

      {error && (
        <Card className="p-4 border border-destructive/50 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'border',
                notif.read ? 'bg-card' : 'bg-primary/5 border-primary/20'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
                {notif.type === 'team_invitation' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(notif.id)}
                      disabled={actionId === notif.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {actionId === notif.id ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(notif.id)}
                      disabled={actionId === notif.id}
                    >
                      {actionId === notif.id ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
