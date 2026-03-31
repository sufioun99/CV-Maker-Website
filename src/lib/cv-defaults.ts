import { v4 as uuidv4 } from 'uuid'
import type { CV } from './schema'

export function createDefaultCV(): CV {
  return {
    id: uuidv4(),
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      title: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    customization: {
      templateId: 'modern',
      fontFamily: 'Inter',
      fontSize: 11,
      lineHeight: 1.5,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      spacing: 'normal',
      sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
      hiddenSections: [],
      paperSize: 'a4',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function createExperienceItem() {
  return { id: uuidv4(), company: '', role: '', startDate: '', endDate: '', current: false, description: '', bullets: [], location: '' }
}

export function createEducationItem() {
  return { id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', description: '' }
}

export function createSkillItem() {
  return { id: uuidv4(), name: '', category: '' }
}

export function createProjectItem() {
  return { id: uuidv4(), name: '', description: '', url: '', technologies: [], startDate: '', endDate: '' }
}

export function createCertificationItem() {
  return { id: uuidv4(), name: '', issuer: '', date: '', expiryDate: '', credentialId: '', url: '' }
}

export function createLanguageItem() {
  return { id: uuidv4(), name: '' }
}
