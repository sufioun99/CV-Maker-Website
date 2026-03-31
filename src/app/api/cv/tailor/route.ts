import { NextRequest, NextResponse } from 'next/server'
import { getSessionId, readSessionCV } from '@/lib/session'
import { CVSchema, type TailoringReport, type TailoringSuggestion } from '@/lib/schema'
import { v4 as uuidv4 } from 'uuid'

function extractKeywords(text: string): string[] {
  const techKeywords = [
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java', 'golang', 'rust',
    'nodejs', 'node.js', 'express', 'fastapi', 'django', 'flask', 'spring',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd',
    'git', 'github', 'gitlab', 'agile', 'scrum', 'kanban',
    'machine learning', 'deep learning', 'nlp', 'data science', 'analytics',
    'rest', 'graphql', 'api', 'microservices', 'devops',
    'html', 'css', 'tailwind', 'bootstrap',
    'leadership', 'communication', 'teamwork', 'problem-solving',
  ]

  const found = new Set<string>()

  for (const kw of techKeywords) {
    if (text.toLowerCase().includes(kw)) {
      found.add(kw)
    }
  }

  const capitalWords = text.match(/\b[A-Z][A-Za-z0-9+#.]+\b/g) || []
  for (const w of capitalWords) {
    if (w.length > 2 && w.length < 30) found.add(w.toLowerCase())
  }

  return Array.from(found)
}

function generateNoFalseDataSuggestions(
  cv: NonNullable<ReturnType<typeof CVSchema.parse>>,
  jobDescription: string,
  jobKeywords: string[]
): TailoringSuggestion[] {
  const suggestions: TailoringSuggestion[] = []

  const cvText = [
    cv.summary,
    ...cv.experience.map(e => `${e.role} ${e.company} ${e.description} ${e.bullets.join(' ')}`),
    ...cv.skills.map(s => s.name),
    ...cv.projects.map(p => `${p.name} ${p.description}`),
  ].join(' ').toLowerCase()

  const matchedKeywords = jobKeywords.filter(kw => cvText.includes(kw))
  const missingKeywords = jobKeywords.filter(kw => !cvText.includes(kw))

  // 1. REWRITE - improve summary to highlight relevant existing skills
  if (cv.summary && cv.summary.length > 10) {
    const relevantExistingSkills = matchedKeywords.slice(0, 5).join(', ')
    if (relevantExistingSkills) {
      suggestions.push({
        id: uuidv4(),
        type: 'REWRITE',
        section: 'summary',
        original: cv.summary,
        suggested: `${cv.summary.replace(/[.!?]\s*$/, '')}. Particularly strong in ${relevantExistingSkills}.`,
        reason: `Highlight your existing ${relevantExistingSkills} skills that match the job requirements.`,
        requiresUserConfirmation: false,
        applied: false,
        isPromptIfTrue: false,
      })
    }
  }

  // 2. REORDER - move most relevant experience to top
  if (cv.experience.length > 1) {
    const mostRelevantIdx = cv.experience.findIndex(exp => {
      const expText = `${exp.role} ${exp.description} ${exp.bullets.join(' ')}`.toLowerCase()
      return matchedKeywords.some(kw => expText.includes(kw))
    })
    if (mostRelevantIdx > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'REORDER',
        section: 'experience',
        itemId: cv.experience[mostRelevantIdx].id,
        original: `Experience at position ${mostRelevantIdx + 1}`,
        suggested: 'Move to top of experience list',
        reason: `This experience entry most closely matches the job requirements and should appear first.`,
        requiresUserConfirmation: false,
        applied: false,
        isPromptIfTrue: false,
      })
    }
  }

  // 3. EMPHASIZE - for existing skills that match the job
  for (const kw of matchedKeywords.slice(0, 3)) {
    const relevantExp = cv.experience.find(e =>
      `${e.description} ${e.bullets.join(' ')}`.toLowerCase().includes(kw)
    )
    if (relevantExp && relevantExp.bullets.length > 0) {
      const relevantBullet = relevantExp.bullets.find(b => b.toLowerCase().includes(kw))
      if (relevantBullet && relevantBullet.length < 200) {
        suggestions.push({
          id: uuidv4(),
          type: 'EMPHASIZE',
          section: 'experience',
          itemId: relevantExp.id,
          original: relevantBullet,
          suggested: `Demonstrated expertise: ${relevantBullet}`,
          reason: `This achievement highlights your ${kw} experience relevant to this role.`,
          requiresUserConfirmation: false,
          applied: false,
          isPromptIfTrue: false,
        })
      }
    }
  }

  // 4. REMOVE_REDUNDANCY - check for duplicate skills
  const skillNames = cv.skills.map(s => s.name.toLowerCase())
  const duplicates = skillNames.filter((name, idx) => skillNames.indexOf(name) !== idx)
  for (const dup of duplicates) {
    const dupItem = cv.skills.find(s => s.name.toLowerCase() === dup)
    if (dupItem) {
      suggestions.push({
        id: uuidv4(),
        type: 'REMOVE_REDUNDANCY',
        section: 'skills',
        itemId: dupItem.id,
        original: dupItem.name,
        suggested: '',
        reason: `Duplicate skill "${dupItem.name}" appears multiple times. Remove redundant entry.`,
        requiresUserConfirmation: false,
        applied: false,
        isPromptIfTrue: false,
      })
    }
  }

  // 5. PROMPT_IF_TRUE - for missing keywords that CANNOT be auto-added
  for (const kw of missingKeywords.slice(0, 5)) {
    suggestions.push({
      id: uuidv4(),
      type: 'PROMPT_IF_TRUE',
      section: 'skills',
      original: '',
      suggested: kw,
      reason: `The job requires "${kw}" but it's not found in your CV. Do you have experience with ${kw}? If yes, add it manually.`,
      requiresUserConfirmation: true,
      applied: false,
      isPromptIfTrue: true,
    })
  }

  return suggestions
}

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  let body: { jobDescription: string; jobTitle?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.jobDescription || typeof body.jobDescription !== 'string') {
    return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  }

  if (body.jobDescription.length > 10000) {
    return NextResponse.json({ error: 'Job description too long (max 10000 chars)' }, { status: 400 })
  }

  const cvData = await readSessionCV(sessionId)
  if (!cvData) {
    return NextResponse.json({ error: 'No CV found. Create one first.' }, { status: 404 })
  }

  const cvParsed = CVSchema.safeParse(cvData)
  if (!cvParsed.success) {
    return NextResponse.json({ error: 'Invalid CV data' }, { status: 400 })
  }

  const cv = cvParsed.data
  const jobKeywords = extractKeywords(body.jobDescription)

  const cvText = [
    cv.summary,
    ...cv.experience.map(e => `${e.role} ${e.company} ${e.description} ${e.bullets.join(' ')}`),
    ...cv.skills.map(s => s.name),
  ].join(' ').toLowerCase()

  const matchedKeywords = jobKeywords.filter(kw => cvText.includes(kw))
  const missingKeywords = jobKeywords.filter(kw => !cvText.includes(kw))
  const matchScore = jobKeywords.length > 0
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 0

  const suggestions = generateNoFalseDataSuggestions(cv, body.jobDescription, jobKeywords)

  const report: TailoringReport = {
    jobTitle: body.jobTitle || '',
    matchScore,
    matchedKeywords,
    missingKeywords,
    suggestions,
    noFalseDataGuarantee: true,
  }

  return NextResponse.json({ report })
}
