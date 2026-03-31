import { CVSchema, TailoringSuggestionSchema, TailoringReportSchema } from '../../src/lib/schema'
import { createDefaultCV } from '../../src/lib/cv-defaults'

describe('Zod Schema Validation', () => {
  describe('CVSchema', () => {
    it('should validate a complete CV', () => {
      const cv = createDefaultCV()
      const result = CVSchema.safeParse(cv)
      expect(result.success).toBe(true)
    })

    it('should reject CV without required fields', () => {
      // Missing id, createdAt, updatedAt
      const result = CVSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should coerce defaults for optional fields', () => {
      const cv = CVSchema.parse({
        id: 'test-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(cv.experience).toEqual([])
      expect(cv.skills).toEqual([])
      expect(cv.personal.fullName).toBe('')
    })

    it('should validate experience items', () => {
      const cv = createDefaultCV()
      cv.experience = [{
        id: 'exp1',
        company: 'Acme Corp',
        role: 'Engineer',
        startDate: '2020-01',
        endDate: '2023-01',
        current: false,
        description: 'Built things',
        bullets: ['Achievement 1'],
        location: 'NY',
      }]
      const result = CVSchema.safeParse(cv)
      expect(result.success).toBe(true)
    })
  })

  describe('TailoringSuggestionSchema', () => {
    it('should validate a REWRITE suggestion', () => {
      const result = TailoringSuggestionSchema.safeParse({
        id: 'sug1',
        type: 'REWRITE',
        section: 'summary',
        original: 'Old summary',
        suggested: 'New summary',
        reason: 'Better match',
        requiresUserConfirmation: false,
        applied: false,
        isPromptIfTrue: false,
      })
      expect(result.success).toBe(true)
    })

    it('should validate a PROMPT_IF_TRUE suggestion', () => {
      const result = TailoringSuggestionSchema.safeParse({
        id: 'sug2',
        type: 'PROMPT_IF_TRUE',
        section: 'skills',
        original: '',
        suggested: 'Kubernetes',
        reason: 'Missing from CV',
        requiresUserConfirmation: true,
        applied: false,
        isPromptIfTrue: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid suggestion types', () => {
      const result = TailoringSuggestionSchema.safeParse({
        id: 'sug3',
        type: 'INVALID_TYPE',
        section: 'skills',
        original: '',
        suggested: '',
        reason: '',
        requiresUserConfirmation: false,
        applied: false,
        isPromptIfTrue: false,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('TailoringReportSchema', () => {
    it('should validate a complete report', () => {
      const result = TailoringReportSchema.safeParse({
        jobTitle: 'Software Engineer',
        matchScore: 75,
        matchedKeywords: ['react', 'typescript'],
        missingKeywords: ['kubernetes'],
        suggestions: [],
        noFalseDataGuarantee: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject report without noFalseDataGuarantee=true', () => {
      const result = TailoringReportSchema.safeParse({
        jobTitle: '',
        matchScore: 75,
        matchedKeywords: [],
        missingKeywords: [],
        suggestions: [],
        noFalseDataGuarantee: false,
      })
      expect(result.success).toBe(false)
    })

    it('should reject match score out of range', () => {
      const result = TailoringReportSchema.safeParse({
        jobTitle: '',
        matchScore: 150,
        matchedKeywords: [],
        missingKeywords: [],
        suggestions: [],
        noFalseDataGuarantee: true,
      })
      expect(result.success).toBe(false)
    })
  })
})
