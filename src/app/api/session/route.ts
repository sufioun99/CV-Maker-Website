import { NextRequest, NextResponse } from 'next/server'
import { getSessionId, deleteSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ sessionId: null, hasCV: false })
  }
  return NextResponse.json({ sessionId, hasCV: true })
}

export async function DELETE(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (sessionId) {
    await deleteSession(sessionId)
  }
  const res = NextResponse.json({ success: true })
  res.cookies.delete(SESSION_COOKIE_NAME)
  return res
}
