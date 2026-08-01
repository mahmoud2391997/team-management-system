import { getTableRows } from './store'

type Row = Record<string, any>

interface Filter {
  op: 'eq' | 'in' | 'is' | 'neq'
  col: string
  value: any
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function matches(row: Row, filter: Filter): boolean {
  const value = filter.value
  switch (filter.op) {
    case 'eq':
      return row[filter.col] === value
    case 'in':
      return Array.isArray(value) && value.includes(row[filter.col])
    case 'is':
      if (value === null) return row[filter.col] === null || row[filter.col] === undefined
      return row[filter.col] === value
    case 'neq':
      return row[filter.col] !== value
    default:
      return false
  }
}

/**
 * A fluent, PromiseLike builder that mirrors the subset of the Supabase
 * query API used across the app, backed by the in-memory demo store.
 */
class DemoBuilder implements PromiseLike<any> {
  private table: string
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private filters: Filter[] = []
  private orders: { col: string; ascending: boolean }[] = []
  private limitVal: number | null = null
  private singleMode: 'single' | 'maybe' | null = null
  private selectOpts: any = null
  private payload: any = null
  private upsertConflict: string[] = []
  private returnSpec: string | null = null

  constructor(table: string) {
    this.table = table
  }

  select(cols: string, opts?: any) {
    this.operation = 'select'
    this.returnSpec = cols
    this.selectOpts = opts || null
    return this
  }

  eq(col: string, value: any) {
    this.filters.push({ op: 'eq', col, value })
    return this
  }

  in(col: string, values: any[]) {
    this.filters.push({ op: 'in', col, value: values })
    return this
  }

  is(col: string, value: any) {
    this.filters.push({ op: 'is', col, value })
    return this
  }

  neq(col: string, value: any) {
    this.filters.push({ op: 'neq', col, value })
    return this
  }

  order(col: string, opts?: any) {
    this.orders.push({ col, ascending: opts?.ascending ?? true })
    return this
  }

  limit(n: number) {
    this.limitVal = n
    return this
  }

  single() {
    this.singleMode = 'single'
    return this
  }

  maybeSingle() {
    this.singleMode = 'maybe'
    return this
  }

  insert(rows: any) {
    this.operation = 'insert'
    this.payload = rows
    return this
  }

  update(partial: any) {
    this.operation = 'update'
    this.payload = partial
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  upsert(rows: any, opts?: any) {
    this.operation = 'upsert'
    this.payload = rows
    this.upsertConflict = (opts?.onConflict || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    return this
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected)
  }

  private async _execute(): Promise<any> {
    const rows = getTableRows(this.table)

    const resolvedFilters: Filter[] = []
    for (const filter of this.filters) {
      resolvedFilters.push({ ...filter, value: await Promise.resolve(filter.value) })
    }

    switch (this.operation) {
      case 'select':
        return this._runSelect(rows, resolvedFilters)
      case 'insert':
        return this._runInsert(rows)
      case 'update':
        return this._runUpdate(rows, resolvedFilters)
      case 'delete':
        return this._runDelete(rows, resolvedFilters)
      case 'upsert':
        return this._runUpsert(rows)
      default:
        return { data: null, error: null }
    }
  }

  private _applyFilters(rows: Row[], filters: Filter[]): Row[] {
    if (filters.length === 0) return rows
    return rows.filter((row) => filters.every((f) => matches(row, f)))
  }

  private _runSelect(rows: Row[], filters: Filter[]): any {
    let result = this._applyFilters(rows, filters).map((r) => ({ ...r }))

    if (this.orders.length > 0) {
      for (const o of this.orders) {
        result.sort((a, b) => {
          const av = a[o.col]
          const bv = b[o.col]
          if (av == null && bv == null) return 0
          if (av == null) return o.ascending ? -1 : 1
          if (bv == null) return o.ascending ? 1 : -1
          if (av < bv) return o.ascending ? -1 : 1
          if (av > bv) return o.ascending ? 1 : -1
          return 0
        })
      }
    }

    if (this.limitVal != null) {
      result = result.slice(0, this.limitVal)
    }

    const count = result.length

    if (this.selectOpts?.head) {
      return { data: null, count, error: null }
    }
    if (this.selectOpts?.count) {
      return { data: result, count, error: null }
    }

    if (this.singleMode === 'single') {
      if (result.length === 0) {
        return { data: null, error: { message: 'No rows found' } }
      }
      return { data: result[0], error: null }
    }

    if (this.singleMode === 'maybe') {
      return { data: result[0] ?? null, error: null }
    }

    return { data: result, error: null }
  }

  private _afterMutation(rows: Row[]): any {
    if (this.returnSpec == null) {
      return { data: null, error: null }
    }

    if (this.singleMode === 'single') {
      if (rows.length === 0) {
        return { data: null, error: { message: 'No rows found' } }
      }
      return { data: rows[0], error: null }
    }

    if (this.singleMode === 'maybe') {
      return { data: rows[0] ?? null, error: null }
    }

    return { data: rows, error: null }
  }

  private _runInsert(rows: Row[]): any {
    const payload = Array.isArray(this.payload) ? this.payload : [this.payload]
    const inserted: Row[] = []

    for (const row of payload) {
      const rec: Row = { ...row }
      if (!rec.id) rec.id = genId()
      if (!rec.created_at) rec.created_at = nowIso()
      if (rec.updated_at == null) rec.updated_at = rec.created_at
      rows.push(rec)
      inserted.push(rec)
    }

    return this._afterMutation(inserted)
  }

  private _runUpdate(rows: Row[], filters: Filter[]): any {
    const matched = this._applyFilters(rows, filters)
    const updated: Row[] = []

    for (const row of matched) {
      Object.assign(row, {
        ...this.payload,
        updated_at: this.payload?.updated_at ?? nowIso(),
      })
      updated.push(row)
    }

    return this._afterMutation(updated)
  }

  private _runDelete(rows: Row[], filters: Filter[]): any {
    const matched = this._applyFilters(rows, filters)
    for (const row of matched) {
      const index = rows.indexOf(row)
      if (index >= 0) rows.splice(index, 1)
    }
    return this._afterMutation([])
  }

  private _runUpsert(rows: Row[]): any {
    const payload = Array.isArray(this.payload) ? this.payload : [this.payload]
    const upserted: Row[] = []

    for (const row of payload) {
      const existing = this.upsertConflict.length
        ? rows.find((r) => this.upsertConflict.every((col) => r[col] === row[col]))
        : row.id
          ? rows.find((r) => r.id === row.id)
          : undefined

      if (existing) {
        Object.assign(existing, { ...row, updated_at: nowIso() })
        upserted.push(existing)
      } else {
        const rec: Row = { ...row }
        if (!rec.id) rec.id = genId()
        if (!rec.created_at) rec.created_at = nowIso()
        if (rec.updated_at == null) rec.updated_at = rec.created_at
        rows.push(rec)
        upserted.push(rec)
      }
    }

    return this._afterMutation(upserted)
  }
}

export function createDemoClient() {
  return {
    from(table: string) {
      return new DemoBuilder(table)
    },
  }
}
