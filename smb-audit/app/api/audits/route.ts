import { query } from '@/lib/db'

interface AuditRow {
  id: number
  businessName: string
  abn: string | null
  auditorName: string | null
  auditDate: string | null
  loanAmount: string | null
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const audits = await query<AuditRow>(
      `SELECT id, businessName, abn, auditorName, auditDate, loanAmount, createdAt, updatedAt
       FROM audits ORDER BY updatedAt DESC`
    )
    return Response.json(audits)
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json()

    const [result] = await (await import('@/lib/db')).pool.execute(
      `INSERT INTO audits (businessName, abn, contactName, contactPhone, auditorName, auditDate, loanAmount, loanPurpose, answers, domainNotes, generalNotes, aiInsights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    )

    const insertResult = result as { insertId: number }
    return Response.json({ id: insertResult.insertId }, { status: 201 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Database error' }, { status: 500 })
  }
}
