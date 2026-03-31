import { sanitizeFilename, validateMimeType, validateFilePath, isSafeSessionId } from '../../src/lib/security'
import { ALLOWED_CV_MIME_TYPES, ALLOWED_IMAGE_MIME_TYPES } from '../../src/lib/security'
import path from 'path'

describe('Security Utilities', () => {
  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('../../etc/passwd')).not.toContain('/')
      expect(sanitizeFilename('..\\..\\Windows\\System32')).not.toContain('\\')
    })

    it('should remove dangerous characters', () => {
      const safe = sanitizeFilename('file<>:"/\\|?*name.pdf')
      expect(safe).not.toMatch(/[<>:"/\\|?*]/)
    })

    it('should preserve normal filenames', () => {
      const safe = sanitizeFilename('my-cv-2024.pdf')
      expect(safe).toBe('my-cv-2024.pdf')
    })

    it('should truncate to 100 chars', () => {
      const long = 'a'.repeat(200) + '.pdf'
      expect(sanitizeFilename(long).length).toBeLessThanOrEqual(100)
    })

    it('should replace double dots', () => {
      const result = sanitizeFilename('file..name.pdf')
      expect(result).not.toContain('..')
    })
  })

  describe('validateMimeType', () => {
    it('should accept valid PDF MIME type', () => {
      expect(validateMimeType('application/pdf', ALLOWED_CV_MIME_TYPES)).toBe(true)
    })

    it('should accept valid DOCX MIME type', () => {
      expect(validateMimeType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ALLOWED_CV_MIME_TYPES
      )).toBe(true)
    })

    it('should reject executable MIME types', () => {
      expect(validateMimeType('application/x-executable', ALLOWED_CV_MIME_TYPES)).toBe(false)
      expect(validateMimeType('application/x-sh', ALLOWED_CV_MIME_TYPES)).toBe(false)
    })

    it('should reject HTML uploads', () => {
      expect(validateMimeType('text/html', ALLOWED_CV_MIME_TYPES)).toBe(false)
    })

    it('should accept image types for image uploads', () => {
      expect(validateMimeType('image/jpeg', ALLOWED_IMAGE_MIME_TYPES)).toBe(true)
      expect(validateMimeType('image/png', ALLOWED_IMAGE_MIME_TYPES)).toBe(true)
    })

    it('should handle MIME types with parameters', () => {
      expect(validateMimeType('application/pdf; charset=utf-8', ALLOWED_CV_MIME_TYPES)).toBe(true)
    })
  })

  describe('validateFilePath', () => {
    it('should allow paths within base directory', () => {
      const base = '/home/sessions'
      const valid = path.join(base, 'session-id', 'cv.json')
      expect(validateFilePath(base, valid)).toBe(true)
    })

    it('should reject path traversal attempts', () => {
      const base = '/home/sessions'
      const traversal = '/home/sessions/../../../etc/passwd'
      expect(validateFilePath(base, traversal)).toBe(false)
    })
  })

  describe('isSafeSessionId', () => {
    it('should accept valid UUID session IDs', () => {
      expect(isSafeSessionId('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isSafeSessionId('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('should reject IDs with path traversal characters', () => {
      expect(isSafeSessionId('../etc/passwd')).toBe(false)
      expect(isSafeSessionId('../../root')).toBe(false)
    })

    it('should reject IDs with spaces or special chars', () => {
      expect(isSafeSessionId('session id with spaces')).toBe(false)
      expect(isSafeSessionId('session<script>')).toBe(false)
    })
  })
})
