import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ensureDemoMode } from '@/lib/demo/mode'
import { createDemoClient } from '@/lib/demo/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabaseInstance: SupabaseClient | null = null
let demoClient: any = null

/**
 * Resolves the real database client once demo mode has been ruled out.
 * Lazily constructed so that a missing/inactive database never crashes boot.
 */
export async function getDbClient(): Promise<any> {
  if (await ensureDemoMode()) {
    if (!demoClient) demoClient = createDemoClient()
    return demoClient
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabaseInstance
}

/**
 * Returns a client that transparently resolves to the in-memory demo store when
 * demo mode is active, or to the real Supabase client otherwise.
 *
 * The returned client records every chained call and replays it against the
 * resolved backend on first await, so existing call sites stay unchanged.
 */
export function getSupabase(): SupabaseClient {
  const deferred = {
    from(table: string) {
      const calls: Array<{ name: string; args: any[] }> = []

      const record = (name: string, args: any[]) => {
        calls.push({ name, args })
        return builder
      }

      const builder: any = {
        then<TResult1 = any, TResult2 = never>(
          onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
          onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
        ): PromiseLike<TResult1 | TResult2> {
          return getDbClient()
            .then(async (client) => {
              let query: any = client.from(table)
              for (const call of calls) {
                query = query[call.name](...call.args)
              }
              return query
            })
            .then(onfulfilled, onrejected)
        },
        select: (cols: string, opts?: any) => record('select', [cols, opts]),
        eq: (col: string, value: any) => record('eq', [col, value]),
        in: (col: string, values: any[]) => record('in', [col, values]),
        is: (col: string, value: any) => record('is', [col, value]),
        neq: (col: string, value: any) => record('neq', [col, value]),
        order: (col: string, opts?: any) => record('order', [col, opts]),
        limit: (n: number) => record('limit', [n]),
        single: () => record('single', []),
        maybeSingle: () => record('maybeSingle', []),
        insert: (rows: any) => record('insert', [rows]),
        update: (partial: any) => record('update', [partial]),
        delete: () => record('delete', []),
        upsert: (rows: any, opts?: any) => record('upsert', [rows, opts]),
      }

      return builder
    },
  }

  return deferred as unknown as SupabaseClient
}
