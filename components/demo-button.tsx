'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { demoLogin } from '@/lib/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Play, ArrowRight } from 'lucide-react'

export default function DemoButton({ variant = 'outline', className = '', hero = false }: { variant?: string; className?: string; hero?: boolean }) {
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

  if (hero) {
    return (
      <Button
        variant={variant as any}
        onClick={handleDemo}
        disabled={loading}
        className={`group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/75 px-10 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-8px] hover:shadow-primary/80 active:scale-100 ${className}`}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <Play className="h-5 w-5 fill-current" />
        {loading ? 'Entering...' : 'Try the Demo'}
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Button>
    )
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
