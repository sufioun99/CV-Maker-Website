/**
 * Integration tests for API routes.
 * These tests use Next.js's server-side behavior.
 * We test the route handlers directly.
 */

import { NextRequest } from 'next/server'

// Mock session for tests
const TEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000'

function createRequest(method: string, url: string, options: { body?: any; cookies?: string } = {}): NextRequest {
  const headers = new Headers()
  if (options.cookies) {
    headers.set('cookie', options.cookies)
  }
  if (options.body) {
    headers.set('content-type', 'application/json')
  }

  return new NextRequest(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

describe('API Routes Integration', () => {
  describe('GET /api/templates', () => {
    it('should return list of templates', async () => {
      const { GET } = await import('../../src/app/api/templates/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.templates).toBeDefined()
      expect(data.templates.length).toBeGreaterThanOrEqual(6)

      const templateIds = data.templates.map((t: any) => t.id)
      expect(templateIds).toContain('modern')
      expect(templateIds).toContain('minimal')
      expect(templateIds).toContain('classic')
      expect(templateIds).toContain('two-column')
      expect(templateIds).toContain('academic')
      expect(templateIds).toContain('creative')
    })
  })

  describe('GET /api/session', () => {
    it('should return null sessionId for unauthenticated request', async () => {
      const { GET } = await import('../../src/app/api/session/route')
      const req = createRequest('GET', 'http://localhost:3000/api/session')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.sessionId).toBeNull()
    })

    it('should return sessionId for authenticated request', async () => {
      const { GET } = await import('../../src/app/api/session/route')
      const req = createRequest('GET', 'http://localhost:3000/api/session', {
        cookies: `cv_session_id=${TEST_SESSION_ID}`,
      })
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.sessionId).toBe(TEST_SESSION_ID)
    })
  })

  describe('GET /api/cv', () => {
    it('should return null CV for unauthenticated request', async () => {
      const { GET } = await import('../../src/app/api/cv/route')
      const req = createRequest('GET', 'http://localhost:3000/api/cv')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.cv).toBeNull()
    })
  })

  describe('POST /api/cv', () => {
    it('should create a new CV and return session cookie', async () => {
      const { POST } = await import('../../src/app/api/cv/route')
      const req = createRequest('POST', 'http://localhost:3000/api/cv')
      const res = await POST(req)

      // Either creates a new CV or returns existing one
      expect(res.status).toBe(200)
      // Should have set a cookie
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toBeTruthy()
    })
  })

  describe('POST /api/cv/tailor', () => {
    it('should return 401 without a session', async () => {
      const { POST } = await import('../../src/app/api/cv/tailor/route')
      const req = createRequest('POST', 'http://localhost:3000/api/cv/tailor', {
        body: { jobDescription: 'Looking for React developer' },
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('should validate jobDescription is required', async () => {
      const { POST } = await import('../../src/app/api/cv/tailor/route')
      const req = createRequest('POST', 'http://localhost:3000/api/cv/tailor', {
        cookies: `cv_session_id=${TEST_SESSION_ID}`,
        body: {},
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('should reject oversized job descriptions', async () => {
      const { POST } = await import('../../src/app/api/cv/tailor/route')
      const req = createRequest('POST', 'http://localhost:3000/api/cv/tailor', {
        cookies: `cv_session_id=${TEST_SESSION_ID}`,
        body: { jobDescription: 'x'.repeat(10001) },
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/session', () => {
    it('should clear session cookie', async () => {
      const { DELETE } = await import('../../src/app/api/session/route')
      const req = createRequest('DELETE', 'http://localhost:3000/api/session', {
        cookies: `cv_session_id=${TEST_SESSION_ID}`,
      })
      const res = await DELETE(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
