import path from 'path'

export const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
]

export const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  const basename = path.basename(filename)
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 100)
}

export function validateMimeType(mimeType: string, allowed: string[]): boolean {
  return allowed.includes(mimeType.toLowerCase().split(';')[0].trim())
}

export function validateFilePath(basePath: string, filePath: string): boolean {
  const resolved = path.resolve(filePath)
  const base = path.resolve(basePath)
  return resolved.startsWith(base + path.sep) || resolved === base
}

export function isSafeSessionId(sessionId: string): boolean {
  return /^[a-zA-Z0-9-]{36}$/.test(sessionId)
}
