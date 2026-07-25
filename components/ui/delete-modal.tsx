'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DeleteModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <Card className="relative z-10 p-6 w-full max-w-md border border-border bg-card shadow-lg">
        <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Removing...' : 'Yes, Remove'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
