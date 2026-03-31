'use client'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import type { CV } from '@/lib/schema'
import { createExperienceItem, createEducationItem, createSkillItem, createProjectItem, createCertificationItem, createLanguageItem } from '@/lib/cv-defaults'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'

type Section = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'customize'

export default function EditorPage() {
  const [cv, setCV] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle')
  const [activeSection, setActiveSection] = useState<Section>('personal')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCV()
  }, [])

  const loadCV = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cv')
      const data = await res.json()
      if (data.cv) {
        setCV(data.cv)
      } else {
        // Create new CV
        const postRes = await fetch('/api/cv', { method: 'POST' })
        const postData = await postRes.json()
        if (postData.cv) setCV(postData.cv)
      }
    } catch {
      setError('Failed to load CV data.')
    } finally {
      setLoading(false)
    }
  }

  const saveCV = useCallback(async (updatedCV: CV) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/cv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCV),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }, [])

  const updateCV = useCallback((updates: Partial<CV>) => {
    if (!cv) return
    const updated = { ...cv, ...updates, updatedAt: new Date().toISOString() }
    setCV(updated)
    saveCV(updated)
  }, [cv, saveCV])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your CV...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <p className="text-gray-600">No CV found. <a href="/builder" className="text-blue-600">Create one first.</a></p>
        </div>
      </div>
    )
  }

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' },
    { id: 'languages', label: 'Languages', icon: '🌍' },
    { id: 'customize', label: 'Customize', icon: '🎨' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Status bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {saveStatus === 'saving' && <span className="text-blue-600">💾 Saving...</span>}
          {saveStatus === 'saved' && <span className="text-green-600">✅ Saved</span>}
          {saveStatus === 'error' && <span className="text-red-600">❌ Save failed</span>}
          {saveStatus === 'idle' && <span className="text-gray-400">Auto-save enabled</span>}
        </div>
        <div className="flex gap-2">
          <a href="/export" className="btn-secondary text-sm px-3 py-1.5">Export →</a>
          <a href="/tailor" className="btn-primary text-sm px-3 py-1.5">Tailor CV →</a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section Navigation */}
        <div className="w-48 bg-white border-r flex flex-col">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors ${activeSection === s.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Middle: Form */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeSection === 'personal' && <PersonalSection cv={cv} onChange={updateCV} />}
          {activeSection === 'summary' && <SummarySection cv={cv} onChange={updateCV} />}
          {activeSection === 'experience' && <ExperienceSection cv={cv} onChange={updateCV} />}
          {activeSection === 'education' && <EducationSection cv={cv} onChange={updateCV} />}
          {activeSection === 'skills' && <SkillsSection cv={cv} onChange={updateCV} />}
          {activeSection === 'projects' && <ProjectsSection cv={cv} onChange={updateCV} />}
          {activeSection === 'certifications' && <CertificationsSection cv={cv} onChange={updateCV} />}
          {activeSection === 'languages' && <LanguagesSection cv={cv} onChange={updateCV} />}
          {activeSection === 'customize' && <CustomizeSection cv={cv} onChange={updateCV} />}
        </div>

        {/* Right: Live Preview */}
        <div className="w-96 border-l bg-white overflow-y-auto">
          <div className="p-2 border-b bg-gray-50">
            <p className="text-xs text-gray-500 text-center">Live Preview</p>
          </div>
          <div className="p-2">
            <CVPreview cv={cv} />
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonalSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const p = cv.personal
  const update = (field: string, val: string) => onChange({ personal: { ...p, [field]: val } })

  return (
    <div className="card">
      <h2 className="section-title">👤 Personal Information</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="label-text">Full Name *</label><input className="input-field" value={p.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jane Smith" /></div>
        <div><label className="label-text">Professional Title</label><input className="input-field" value={p.title} onChange={e => update('title', e.target.value)} placeholder="Software Engineer" /></div>
        <div><label className="label-text">Email *</label><input className="input-field" type="email" value={p.email} onChange={e => update('email', e.target.value)} placeholder="jane@example.com" /></div>
        <div><label className="label-text">Phone</label><input className="input-field" value={p.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 555 000 0000" /></div>
        <div><label className="label-text">Location</label><input className="input-field" value={p.location} onChange={e => update('location', e.target.value)} placeholder="San Francisco, CA" /></div>
        <div><label className="label-text">Website</label><input className="input-field" value={p.website} onChange={e => update('website', e.target.value)} placeholder="https://yoursite.com" /></div>
        <div><label className="label-text">LinkedIn</label><input className="input-field" value={p.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="https://linkedin.com/in/you" /></div>
        <div><label className="label-text">GitHub</label><input className="input-field" value={p.github} onChange={e => update('github', e.target.value)} placeholder="https://github.com/you" /></div>
      </div>
    </div>
  )
}

function SummarySection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  return (
    <div className="card">
      <h2 className="section-title">📝 Professional Summary</h2>
      <textarea
        className="input-field h-40 resize-none"
        value={cv.summary}
        onChange={e => onChange({ summary: e.target.value })}
        placeholder="Write a brief professional summary that highlights your key skills and experience..."
        maxLength={1000}
      />
      <p className="text-xs text-gray-400 mt-1">{cv.summary.length}/1000 characters</p>
    </div>
  )
}

function ExperienceSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const addItem = () => onChange({ experience: [...cv.experience, createExperienceItem()] })
  const removeItem = (id: string) => onChange({ experience: cv.experience.filter(e => e.id !== id) })
  const updateItem = (id: string, field: string, val: any) => onChange({
    experience: cv.experience.map(e => e.id === id ? { ...e, [field]: val } : e)
  })
  const addBullet = (id: string) => onChange({
    experience: cv.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e)
  })
  const updateBullet = (id: string, idx: number, val: string) => onChange({
    experience: cv.experience.map(e => e.id === id ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? val : b) } : e)
  })
  const removeBullet = (id: string, idx: number) => onChange({
    experience: cv.experience.map(e => e.id === id ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e)
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">💼 Work Experience</h2>
        <button onClick={addItem} className="btn-secondary text-sm">+ Add Experience</button>
      </div>
      {cv.experience.length === 0 && (
        <div className="card text-center text-gray-500 py-8">No experience added yet. <button onClick={addItem} className="text-blue-600">Add your first job</button></div>
      )}
      {cv.experience.map((exp, idx) => (
        <div key={exp.id} className="card mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Position {idx + 1}</h3>
            <button onClick={() => removeItem(exp.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Job Title *</label><input className="input-field" value={exp.role} onChange={e => updateItem(exp.id, 'role', e.target.value)} placeholder="Software Engineer" /></div>
            <div><label className="label-text">Company *</label><input className="input-field" value={exp.company} onChange={e => updateItem(exp.id, 'company', e.target.value)} placeholder="Acme Corp" /></div>
            <div><label className="label-text">Location</label><input className="input-field" value={exp.location} onChange={e => updateItem(exp.id, 'location', e.target.value)} placeholder="New York, NY" /></div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id={`current-${exp.id}`} checked={exp.current} onChange={e => updateItem(exp.id, 'current', e.target.checked)} className="rounded" />
              <label htmlFor={`current-${exp.id}`} className="text-sm text-gray-700">Currently working here</label>
            </div>
            <div><label className="label-text">Start Date</label><input className="input-field" value={exp.startDate} onChange={e => updateItem(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></div>
            {!exp.current && <div><label className="label-text">End Date</label><input className="input-field" value={exp.endDate} onChange={e => updateItem(exp.id, 'endDate', e.target.value)} placeholder="Dec 2023" /></div>}
          </div>
          <div className="mt-3">
            <label className="label-text">Description</label>
            <textarea className="input-field h-20 resize-none" value={exp.description} onChange={e => updateItem(exp.id, 'description', e.target.value)} placeholder="Brief description of your role..." />
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <label className="label-text mb-0">Bullet Points</label>
              <button onClick={() => addBullet(exp.id)} className="text-blue-600 text-sm hover:underline">+ Add bullet</button>
            </div>
            {exp.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field flex-1" value={bullet} onChange={e => updateBullet(exp.id, i, e.target.value)} placeholder="Achieved X by doing Y resulting in Z..." />
                <button onClick={() => removeBullet(exp.id, i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EducationSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const addItem = () => onChange({ education: [...cv.education, createEducationItem()] })
  const removeItem = (id: string) => onChange({ education: cv.education.filter(e => e.id !== id) })
  const updateItem = (id: string, field: string, val: string) => onChange({
    education: cv.education.map(e => e.id === id ? { ...e, [field]: val } : e)
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">🎓 Education</h2>
        <button onClick={addItem} className="btn-secondary text-sm">+ Add Education</button>
      </div>
      {cv.education.length === 0 && (
        <div className="card text-center text-gray-500 py-8">No education added yet. <button onClick={addItem} className="text-blue-600">Add your first degree</button></div>
      )}
      {cv.education.map((edu, idx) => (
        <div key={edu.id} className="card mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Education {idx + 1}</h3>
            <button onClick={() => removeItem(edu.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Institution *</label><input className="input-field" value={edu.institution} onChange={e => updateItem(edu.id, 'institution', e.target.value)} placeholder="MIT" /></div>
            <div><label className="label-text">Degree *</label><input className="input-field" value={edu.degree} onChange={e => updateItem(edu.id, 'degree', e.target.value)} placeholder="Bachelor of Science" /></div>
            <div><label className="label-text">Field of Study</label><input className="input-field" value={edu.field} onChange={e => updateItem(edu.id, 'field', e.target.value)} placeholder="Computer Science" /></div>
            <div><label className="label-text">GPA</label><input className="input-field" value={edu.gpa} onChange={e => updateItem(edu.id, 'gpa', e.target.value)} placeholder="3.8/4.0" /></div>
            <div><label className="label-text">Start Date</label><input className="input-field" value={edu.startDate} onChange={e => updateItem(edu.id, 'startDate', e.target.value)} placeholder="Sep 2018" /></div>
            <div><label className="label-text">End Date</label><input className="input-field" value={edu.endDate} onChange={e => updateItem(edu.id, 'endDate', e.target.value)} placeholder="May 2022" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const [newSkill, setNewSkill] = useState('')

  const addSkill = () => {
    if (!newSkill.trim()) return
    const item = { ...createSkillItem(), name: newSkill.trim() }
    onChange({ skills: [...cv.skills, item] })
    setNewSkill('')
  }
  const removeItem = (id: string) => onChange({ skills: cv.skills.filter(s => s.id !== id) })

  return (
    <div className="card">
      <h2 className="section-title">⚡ Skills</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
          placeholder="Add a skill and press Enter..."
        />
        <button onClick={addSkill} className="btn-primary text-sm px-4">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cv.skills.map(skill => (
          <span key={skill.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            {skill.name}
            <button onClick={() => removeItem(skill.id)} className="hover:text-red-500 ml-1">✕</button>
          </span>
        ))}
        {cv.skills.length === 0 && <p className="text-gray-400 text-sm">No skills added yet.</p>}
      </div>
    </div>
  )
}

function ProjectsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const addItem = () => onChange({ projects: [...cv.projects, createProjectItem()] })
  const removeItem = (id: string) => onChange({ projects: cv.projects.filter(p => p.id !== id) })
  const updateItem = (id: string, field: string, val: any) => onChange({
    projects: cv.projects.map(p => p.id === id ? { ...p, [field]: val } : p)
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">🚀 Projects</h2>
        <button onClick={addItem} className="btn-secondary text-sm">+ Add Project</button>
      </div>
      {cv.projects.length === 0 && (
        <div className="card text-center text-gray-500 py-8">No projects added. <button onClick={addItem} className="text-blue-600">Add a project</button></div>
      )}
      {cv.projects.map((proj, idx) => (
        <div key={proj.id} className="card mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Project {idx + 1}</h3>
            <button onClick={() => removeItem(proj.id)} className="text-red-500 text-sm">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Project Name *</label><input className="input-field" value={proj.name} onChange={e => updateItem(proj.id, 'name', e.target.value)} placeholder="My Awesome App" /></div>
            <div><label className="label-text">URL</label><input className="input-field" value={proj.url} onChange={e => updateItem(proj.id, 'url', e.target.value)} placeholder="https://github.com/..." /></div>
          </div>
          <div className="mt-3"><label className="label-text">Description</label><textarea className="input-field h-20 resize-none" value={proj.description} onChange={e => updateItem(proj.id, 'description', e.target.value)} placeholder="Describe what this project does..." /></div>
          <div className="mt-3"><label className="label-text">Technologies (comma-separated)</label><input className="input-field" value={proj.technologies.join(', ')} onChange={e => updateItem(proj.id, 'technologies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="React, Node.js, PostgreSQL" /></div>
        </div>
      ))}
    </div>
  )
}

function CertificationsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const addItem = () => onChange({ certifications: [...cv.certifications, createCertificationItem()] })
  const removeItem = (id: string) => onChange({ certifications: cv.certifications.filter(c => c.id !== id) })
  const updateItem = (id: string, field: string, val: string) => onChange({
    certifications: cv.certifications.map(c => c.id === id ? { ...c, [field]: val } : c)
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">🏆 Certifications</h2>
        <button onClick={addItem} className="btn-secondary text-sm">+ Add Certification</button>
      </div>
      {cv.certifications.length === 0 && (
        <div className="card text-center text-gray-500 py-8">No certifications added. <button onClick={addItem} className="text-blue-600">Add a certification</button></div>
      )}
      {cv.certifications.map((cert, idx) => (
        <div key={cert.id} className="card mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Certification {idx + 1}</h3>
            <button onClick={() => removeItem(cert.id)} className="text-red-500 text-sm">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Certification Name *</label><input className="input-field" value={cert.name} onChange={e => updateItem(cert.id, 'name', e.target.value)} placeholder="AWS Certified Solutions Architect" /></div>
            <div><label className="label-text">Issuer</label><input className="input-field" value={cert.issuer} onChange={e => updateItem(cert.id, 'issuer', e.target.value)} placeholder="Amazon Web Services" /></div>
            <div><label className="label-text">Date</label><input className="input-field" value={cert.date} onChange={e => updateItem(cert.id, 'date', e.target.value)} placeholder="Jan 2024" /></div>
            <div><label className="label-text">Credential ID</label><input className="input-field" value={cert.credentialId} onChange={e => updateItem(cert.id, 'credentialId', e.target.value)} placeholder="ABC123" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LanguagesSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const addItem = () => onChange({ languages: [...cv.languages, createLanguageItem()] })
  const removeItem = (id: string) => onChange({ languages: cv.languages.filter(l => l.id !== id) })
  const updateItem = (id: string, field: string, val: any) => onChange({
    languages: cv.languages.map(l => l.id === id ? { ...l, [field]: val } : l)
  })

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">🌍 Languages</h2>
        <button onClick={addItem} className="btn-secondary text-sm">+ Add Language</button>
      </div>
      {cv.languages.length === 0 && (
        <div className="text-center text-gray-500 py-4">No languages added. <button onClick={addItem} className="text-blue-600">Add a language</button></div>
      )}
      <div className="space-y-3">
        {cv.languages.map(lang => (
          <div key={lang.id} className="flex gap-3 items-center">
            <input className="input-field flex-1" value={lang.name} onChange={e => updateItem(lang.id, 'name', e.target.value)} placeholder="English" />
            <select className="input-field w-40" value={lang.level || ''} onChange={e => updateItem(lang.id, 'level', e.target.value || undefined)}>
              <option value="">Level...</option>
              <option value="native">Native</option>
              <option value="fluent">Fluent</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="beginner">Beginner</option>
            </select>
            <button onClick={() => removeItem(lang.id)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomizeSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const c = cv.customization
  const update = (field: string, val: any) => onChange({ customization: { ...c, [field]: val } })

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title">🎨 Template &amp; Colors</h2>
        <div className="space-y-3">
          <div>
            <label className="label-text">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {BUILT_IN_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => update('templateId', t.id)}
                  className={`p-2 text-sm rounded border-2 transition-colors text-left ${c.templateId === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.columns === 2 ? '2-col' : '1-col'}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Primary Color</label><input type="color" className="w-full h-10 rounded border border-gray-300 cursor-pointer" value={c.primaryColor} onChange={e => update('primaryColor', e.target.value)} /></div>
            <div><label className="label-text">Text Color</label><input type="color" className="w-full h-10 rounded border border-gray-300 cursor-pointer" value={c.textColor} onChange={e => update('textColor', e.target.value)} /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">📏 Typography &amp; Layout</h2>
        <div className="space-y-3">
          <div>
            <label className="label-text">Font Family</label>
            <select className="input-field" value={c.fontFamily} onChange={e => update('fontFamily', e.target.value)}>
              <option value="Inter">Inter (Modern)</option>
              <option value="Georgia">Georgia (Classic)</option>
              <option value="Times New Roman">Times New Roman (Academic)</option>
              <option value="Arial">Arial (Clean)</option>
              <option value="Helvetica">Helvetica (Professional)</option>
            </select>
          </div>
          <div>
            <label className="label-text">Font Size: {c.fontSize}px</label>
            <input type="range" min="9" max="14" step="0.5" value={c.fontSize} onChange={e => update('fontSize', Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="label-text">Spacing</label>
            <select className="input-field" value={c.spacing} onChange={e => update('spacing', e.target.value)}>
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
          <div>
            <label className="label-text">Paper Size</label>
            <select className="input-field" value={c.paperSize} onChange={e => update('paperSize', e.target.value as 'a4' | 'letter')}>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">👁️ Show/Hide Sections</h2>
        <div className="space-y-2">
          {['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'].map(section => (
            <label key={section} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!c.hiddenSections.includes(section)}
                onChange={e => {
                  if (e.target.checked) {
                    update('hiddenSections', c.hiddenSections.filter(s => s !== section))
                  } else {
                    update('hiddenSections', [...c.hiddenSections, section])
                  }
                }}
                className="rounded"
              />
              <span className="text-sm capitalize">{section}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function CVPreview({ cv }: { cv: CV }) {
  const { primaryColor, textColor, fontFamily, fontSize } = cv.customization
  const template = BUILT_IN_TEMPLATES.find(t => t.id === cv.customization.templateId)
  const isTwoCol = template?.columns === 2

  const visibleSections = cv.customization.sectionOrder.filter(s => !cv.customization.hiddenSections.includes(s))

  return (
    <div
      style={{
        fontFamily,
        fontSize: `${fontSize - 2}px`,
        color: textColor,
        lineHeight: cv.customization.lineHeight,
        transform: 'scale(0.55)',
        transformOrigin: 'top left',
        width: '595px',
        minHeight: '842px',
        background: '#fff',
        padding: '32px',
        border: '1px solid #e5e7eb',
      }}
      className="cv-preview"
    >
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${primaryColor}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: `${fontSize + 8}px`, fontWeight: 'bold', color: textColor }}>{cv.personal.fullName || 'Your Name'}</div>
        {cv.personal.title && <div style={{ fontSize: `${fontSize + 1}px`, color: primaryColor }}>{cv.personal.title}</div>}
        <div style={{ fontSize: `${fontSize - 2}px`, color: '#666', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {cv.personal.email && <span>{cv.personal.email}</span>}
          {cv.personal.phone && <span>{cv.personal.phone}</span>}
          {cv.personal.location && <span>{cv.personal.location}</span>}
        </div>
      </div>

      {isTwoCol ? (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '35%' }}>
            {visibleSections.filter(s => ['summary', 'skills', 'languages', 'certifications'].includes(s)).map(s => (
              <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {visibleSections.filter(s => ['experience', 'education', 'projects'].includes(s)).map(s => (
              <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
            ))}
          </div>
        </div>
      ) : (
        visibleSections.filter(s => s !== 'personal').map(s => (
          <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
        ))
      )}
    </div>
  )
}

function PreviewSection({ section, cv, primaryColor, fontSize }: { section: string; cv: CV; primaryColor: string; fontSize: number }) {
  const sectionTitles: Record<string, string> = {
    summary: 'Summary', experience: 'Experience', education: 'Education',
    skills: 'Skills', projects: 'Projects', certifications: 'Certifications', languages: 'Languages',
  }

  const hasContent = () => {
    switch (section) {
      case 'summary': return cv.summary.length > 0
      case 'experience': return cv.experience.length > 0
      case 'education': return cv.education.length > 0
      case 'skills': return cv.skills.length > 0
      case 'projects': return cv.projects.length > 0
      case 'certifications': return cv.certifications.length > 0
      case 'languages': return cv.languages.length > 0
      default: return false
    }
  }

  if (!hasContent()) return null

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: primaryColor, borderBottom: `1px solid ${primaryColor}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {sectionTitles[section]}
      </div>
      {section === 'summary' && <div style={{ fontSize: `${fontSize - 2}px` }}>{cv.summary.substring(0, 200)}</div>}
      {section === 'experience' && cv.experience.slice(0, 3).map(exp => (
        <div key={exp.id} style={{ marginBottom: '6px', fontSize: `${fontSize - 2}px` }}>
          <div><strong>{exp.role}</strong> @ {exp.company}</div>
          <div style={{ color: '#666', fontSize: `${fontSize - 3}px` }}>{exp.startDate}{exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}</div>
        </div>
      ))}
      {section === 'education' && cv.education.slice(0, 2).map(edu => (
        <div key={edu.id} style={{ marginBottom: '6px', fontSize: `${fontSize - 2}px` }}>
          <div><strong>{edu.degree}</strong></div>
          <div style={{ color: '#666' }}>{edu.institution}</div>
        </div>
      ))}
      {section === 'skills' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {cv.skills.slice(0, 15).map(s => (
            <span key={s.id} style={{ background: `${primaryColor}20`, color: primaryColor, padding: '1px 6px', borderRadius: '10px', fontSize: `${fontSize - 3}px` }}>{s.name}</span>
          ))}
        </div>
      )}
      {section === 'projects' && cv.projects.slice(0, 2).map(p => (
        <div key={p.id} style={{ marginBottom: '4px', fontSize: `${fontSize - 2}px` }}><strong>{p.name}</strong></div>
      ))}
      {section === 'certifications' && cv.certifications.slice(0, 3).map(c => (
        <div key={c.id} style={{ marginBottom: '4px', fontSize: `${fontSize - 2}px` }}>{c.name} – {c.issuer}</div>
      ))}
      {section === 'languages' && (
        <div style={{ fontSize: `${fontSize - 2}px` }}>{cv.languages.map(l => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(', ')}</div>
      )}
    </div>
  )
}
