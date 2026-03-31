import { z } from 'zod'

export const PersonalInfoSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  website: z.string().default(''),
  linkedin: z.string().default(''),
  github: z.string().default(''),
  title: z.string().default(''),
  photo: z.string().optional(), // base64 or filename
})

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().default(''),
  role: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  current: z.boolean().default(false),
  description: z.string().default(''),
  bullets: z.array(z.string()).default([]),
  location: z.string().default(''),
})

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gpa: z.string().default(''),
  description: z.string().default(''),
})

export const SkillItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  category: z.string().default(''),
})

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  description: z.string().default(''),
  url: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
})

export const CertificationItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  expiryDate: z.string().default(''),
  credentialId: z.string().default(''),
  url: z.string().default(''),
})

export const LanguageItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  level: z.enum(['native', 'fluent', 'advanced', 'intermediate', 'beginner']).optional(),
})

export const SectionOrderSchema = z.array(z.enum([
  'personal', 'summary', 'experience', 'education', 'skills',
  'projects', 'certifications', 'languages',
]))

export const TemplateCustomizationSchema = z.object({
  templateId: z.string().default('modern'),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().default(11),
  lineHeight: z.number().default(1.5),
  primaryColor: z.string().default('#2563eb'),
  secondaryColor: z.string().default('#64748b'),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#1e293b'),
  spacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  sectionOrder: SectionOrderSchema.default([
    'personal', 'summary', 'experience', 'education', 'skills',
    'projects', 'certifications', 'languages',
  ]),
  hiddenSections: z.array(z.string()).default([]),
  paperSize: z.enum(['a4', 'letter']).default('a4'),
})

export const CVSchema = z.object({
  id: z.string(),
  personal: PersonalInfoSchema.default({}),
  summary: z.string().default(''),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(SkillItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  customization: TemplateCustomizationSchema.default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Suggestion types for Smart Tailoring
export const SuggestionTypeSchema = z.enum([
  'REWRITE', 'REORDER', 'EMPHASIZE', 'REMOVE_REDUNDANCY', 'PROMPT_IF_TRUE',
])

export const TailoringSuggestionSchema = z.object({
  id: z.string(),
  type: SuggestionTypeSchema,
  section: z.string(),
  itemId: z.string().optional(),
  original: z.string(),
  suggested: z.string(),
  reason: z.string(),
  requiresUserConfirmation: z.boolean().default(false),
  applied: z.boolean().default(false),
  // Fields that are NEVER auto-applied
  isPromptIfTrue: z.boolean().default(false),
})

export const TailoringReportSchema = z.object({
  jobTitle: z.string().default(''),
  matchScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(TailoringSuggestionSchema),
  noFalseDataGuarantee: z.literal(true),
})

// Extracted field with confidence
export const ExtractedFieldSchema = z.object({
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
  sourceSnippet: z.string().optional(),
  page: z.number().optional(),
})

export const ExtractionResultSchema = z.object({
  cv: CVSchema,
  extractedFields: z.record(z.string(), ExtractedFieldSchema),
  warnings: z.array(z.string()),
})

// Template definition
export const TemplateBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['header', 'sidebar', 'main', 'footer', 'section']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  section: z.string().optional(),
})

export const DerivedTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  pageRatio: z.enum(['a4', 'letter']),
  columns: z.number().min(1).max(2),
  blocks: z.array(TemplateBlockSchema),
  palette: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  spacing: z.enum(['compact', 'normal', 'relaxed']),
  fallbackTemplateId: z.string().optional(),
})

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>
export type EducationItem = z.infer<typeof EducationItemSchema>
export type SkillItem = z.infer<typeof SkillItemSchema>
export type ProjectItem = z.infer<typeof ProjectItemSchema>
export type CertificationItem = z.infer<typeof CertificationItemSchema>
export type LanguageItem = z.infer<typeof LanguageItemSchema>
export type TemplateCustomization = z.infer<typeof TemplateCustomizationSchema>
export type CV = z.infer<typeof CVSchema>
export type SuggestionType = z.infer<typeof SuggestionTypeSchema>
export type TailoringSuggestion = z.infer<typeof TailoringSuggestionSchema>
export type TailoringReport = z.infer<typeof TailoringReportSchema>
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
export type TemplateBlock = z.infer<typeof TemplateBlockSchema>
export type DerivedTemplate = z.infer<typeof DerivedTemplateSchema>
