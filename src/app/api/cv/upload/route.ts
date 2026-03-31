import { NextRequest, NextResponse } from 'next/server'
import { getSessionId, ensureSessionDir } from '@/lib/session'
import { validateMimeType, sanitizeFilename, ALLOWED_CV_MIME_TYPES, MAX_CV_SIZE_BYTES } from '@/lib/security'
import { type ExtractionResult } from '@/lib/schema'
import { createDefaultCV } from '@/lib/cv-defaults'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

async function extractFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return { text: data.text, numPages: data.numpages }
}

async function extractFromDOCX(buffer: Buffer): Promise<{ text: string }> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value }
}

function extractNameFromText(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length > 0 && lines[0].length < 50 && !/[@.com]/.test(lines[0])) {
    return lines[0]
  }
  return ''
}

function extractEmailFromText(text: string): string {
  const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  return match ? match[0] : ''
}

function extractPhoneFromText(text: string): string {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  return match ? match[0] : ''
}

function extractLinkedInFromText(text: string): string {
  const match = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i)
  return match ? `https://linkedin.com/in/${match[1]}` : ''
}

function extractGitHubFromText(text: string): string {
  const match = text.match(/github\.com\/([a-zA-Z0-9-]+)/i)
  return match ? `https://github.com/${match[1]}` : ''
}

function extractSections(text: string): Record<string, string> {
  const sectionHeaders = [
    'experience', 'work experience', 'employment', 'professional experience',
    'education', 'academic background',
    'skills', 'technical skills', 'core competencies',
    'projects', 'personal projects',
    'certifications', 'certificates',
    'languages',
    'summary', 'profile', 'objective', 'about',
  ]

  const lines = text.split('\n')
  const sections: Record<string, string[]> = { header: [] }
  let currentSection = 'header'

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    const matched = sectionHeaders.find(h =>
      trimmed === h || trimmed.startsWith(h + ':') || trimmed.startsWith(h + ' ')
    )
    if (matched) {
      const canonicalName = matched.includes('experience') || matched.includes('employment') ? 'experience' :
        matched.includes('education') ? 'education' :
        matched.includes('skills') || matched.includes('competencies') ? 'skills' :
        matched.includes('project') ? 'projects' :
        matched.includes('certif') ? 'certifications' :
        matched.includes('language') ? 'languages' :
        matched.includes('summary') || matched.includes('profile') || matched.includes('objective') || matched.includes('about') ? 'summary' :
        matched
      currentSection = canonicalName
      if (!sections[currentSection]) sections[currentSection] = []
    } else {
      if (!sections[currentSection]) sections[currentSection] = []
      sections[currentSection].push(line)
    }
  }

  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()])
  )
}

function parseSkillsFromText(text: string): Array<{ id: string; name: string; category: string }> {
  if (!text) return []
  const raw = text.replace(/[•·▪►]/g, ',').replace(/\n+/g, ',')
  const skills = raw.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50)
  return skills.slice(0, 30).map(name => ({ id: uuidv4(), name, category: '' }))
}

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ error: 'No session. Create one first via POST /api/cv' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!validateMimeType(file.type, ALLOWED_CV_MIME_TYPES)) {
    return NextResponse.json({
      error: 'Invalid file type. Only PDF and DOCX files are allowed.'
    }, { status: 400 })
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    return NextResponse.json({
      error: `File too large. Maximum size is ${MAX_CV_SIZE_BYTES / 1024 / 1024}MB`
    }, { status: 400 })
  }

  const sessionDir = await ensureSessionDir(sessionId)
  const safeFilename = sanitizeFilename(file.name)
  const uploadPath = path.join(sessionDir, `upload_${safeFilename}`)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(uploadPath, buffer)

  let extractedText = ''
  const warnings: string[] = []

  try {
    if (file.type === 'application/pdf') {
      const result = await extractFromPDF(buffer)
      extractedText = result.text
    } else {
      const result = await extractFromDOCX(buffer)
      extractedText = result.text
    }
  } catch {
    warnings.push('Could not extract text from file. Please fill in the details manually.')
  }

  const sections = extractSections(extractedText)
  const cv = createDefaultCV()

  const extractedFields: ExtractionResult['extractedFields'] = {}

  const email = extractEmailFromText(extractedText)
  const phone = extractPhoneFromText(extractedText)
  const name = extractNameFromText(extractedText)
  const linkedin = extractLinkedInFromText(extractedText)
  const github = extractGitHubFromText(extractedText)

  cv.personal = {
    fullName: name,
    email,
    phone,
    location: '',
    website: '',
    linkedin,
    github,
    title: '',
  }

  if (name) extractedFields['personal.fullName'] = { value: name, confidence: 0.7, sourceSnippet: name.substring(0, 100), page: 1 }
  if (email) extractedFields['personal.email'] = { value: email, confidence: 0.95, sourceSnippet: email, page: 1 }
  if (phone) extractedFields['personal.phone'] = { value: phone, confidence: 0.9, sourceSnippet: phone, page: 1 }
  if (linkedin) extractedFields['personal.linkedin'] = { value: linkedin, confidence: 0.95, sourceSnippet: linkedin, page: 1 }
  if (github) extractedFields['personal.github'] = { value: github, confidence: 0.95, sourceSnippet: github, page: 1 }

  if (sections.summary) {
    cv.summary = sections.summary.substring(0, 500)
    extractedFields['summary'] = { value: cv.summary, confidence: 0.6, sourceSnippet: cv.summary.substring(0, 100) }
  }

  if (sections.skills) {
    cv.skills = parseSkillsFromText(sections.skills)
    extractedFields['skills'] = { value: cv.skills.map(s => s.name), confidence: 0.75, sourceSnippet: sections.skills.substring(0, 100) }
  }

  // NOTE: We do not log full CV content per privacy policy
  // NOTE: Experience/education entries are left for the user to fill in manually for accuracy
  if (sections.experience) {
    warnings.push('Experience section detected. Please review and fill in your work experience details manually for accuracy.')
  }

  if (sections.education) {
    warnings.push('Education section detected. Please review and fill in your education details manually for accuracy.')
  }

  const result: ExtractionResult = {
    cv,
    extractedFields,
    warnings,
  }

  const { writeSessionCV } = await import('@/lib/session')
  await writeSessionCV(sessionId, cv)

  return NextResponse.json({
    extraction: result,
    message: 'CV extracted successfully. Please review and correct the extracted information.',
  })
}
