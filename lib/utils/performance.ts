/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

const metrics: PerformanceMetric[] = []
const enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  if (!enabled) {
    return fn()
  }

  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start

    recordMetric({ name, duration, timestamp: Date.now(), metadata })

    return result
  } catch (error) {
    const duration = performance.now() - start
    recordMetric({ name, duration, timestamp: Date.now(), metadata: { ...metadata, error: true } })

    throw error
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measure<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  if (!enabled) {
    return fn()
  }

  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start

    recordMetric({ name, duration, timestamp: Date.now(), metadata })

    return result
  } catch (error) {
    const duration = performance.now() - start
    recordMetric({ name, duration, timestamp: Date.now(), metadata: { ...metadata, error: true } })

    throw error
  }
}

/**
 * Record a metric
 */
function recordMetric(metric: PerformanceMetric): void {
  metrics.push(metric)

  // Keep only last 1000 metrics to avoid memory leak
  if (metrics.length > 1000) {
    metrics.shift()
  }

  // Log slow operations
  if (metric.duration > 100) {
    console.warn(`[Performance] ${metric.name} took ${metric.duration.toFixed(2)}ms`, metric.metadata)
  }
}

/**
 * Get all recorded metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics]
}

/**
 * Get metrics for a specific operation
 */
export function getMetricsForOperation(name: string): PerformanceMetric[] {
  return metrics.filter((m) => m.name === name)
}

/**
 * Get average duration for an operation
 */
export function getAverageDuration(name: string): number {
  const operationMetrics = getMetricsForOperation(name)

  if (operationMetrics.length === 0) {
    return 0
  }

  const sum = operationMetrics.reduce((acc, m) => acc + m.duration, 0)
  return sum / operationMetrics.length
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const operationNames = [...new Set(metrics.map((m) => m.name))]

  const summary: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {}

  operationNames.forEach((name) => {
    const operationMetrics = getMetricsForOperation(name)
    const durations = operationMetrics.map((m) => m.duration)

    summary[name] = {
      count: operationMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
    }
  })

  return summary
}

/**
 * Log performance metrics to console
 */
export function logPerformanceSummary(): void {
  if (!enabled) return

  const summary = getPerformanceSummary()

  console.table(
    Object.entries(summary).map(([name, stats]) => ({
      'Operation': name,
      'Count': stats.count,
      'Avg (ms)': stats.avgDuration.toFixed(2),
      'Max (ms)': stats.maxDuration.toFixed(2),
    }))
  )
}
