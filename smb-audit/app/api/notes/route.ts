import { query, pool } from '@/lib/db'

interface NoteRow {
  id: number
  category: 'release' | 'prd' | 'general'
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const notes = await query<NoteRow>(
      'SELECT id, category, title, content, createdAt, updatedAt FROM project_notes ORDER BY updatedAt DESC'
    )
    return Response.json(notes)
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { category, title, content } = await request.json()
    const [result] = await pool.execute(
      'INSERT INTO project_notes (category, title, content) VALUES (?, ?, ?)',
      [category ?? 'general', title ?? 'Untitled', content ?? '']
    )
    const insertResult = result as { insertId: number }
    return Response.json({ id: insertResult.insertId }, { status: 201 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}
