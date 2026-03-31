import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import * as cookie from 'cookie'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { isSafeSessionId } from './security'

export const SESSION_COOKIE_NAME = 'cv_session_id'
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
export const TMP_DIR = path.join(process.cwd(), '.tmp')

export function getSessionId(req: NextRequest): string | null {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookie.parse(cookieHeader)
  return cookies[SESSION_COOKIE_NAME] || null
}

export function createSessionId(): string {
  return uuidv4()
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function getSessionDir(sessionId: string): string {
  // Validate full UUID v4 format to prevent path traversal
  if (!isSafeSessionId(sessionId)) {
    throw new Error('Invalid session ID')
  }
  return path.join(TMP_DIR, sessionId)
}

export async function ensureSessionDir(sessionId: string): Promise<string> {
  const dir = getSessionDir(sessionId)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function getOrCreateSession(req: NextRequest, res: NextResponse): Promise<string> {
  let sessionId = getSessionId(req)
  if (!sessionId) {
    sessionId = createSessionId()
  }
  setSessionCookie(res, sessionId)
  await ensureSessionDir(sessionId)
  return sessionId
}

export async function deleteSession(sessionId: string): Promise<void> {
  const dir = getSessionDir(sessionId)
  if (existsSync(dir)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

export async function cleanExpiredSessions(): Promise<void> {
  try {
    if (!existsSync(TMP_DIR)) return
    const entries = await fs.readdir(TMP_DIR)
    const now = Date.now()
    for (const entry of entries) {
      try {
        const dir = path.join(TMP_DIR, entry)
        const stat = await fs.stat(dir)
        if (now - stat.mtimeMs > SESSION_TTL_MS) {
          await fs.rm(dir, { recursive: true, force: true })
        }
      } catch {
        // ignore individual entry errors
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function readSessionCV(sessionId: string): Promise<unknown | null> {
  const dir = getSessionDir(sessionId)
  const cvFile = path.join(dir, 'cv.json')
  try {
    const content = await fs.readFile(cvFile, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function writeSessionCV(sessionId: string, cv: unknown): Promise<void> {
  const dir = await ensureSessionDir(sessionId)
  const cvFile = path.join(dir, 'cv.json')
  await fs.writeFile(cvFile, JSON.stringify(cv), 'utf-8')
  // Update mtime for TTL
  const now = new Date()
  await fs.utimes(dir, now, now)
}

export async function touchSession(sessionId: string): Promise<void> {
  try {
    const dir = getSessionDir(sessionId)
    const now = new Date()
    await fs.utimes(dir, now, now)
  } catch {
    // ignore
  }
}
