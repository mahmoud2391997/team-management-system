'use client'

import React, { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) ?? (
          <Card className="p-6 border border-destructive bg-destructive/5">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-sm px-3 py-1 bg-destructive text-destructive-foreground rounded hover:opacity-90"
            >
              Try again
            </button>
          </Card>
        )
      )
    }

    return this.props.children
  }
}

/**
 * Error display component for server action results
 */
export function ErrorAlert({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <Card className="p-4 border border-destructive bg-destructive/5">
      <p className="text-sm text-destructive font-medium">{error}</p>
    </Card>
  )
}

/**
 * Loading state wrapper component
 */
export function LoadingState({
  isLoading,
  children,
  fallback,
}: {
  isLoading: boolean
  children: ReactNode
  fallback?: ReactNode
}) {
  if (isLoading) {
    return fallback || <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return children
}

/**
 * Empty state component
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="p-12 text-center border border-border bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </Card>
  )
}
