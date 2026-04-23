import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { password } = await request.json()
  const expected = process.env.SITE_PASSWORD

  if (!expected) {
    return Response.json({ error: 'Auth not configured' }, { status: 500 })
  }

  if (password !== expected) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false
  const cookieStore = await cookies()
  cookieStore.set('audit_token', expected, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('audit_token')
  return Response.json({ ok: true })
}
