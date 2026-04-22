import mysql, { type ExecuteValues } from 'mysql2/promise'

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined
}

function createPool() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
}

export const pool = globalThis.__mysqlPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__mysqlPool = pool
}

export async function query<T = unknown>(sql: string, values?: ExecuteValues[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, values)
  return rows as T[]
}

export async function queryOne<T = unknown>(sql: string, values?: ExecuteValues[]): Promise<T | null> {
  const rows = await query<T>(sql, values)
  return rows[0] ?? null
}
