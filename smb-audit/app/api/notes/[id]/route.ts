import { queryOne, pool } from '@/lib/db'

interface NoteRow {
  id: number
  category: 'release' | 'prd' | 'general'
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const note = await queryOne<NoteRow>('SELECT * FROM project_notes WHERE id = ?', [id])
    if (!note) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(note)
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { category, title, content } = await request.json()
    await pool.execute(
      'UPDATE project_notes SET category = ?, title = ?, content = ? WHERE id = ?',
      [category, title, content, id]
    )
    return Response.json({ id: Number(id) })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await pool.execute('DELETE FROM project_notes WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}
