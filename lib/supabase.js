import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const memoryStore = {
  campaign_notes: [],
  dm_messages: [],
  telegram_users: []
}

const isBrowser = typeof window !== 'undefined'

function getTable(table) {
  if (!isBrowser) return memoryStore[table] || []

  try {
    return JSON.parse(window.localStorage.getItem(`mock_supabase_${table}`)) || []
  } catch {
    return []
  }
}

function setTable(table, data) {
  if (!isBrowser) {
    memoryStore[table] = data
    return
  }

  window.localStorage.setItem(`mock_supabase_${table}`, JSON.stringify(data))
}

function matchesFilter(row, filter) {
  return row[filter.column] === filter.value
}

function matchesOr(row, expression) {
  return expression
    .split(',')
    .some(condition => {
      const parts = condition.replace(/^and\(|\)$/g, '').split('.eq.')
      if (parts.length !== 2) return true
      return row[parts[0]] === parts[1]
    })
}

function createMockQuery(table) {
  const query = {
    table,
    action: 'select',
    payload: null,
    filters: [],
    inFilter: null,
    orExpression: null,
    orderBy: null,
    singleResult: false,
    select() {
      this.action = 'select'
      return this
    },
    insert(payload) {
      this.action = 'insert'
      this.payload = Array.isArray(payload) ? payload : [payload]
      return this
    },
    update(payload) {
      this.action = 'update'
      this.payload = payload
      return this
    },
    upsert(payload) {
      this.action = 'upsert'
      this.payload = Array.isArray(payload) ? payload : [payload]
      return this
    },
    eq(column, value) {
      this.filters.push({ column, value })
      return this
    },
    in(column, values) {
      this.inFilter = { column, values }
      return this
    },
    or(expression) {
      this.orExpression = expression
      return this
    },
    order(column, options = {}) {
      this.orderBy = { column, ascending: options.ascending !== false }
      return this
    },
    single() {
      this.singleResult = true
      return this
    },
    execute() {
      let rows = getTable(this.table)

      if (this.action === 'insert') {
        const now = new Date().toISOString()
        const inserted = this.payload.map((row, index) => ({
          id: row.id || Date.now() + index,
          created_at: row.created_at || now,
          read: row.read ?? false,
          ...row
        }))
        setTable(this.table, [...rows, ...inserted])
        return { data: inserted, error: null }
      }

      if (this.action === 'upsert') {
        const nextRows = [...rows]
        this.payload.forEach(row => {
          const existingIndex = nextRows.findIndex(existing =>
            Object.keys(row).some(key => existing[key] === row[key]) &&
            (row.username ? existing.username === row.username : true) &&
            (row.page_slug ? existing.page_slug === row.page_slug : true)
          )

          if (existingIndex >= 0) {
            nextRows[existingIndex] = { ...nextRows[existingIndex], ...row }
          } else {
            nextRows.push({ id: Date.now(), ...row })
          }
        })
        setTable(this.table, nextRows)
        return { data: this.payload, error: null }
      }

      if (this.action === 'update') {
        rows = rows.map(row => {
          const matchesIn = !this.inFilter || this.inFilter.values.includes(row[this.inFilter.column])
          return matchesIn ? { ...row, ...this.payload } : row
        })
        setTable(this.table, rows)
        return { data: rows, error: null }
      }

      let data = rows.filter(row => this.filters.every(filter => matchesFilter(row, filter)))

      if (this.orExpression) {
        data = data.filter(row => matchesOr(row, this.orExpression))
      }

      if (this.orderBy) {
        data = [...data].sort((left, right) => {
          const result = new Date(left[this.orderBy.column]) - new Date(right[this.orderBy.column])
          return this.orderBy.ascending ? result : -result
        })
      }

      if (this.singleResult) {
        return data[0]
          ? { data: data[0], error: null }
          : { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
      }

      return { data, error: null }
    },
    then(resolve, reject) {
      return Promise.resolve(this.execute()).then(resolve, reject)
    }
  }

  return query
}

function createMockSupabaseClient() {
  return {
    isMock: true,
    from(table) {
      return createMockQuery(table)
    }
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient()
