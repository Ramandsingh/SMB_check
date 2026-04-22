import { queryOne, pool } from '@/lib/db'

interface AuditRow {
  id: number
  businessName: string
  abn: string | null
  contactName: string | null
  contactPhone: string | null
  auditorName: string | null
  auditDate: string | null
  loanAmount: string | null
  loanPurpose: string | null
  answers: unknown
  domainNotes: unknown
  generalNotes: string | null
  aiInsights: unknown
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const audit = await queryOne<AuditRow>('SELECT * FROM audits WHERE id = ?', [id])
    if (!audit) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(audit)
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
    const b = await request.json()

    await pool.execute(
      `UPDATE audits SET
         businessName = ?, abn = ?, contactName = ?, contactPhone = ?,
         auditorName = ?, auditDate = ?, loanAmount = ?, loanPurpose = ?,
         answers = ?, domainNotes = ?, generalNotes = ?, aiInsights = ?
       WHERE id = ?`,
      [
        b.businessName || 'Unnamed Business',
        b.abn || null,
        b.contactName || null,
        b.contactPhone || null,
        b.auditorName || null,
        b.auditDate || null,
        b.loanAmount || null,
        b.loanPurpose || null,
        JSON.stringify(b.answers ?? {}),
        JSON.stringify(b.domainNotes ?? {}),
        b.generalNotes || null,
        b.aiInsights ? JSON.stringify(b.aiInsights) : null,
        id,
      ]
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
    await pool.execute('DELETE FROM audits WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}
