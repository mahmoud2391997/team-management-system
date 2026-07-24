import { ActionResult, ActionError, ActionSuccess } from '@/lib/types'

/**
 * Creates a success result wrapper for server actions
 */
export function createSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data }
}

/**
 * Creates an error result wrapper for server actions
 */
export function createError(error: string): ActionError {
  return { success: false, error }
}

/**
 * Validates a condition and returns error if false
 */
export function validate<T>(
  condition: boolean,
  errorMessage: string,
  data?: T
): ActionResult<T> {
  if (!condition) {
    return createError(errorMessage) as ActionError
  }
  return createSuccess(data as T)
}

/**
 * Wraps an async function with try-catch and returns ActionResult
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return createSuccess(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return createError(message)
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

/**
 * Caches results of an async function in memory
 */
export function createAsyncCache<T>(
  ttl: number = 60000 // 1 minute default
) {
  let cachedData: T | null = null
  let cachedTime: number | null = null

  return {
    get: async (fn: () => Promise<T>): Promise<T> => {
      const now = Date.now()

      if (cachedData !== null && cachedTime !== null && now - cachedTime < ttl) {
        return cachedData
      }

      cachedData = await fn()
      cachedTime = now
      return cachedData
    },
    clear: () => {
      cachedData = null
      cachedTime = null
    },
  }
}

/**
 * Groups results by a key function
 */
export function groupBy<T, K extends string | number | symbol>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    },
    {} as Record<K, T[]>
  )
}

/**
 * Safely parses JSON with fallback
 */
export function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

/**
 * Type guard for checking if result is success
 */
export function isSuccess<T>(result: ActionResult<T>): result is ActionSuccess<T> {
  return result.success === true
}

/**
 * Type guard for checking if result is error
 */
export function isError(result: ActionResult<any>): result is ActionError {
  return result.success === false
}
