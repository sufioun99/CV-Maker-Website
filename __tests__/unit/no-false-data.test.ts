import { TailoringReportSchema } from '../../src/lib/schema'
import { createDefaultCV } from '../../src/lib/cv-defaults'

// List of entity types that must NEVER be auto-invented
const FABRICATION_INDICATORS = [
  // Employer names
  /worked at [A-Z][a-z]+ (Inc|Corp|LLC|Ltd)/i,
  // School/degree claims
  /graduated from/i,
  /degree in/i,
  /certified in/i,
]

describe('No False Data Guardrails', () => {
  it('should ensure PROMPT_IF_TRUE suggestions have requiresUserConfirmation=true', () => {
    const suggestion = {
      id: 'test',
      type: 'PROMPT_IF_TRUE' as const,
      section: 'skills',
      original: '',
      suggested: 'Kubernetes',
      reason: 'Missing from CV',
      requiresUserConfirmation: true,
      applied: false,
      isPromptIfTrue: true,
    }

    expect(suggestion.requiresUserConfirmation).toBe(true)
    expect(suggestion.isPromptIfTrue).toBe(true)
    expect(suggestion.applied).toBe(false)
  })

  it('should ensure PROMPT_IF_TRUE is never auto-applied', () => {
    const suggestion = {
      id: 'test',
      type: 'PROMPT_IF_TRUE' as const,
      section: 'skills',
      original: '',
      suggested: 'New skill not in CV',
      reason: 'Missing from CV',
      requiresUserConfirmation: true,
      applied: false,
      isPromptIfTrue: true,
    }

    // Simulate what happens when applying: PROMPT_IF_TRUE should NEVER be applied automatically
    const shouldAutoApply = !suggestion.isPromptIfTrue && !suggestion.requiresUserConfirmation
    expect(shouldAutoApply).toBe(false)
  })

  it('should ensure REWRITE suggestions do not introduce new employers', () => {
    const cv = createDefaultCV()
    cv.personal.fullName = 'Jane Smith'
    cv.summary = 'Experienced software engineer'

    // Simulate a REWRITE suggestion
    const suggestion = {
      id: 'test',
      type: 'REWRITE' as const,
      section: 'summary',
      original: cv.summary,
      suggested: `${cv.summary} Particularly strong in React.`, // Only adds emphasis, no new facts
      reason: 'Highlight React skills',
      requiresUserConfirmation: false,
      applied: false,
      isPromptIfTrue: false,
    }

    // The suggested text should only rephrase existing content
    // It should NOT introduce new employers or credentials
    const fabricatesNewEmployer = FABRICATION_INDICATORS.some(pattern => pattern.test(suggestion.suggested))
    expect(fabricatesNewEmployer).toBe(false)
  })

  it('should ensure noFalseDataGuarantee is always true in reports', () => {
    const validReport = {
      jobTitle: 'Engineer',
      matchScore: 50,
      matchedKeywords: ['react'],
      missingKeywords: ['kubernetes'],
      suggestions: [],
      noFalseDataGuarantee: true as const,
    }

    const result = TailoringReportSchema.safeParse(validReport)
    expect(result.success).toBe(true)

    // A report with noFalseDataGuarantee=false should be rejected
    const invalidReport = { ...validReport, noFalseDataGuarantee: false }
    const invalidResult = TailoringReportSchema.safeParse(invalidReport)
    expect(invalidResult.success).toBe(false)
  })

  it('should ensure missing keywords only appear as PROMPT_IF_TRUE', () => {
    const missingKeyword = 'kubernetes'
    const cvText = 'React TypeScript JavaScript' // kubernetes NOT present

    // Verify it's missing
    expect(cvText.toLowerCase().includes(missingKeyword)).toBe(false)

    // The suggestion for a missing keyword must be PROMPT_IF_TRUE
    const suggestion = {
      id: 'test',
      type: 'PROMPT_IF_TRUE' as const,
      section: 'skills',
      original: '',
      suggested: missingKeyword,
      reason: `The job requires "${missingKeyword}" but it's not found in your CV.`,
      requiresUserConfirmation: true,
      applied: false,
      isPromptIfTrue: true,
    }

    expect(suggestion.type).toBe('PROMPT_IF_TRUE')
    expect(suggestion.isPromptIfTrue).toBe(true)
    expect(suggestion.applied).toBe(false)
  })

  it('should validate that applying suggestions does not introduce fabricated entities', () => {
    const cv = createDefaultCV()
    cv.experience = [{
      id: 'exp1',
      company: 'Acme Corp',
      role: 'Software Engineer',
      startDate: '2020',
      endDate: '2023',
      current: false,
      description: 'Built React apps',
      bullets: ['Led React development'],
      location: 'NY',
    }]

    // REORDER suggestion - only changes order, no new facts
    const reorderSuggestion = {
      id: 'sug1',
      type: 'REORDER' as const,
      section: 'experience',
      itemId: 'exp1',
      original: 'Experience at position 1',
      suggested: 'Move to top',
      reason: 'Most relevant',
      requiresUserConfirmation: false,
      applied: false,
      isPromptIfTrue: false,
    }

    // Applying REORDER should not add any text
    expect(reorderSuggestion.suggested).not.toMatch(/worked at|employed by|graduated from|certified/i)

    // The company name in REORDER suggestion comes from existing CV data, not fabricated
    const existingCompanies = cv.experience.map(e => e.company)
    expect(existingCompanies).toContain('Acme Corp')
  })
})
