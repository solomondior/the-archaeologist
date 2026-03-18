import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({ password: z.string().min(1) })

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing password' }, { status: 422 })
  }

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  const valid = await bcrypt.compare(parsed.data.password, hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const sessionToken = process.env.ADMIN_SESSION_TOKEN ?? ''
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
