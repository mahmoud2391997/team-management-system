'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { demoLogin } from '@/lib/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export default function DemoButton({ variant = 'outline', className = '' }: { variant?: string; className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDemo = async () => {
    setLoading(true)
    const result = await demoLogin()
    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <Button
      variant={variant as any}
      onClick={handleDemo}
      disabled={loading}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent transition-colors ${className}`}
    >
      <Play className="h-3.5 w-3.5" />
      {loading ? 'Loading...' : 'Demo'}
    </Button>
  )
}
