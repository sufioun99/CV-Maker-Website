import { NextRequest, NextResponse } from 'next/server'
import { CVSchema, type CV } from '@/lib/schema'
import { getSessionId, readSessionCV, writeSessionCV, getOrCreateSession } from '@/lib/session'
import { createDefaultCV } from '@/lib/cv-defaults'

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ cv: null })
  }
  const data = await readSessionCV(sessionId)
  if (!data) {
    return NextResponse.json({ cv: null })
  }
  const parsed = CVSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ cv: null })
  }
  return NextResponse.json({ cv: parsed.data })
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json<{ cv: CV | null }>({ cv: null })
  const sessionId = await getOrCreateSession(req, res)

  const existing = await readSessionCV(sessionId)
  if (existing) {
    const parsed = CVSchema.safeParse(existing)
    if (parsed.success) {
      res.headers.set('content-type', 'application/json')
      return NextResponse.json({ cv: parsed.data }, {
        headers: { 'Set-Cookie': res.headers.get('Set-Cookie') || '' }
      })
    }
  }

  const cv = createDefaultCV()
  await writeSessionCV(sessionId, cv)

  const response = NextResponse.json({ cv })
  const cookieVal = `cv_session_id=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200`
  response.headers.set('Set-Cookie', cookieVal)
  return response
}

export async function PATCH(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const existing = await readSessionCV(sessionId)
  if (!existing) {
    return NextResponse.json({ error: 'No CV found' }, { status: 404 })
  }

  // Merge patch
  const merged = { ...(existing as object), ...(body as object), updatedAt: new Date().toISOString() }
  const parsed = CVSchema.safeParse(merged)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid CV data', details: parsed.error.errors }, { status: 400 })
  }

  await writeSessionCV(sessionId, parsed.data)
  return NextResponse.json({ cv: parsed.data })
}
