'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/Navbar'
import PhotoUpload from '@/components/PhotoUpload'
import ProgressIndicator from '@/components/ProgressIndicator'
import type { CV } from '@/lib/schema'
import { createExperienceItem, createEducationItem, createSkillItem, createProjectItem, createCertificationItem, createLanguageItem } from '@/lib/cv-defaults'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'

type Section = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'customize'

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'personal',       label: 'Personal',       icon: '👤' },
  { id: 'summary',        label: 'Summary',        icon: '📝' },
  { id: 'experience',     label: 'Experience',     icon: '💼' },
  { id: 'education',      label: 'Education',      icon: '🎓' },
  { id: 'skills',         label: 'Skills',         icon: '⚡' },
  { id: 'projects',       label: 'Projects',       icon: '🚀' },
  { id: 'certifications', label: 'Certifications', icon: '🏆' },
  { id: 'languages',      label: 'Languages',      icon: '🌍' },
  { id: 'customize',      label: 'Customize',      icon: '🎨' },
]

export default function EditorPage() {
  const [cv, setCV] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle')
  const [activeSection, setActiveSection] = useState<Section>('personal')
  const [error, setError] = useState('')

  useEffect(() => { loadCV() }, [])

  const loadCV = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cv')
      const data = await res.json()
      if (data.cv) {
        setCV(data.cv)
      } else {
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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center animate-fade-in">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading your CV…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
          {error && <p className="alert-error mb-4">{error}</p>}
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No CV found</h2>
          <p className="text-gray-500 mb-6">Create a new CV to get started.</p>
          <a href="/builder" className="btn-primary">Create a CV</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* ── Status / action bar ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap sticky top-16 z-40 shadow-sm">
        {/* Save status */}
        <div className="flex items-center gap-2 min-w-0">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
              Saving…
            </span>
          )}
          {saveStatus === 'saved'  && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
          {saveStatus === 'error'  && <span className="text-sm text-red-600">⚠ Save failed — retrying…</span>}
          {saveStatus === 'idle'   && <span className="text-sm text-gray-400">Auto-save on</span>}
        </div>

        {/* Progress */}
        <div className="hidden sm:block flex-1 max-w-xs">
          <ProgressIndicator cv={cv} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="/tailor" className="btn-secondary text-sm py-1.5">🤖 Tailor</a>
          <a href="/export" className="btn-primary text-sm py-1.5">💾 Export</a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: section navigation ── */}
        <aside className="hidden md:flex w-44 bg-white border-r border-gray-100 flex-col shadow-sm z-10 overflow-y-auto">
          <div className="p-3 pt-4 space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-150 ${
                  activeSection === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base leading-none">{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Mobile section tabs ── */}
        <div className="md:hidden bg-white border-b border-gray-100 overflow-x-auto flex gap-1 px-2 py-2 sticky top-[calc(4rem+3rem)] z-30">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === s.id ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ── Middle: form editor ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto animate-fade-in" key={activeSection}>
            {activeSection === 'personal'       && <PersonalSection cv={cv} onChange={updateCV} />}
            {activeSection === 'summary'        && <SummarySection cv={cv} onChange={updateCV} />}
            {activeSection === 'experience'     && <ExperienceSection cv={cv} onChange={updateCV} />}
            {activeSection === 'education'      && <EducationSection cv={cv} onChange={updateCV} />}
            {activeSection === 'skills'         && <SkillsSection cv={cv} onChange={updateCV} />}
            {activeSection === 'projects'       && <ProjectsSection cv={cv} onChange={updateCV} />}
            {activeSection === 'certifications' && <CertificationsSection cv={cv} onChange={updateCV} />}
            {activeSection === 'languages'      && <LanguagesSection cv={cv} onChange={updateCV} />}
            {activeSection === 'customize'      && <CustomizeSection cv={cv} onChange={updateCV} />}
          </div>
        </main>

        {/* ── Right: live preview ── */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-l border-gray-100 bg-gray-100 flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
            <span className="text-xs text-gray-400">Scaled 55%</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex justify-center">
            <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '595px', flexShrink: 0 }}>
              <CVPreview cv={cv} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ─────────────────── Personal Info ─────────────────── */
function PersonalSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const p = cv.personal
  const up = (field: string, val: string) => onChange({ personal: { ...p, [field]: val } })

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title">👤 Personal Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-text">Full Name <span className="text-red-400">*</span></label>
            <input className="input-field" value={p.fullName} onChange={e => up('fullName', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Professional Title</label>
            <input className="input-field" value={p.title} onChange={e => up('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div>
            <label className="label-text">Email <span className="text-red-400">*</span></label>
            <input className="input-field" type="email" value={p.email} onChange={e => up('email', e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="label-text">Phone</label>
            <input className="input-field" value={p.phone} onChange={e => up('phone', e.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <label className="label-text">Location</label>
            <input className="input-field" value={p.location} onChange={e => up('location', e.target.value)} placeholder="San Francisco, CA" />
          </div>
          <div>
            <label className="label-text">Website</label>
            <input className="input-field" value={p.website} onChange={e => up('website', e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div>
            <label className="label-text">LinkedIn</label>
            <input className="input-field" value={p.linkedin} onChange={e => up('linkedin', e.target.value)} placeholder="https://linkedin.com/in/you" />
          </div>
          <div>
            <label className="label-text">GitHub</label>
            <input className="input-field" value={p.github} onChange={e => up('github', e.target.value)} placeholder="https://github.com/you" />
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <div className="card">
        <h2 className="section-title">📷 Profile Photo</h2>
        <PhotoUpload
          value={p.photo}
          shape={cv.customization.photoShape ?? 'circle'}
          onPhotoChange={base64 => onChange({ personal: { ...p, photo: base64 } })}
          onShapeChange={shape => onChange({ customization: { ...cv.customization, photoShape: shape } })}
        />
        <p className="text-xs text-gray-400 mt-3">
          Optional. Photo is stored only in your session and never uploaded to any server.
        </p>
      </div>
    </div>
  )
}

/* ─────────────────── Summary ─────────────────── */
function SummarySection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  return (
    <div className="card">
      <h2 className="section-title">📝 Professional Summary</h2>
      <p className="text-xs text-gray-400 mb-3">
        2–4 sentences highlighting your experience, key skills, and career goal. Keep it concise and tailored.
      </p>
      <textarea
        className="input-field h-40 resize-y"
        value={cv.summary}
        onChange={e => onChange({ summary: e.target.value })}
        placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications…"
        maxLength={1000}
      />
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">{cv.summary.length}/1000</span>
        {cv.summary.length < 100 && cv.summary.length > 0 && (
          <span className="text-xs text-amber-500">💡 Aim for at least 100 characters</span>
        )}
      </div>
    </div>
  )
}

/* ─────────────────── Experience ─────────────────── */
function ExperienceSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const add    = () => onChange({ experience: [...cv.experience, createExperienceItem()] })
  const remove = (id: string) => onChange({ experience: cv.experience.filter(e => e.id !== id) })
  const upd    = (id: string, field: string, val: unknown) => onChange({
    experience: cv.experience.map(e => e.id === id ? { ...e, [field]: val } : e)
  })
  const addBullet    = (id: string) => onChange({ experience: cv.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e) })
  const updBullet    = (id: string, i: number, val: string) => onChange({ experience: cv.experience.map(e => e.id === id ? { ...e, bullets: e.bullets.map((b, j) => j === i ? val : b) } : e) })
  const removeBullet = (id: string, i: number) => onChange({ experience: cv.experience.map(e => e.id === id ? { ...e, bullets: e.bullets.filter((_, j) => j !== i) } : e) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">💼 Work Experience</h2>
        <button onClick={add} className="btn-secondary text-sm">+ Add</button>
      </div>

      {cv.experience.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">💼</div>
          <p className="text-gray-500 mb-3">No work experience added yet.</p>
          <button onClick={add} className="btn-primary text-sm">Add your first job</button>
        </div>
      )}

      {cv.experience.map((exp, idx) => (
        <div key={exp.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-gray">Position {idx + 1}</span>
            <button onClick={() => remove(exp.id)} className="text-sm text-red-500 hover:text-red-700 transition-colors">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Job Title <span className="text-red-400">*</span></label><input className="input-field" value={exp.role} onChange={e => upd(exp.id, 'role', e.target.value)} placeholder="Software Engineer" /></div>
            <div><label className="label-text">Company <span className="text-red-400">*</span></label><input className="input-field" value={exp.company} onChange={e => upd(exp.id, 'company', e.target.value)} placeholder="Acme Corp" /></div>
            <div><label className="label-text">Location</label><input className="input-field" value={exp.location} onChange={e => upd(exp.id, 'location', e.target.value)} placeholder="New York, NY" /></div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id={`cur-${exp.id}`} checked={exp.current} onChange={e => upd(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
              <label htmlFor={`cur-${exp.id}`} className="text-sm text-gray-700 cursor-pointer">Currently here</label>
            </div>
            <div><label className="label-text">Start Date</label><input className="input-field" value={exp.startDate} onChange={e => upd(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></div>
            {!exp.current && <div><label className="label-text">End Date</label><input className="input-field" value={exp.endDate} onChange={e => upd(exp.id, 'endDate', e.target.value)} placeholder="Dec 2023" /></div>}
          </div>
          <div className="mt-3">
            <label className="label-text">Description</label>
            <textarea className="input-field h-20 resize-y" value={exp.description} onChange={e => upd(exp.id, 'description', e.target.value)} placeholder="Brief overview of your role and responsibilities…" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="label-text mb-0">Key Achievements</label>
              <button onClick={() => addBullet(exp.id)} className="text-xs text-blue-600 hover:text-blue-800">+ Add bullet</button>
            </div>
            {exp.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-gray-400 mt-2.5 text-xs">•</span>
                <input className="input-field flex-1" value={b} onChange={e => updBullet(exp.id, i, e.target.value)} placeholder="Increased performance by 40% by optimising database queries…" />
                <button onClick={() => removeBullet(exp.id, i)} className="btn-icon text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────── Education ─────────────────── */
function EducationSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const add    = () => onChange({ education: [...cv.education, createEducationItem()] })
  const remove = (id: string) => onChange({ education: cv.education.filter(e => e.id !== id) })
  const upd    = (id: string, field: string, val: string) => onChange({ education: cv.education.map(e => e.id === id ? { ...e, [field]: val } : e) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">🎓 Education</h2>
        <button onClick={add} className="btn-secondary text-sm">+ Add</button>
      </div>

      {cv.education.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-500 mb-3">No education added yet.</p>
          <button onClick={add} className="btn-primary text-sm">Add your degree</button>
        </div>
      )}

      {cv.education.map((edu, idx) => (
        <div key={edu.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-gray">Education {idx + 1}</span>
            <button onClick={() => remove(edu.id)} className="text-sm text-red-500 hover:text-red-700 transition-colors">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Institution <span className="text-red-400">*</span></label><input className="input-field" value={edu.institution} onChange={e => upd(edu.id, 'institution', e.target.value)} placeholder="MIT" /></div>
            <div><label className="label-text">Degree <span className="text-red-400">*</span></label><input className="input-field" value={edu.degree} onChange={e => upd(edu.id, 'degree', e.target.value)} placeholder="Bachelor of Science" /></div>
            <div><label className="label-text">Field of Study</label><input className="input-field" value={edu.field} onChange={e => upd(edu.id, 'field', e.target.value)} placeholder="Computer Science" /></div>
            <div><label className="label-text">GPA</label><input className="input-field" value={edu.gpa} onChange={e => upd(edu.id, 'gpa', e.target.value)} placeholder="3.8/4.0" /></div>
            <div><label className="label-text">Start Date</label><input className="input-field" value={edu.startDate} onChange={e => upd(edu.id, 'startDate', e.target.value)} placeholder="Sep 2018" /></div>
            <div><label className="label-text">End Date</label><input className="input-field" value={edu.endDate} onChange={e => upd(edu.id, 'endDate', e.target.value)} placeholder="May 2022" /></div>
          </div>
          {edu.description && (
            <div className="mt-3"><label className="label-text">Additional Notes</label><textarea className="input-field h-16 resize-y" value={edu.description} onChange={e => upd(edu.id, 'description', e.target.value)} /></div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────── Skills ─────────────────── */
function SkillsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const [newSkill, setNewSkill] = useState('')
  const [newLevel, setNewLevel] = useState<string>('')

  const add = () => {
    const name = newSkill.trim()
    if (!name) return
    const item = { ...createSkillItem(), name, level: (newLevel || undefined) as ('beginner'|'intermediate'|'advanced'|'expert'|undefined) }
    onChange({ skills: [...cv.skills, item] })
    setNewSkill('')
    setNewLevel('')
  }

  const remove = (id: string) => onChange({ skills: cv.skills.filter(s => s.id !== id) })

  const levelColors: Record<string, string> = {
    beginner: 'bg-gray-100 text-gray-600',
    intermediate: 'bg-blue-50 text-blue-700',
    advanced: 'bg-indigo-50 text-indigo-700',
    expert: 'bg-violet-50 text-violet-700',
  }

  return (
    <div className="card">
      <h2 className="section-title">⚡ Skills</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="e.g. TypeScript, Project Management…"
        />
        <select className="input-field w-36" value={newLevel} onChange={e => setNewLevel(e.target.value)}>
          <option value="">Level…</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <button onClick={add} className="btn-primary text-sm px-4">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cv.skills.map(skill => (
          <span
            key={skill.id}
            className={`tag gap-1.5 ${skill.level ? levelColors[skill.level] : 'bg-blue-50 text-blue-700'}`}
          >
            {skill.name}
            {skill.level && <span className="text-xs opacity-60">· {skill.level}</span>}
            <button onClick={() => remove(skill.id)} className="hover:opacity-80 ml-0.5">✕</button>
          </span>
        ))}
        {cv.skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet. Type one and press Enter.</p>}
      </div>
      {cv.skills.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">{cv.skills.length} skill{cv.skills.length === 1 ? '' : 's'} added</p>
      )}
    </div>
  )
}

/* ─────────────────── Projects ─────────────────── */
function ProjectsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const add    = () => onChange({ projects: [...cv.projects, createProjectItem()] })
  const remove = (id: string) => onChange({ projects: cv.projects.filter(p => p.id !== id) })
  const upd    = (id: string, field: string, val: unknown) => onChange({ projects: cv.projects.map(p => p.id === id ? { ...p, [field]: val } : p) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">🚀 Projects</h2>
        <button onClick={add} className="btn-secondary text-sm">+ Add</button>
      </div>

      {cv.projects.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">🚀</div>
          <p className="text-gray-500 mb-3">Showcase your best projects.</p>
          <button onClick={add} className="btn-primary text-sm">Add a project</button>
        </div>
      )}

      {cv.projects.map((proj, idx) => (
        <div key={proj.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-gray">Project {idx + 1}</span>
            <button onClick={() => remove(proj.id)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Project Name <span className="text-red-400">*</span></label><input className="input-field" value={proj.name} onChange={e => upd(proj.id, 'name', e.target.value)} placeholder="My Awesome App" /></div>
            <div><label className="label-text">URL / Link</label><input className="input-field" value={proj.url} onChange={e => upd(proj.id, 'url', e.target.value)} placeholder="https://github.com/…" /></div>
          </div>
          <div className="mt-3"><label className="label-text">Description</label><textarea className="input-field h-20 resize-y" value={proj.description} onChange={e => upd(proj.id, 'description', e.target.value)} placeholder="What does this project do? What problem does it solve?" /></div>
          <div className="mt-3"><label className="label-text">Technologies</label><input className="input-field" value={proj.technologies.join(', ')} onChange={e => upd(proj.id, 'technologies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="React, Node.js, PostgreSQL" /></div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────── Certifications ─────────────────── */
function CertificationsSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const add    = () => onChange({ certifications: [...cv.certifications, createCertificationItem()] })
  const remove = (id: string) => onChange({ certifications: cv.certifications.filter(c => c.id !== id) })
  const upd    = (id: string, field: string, val: string) => onChange({ certifications: cv.certifications.map(c => c.id === id ? { ...c, [field]: val } : c) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">🏆 Certifications</h2>
        <button onClick={add} className="btn-secondary text-sm">+ Add</button>
      </div>

      {cv.certifications.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-500 mb-3">Add professional certifications and licences.</p>
          <button onClick={add} className="btn-primary text-sm">Add a certification</button>
        </div>
      )}

      {cv.certifications.map((cert, idx) => (
        <div key={cert.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-gray">Certification {idx + 1}</span>
            <button onClick={() => remove(cert.id)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label-text">Name <span className="text-red-400">*</span></label><input className="input-field" value={cert.name} onChange={e => upd(cert.id, 'name', e.target.value)} placeholder="AWS Solutions Architect" /></div>
            <div><label className="label-text">Issuer</label><input className="input-field" value={cert.issuer} onChange={e => upd(cert.id, 'issuer', e.target.value)} placeholder="Amazon Web Services" /></div>
            <div><label className="label-text">Date</label><input className="input-field" value={cert.date} onChange={e => upd(cert.id, 'date', e.target.value)} placeholder="Jan 2024" /></div>
            <div><label className="label-text">Credential ID</label><input className="input-field" value={cert.credentialId} onChange={e => upd(cert.id, 'credentialId', e.target.value)} placeholder="ABC123" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────── Languages ─────────────────── */
function LanguagesSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const add    = () => onChange({ languages: [...cv.languages, createLanguageItem()] })
  const remove = (id: string) => onChange({ languages: cv.languages.filter(l => l.id !== id) })
  const upd    = (id: string, field: string, val: unknown) => onChange({ languages: cv.languages.map(l => l.id === id ? { ...l, [field]: val } : l) })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">🌍 Languages</h2>
        <button onClick={add} className="btn-secondary text-sm">+ Add</button>
      </div>

      {cv.languages.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-3">List languages you speak.</p>
          <button onClick={add} className="btn-primary text-sm">Add a language</button>
        </div>
      )}

      <div className="space-y-3">
        {cv.languages.map(lang => (
          <div key={lang.id} className="flex gap-3 items-center bg-gray-50 rounded-lg p-3">
            <input
              className="input-field flex-1 bg-white"
              value={lang.name}
              onChange={e => upd(lang.id, 'name', e.target.value)}
              placeholder="e.g. English"
            />
            <select
              className="input-field w-40 bg-white"
              value={lang.level || ''}
              onChange={e => upd(lang.id, 'level', e.target.value || undefined)}
            >
              <option value="">Proficiency…</option>
              <option value="native">Native</option>
              <option value="fluent">Fluent (C2)</option>
              <option value="advanced">Advanced (C1)</option>
              <option value="intermediate">Intermediate (B1-B2)</option>
              <option value="beginner">Beginner (A1-A2)</option>
            </select>
            <button onClick={() => remove(lang.id)} className="btn-icon text-red-400 hover:text-red-600">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────── Customize ─────────────────── */
function CustomizeSection({ cv, onChange }: { cv: CV; onChange: (u: Partial<CV>) => void }) {
  const c   = cv.customization
  const upd = (field: string, val: unknown) => onChange({ customization: { ...c, [field]: val } })

  const PRESET_THEMES = [
    { name: 'Ocean Blue',    primary: '#2563eb', secondary: '#64748b' },
    { name: 'Forest Green',  primary: '#059669', secondary: '#64748b' },
    { name: 'Deep Purple',   primary: '#7c3aed', secondary: '#64748b' },
    { name: 'Crimson',       primary: '#dc2626', secondary: '#64748b' },
    { name: 'Charcoal',      primary: '#374151', secondary: '#9ca3af' },
    { name: 'Teal',          primary: '#0891b2', secondary: '#64748b' },
  ]

  return (
    <div className="space-y-4">
      {/* Template picker */}
      <div className="card">
        <h2 className="section-title">🎨 Template</h2>
        <div className="grid grid-cols-2 gap-2">
          {BUILT_IN_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => upd('templateId', t.id)}
              className={`p-3 text-left rounded-xl border-2 transition-all ${c.templateId === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: t.accentColor }} />
                <span className="font-medium text-sm">{t.name}</span>
              </div>
              <span className="text-xs text-gray-500">{t.columns === 2 ? '2-column' : '1-column'} · {t.fontFamily}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preset themes */}
      <div className="card">
        <h2 className="section-title">🎨 Colour Themes</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESET_THEMES.map(t => (
            <button
              key={t.name}
              onClick={() => onChange({ customization: { ...c, primaryColor: t.primary, secondaryColor: t.secondary } })}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${c.primaryColor === t.primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: t.primary }} />
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-text">Primary Colour</label>
            <input type="color" className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer p-1" value={c.primaryColor} onChange={e => upd('primaryColor', e.target.value)} />
          </div>
          <div>
            <label className="label-text">Text Colour</label>
            <input type="color" className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer p-1" value={c.textColor} onChange={e => upd('textColor', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card">
        <h2 className="section-title">📐 Typography &amp; Layout</h2>
        <div className="space-y-4">
          <div>
            <label className="label-text">Font Family</label>
            <select className="input-field" value={c.fontFamily} onChange={e => upd('fontFamily', e.target.value)}>
              <option value="Inter">Inter — Modern &amp; Clean</option>
              <option value="Georgia">Georgia — Classic &amp; Elegant</option>
              <option value="Times New Roman">Times New Roman — Academic</option>
              <option value="Arial">Arial — Simple &amp; Universal</option>
              <option value="Helvetica">Helvetica — Professional</option>
              <option value="Poppins">Poppins — Creative</option>
            </select>
          </div>
          <div>
            <label className="label-text">Font Size — {c.fontSize}px</label>
            <input type="range" min="9" max="14" step="0.5" value={c.fontSize} onChange={e => upd('fontSize', Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>9px</span><span>14px</span></div>
          </div>
          <div>
            <label className="label-text">Section Spacing</label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'relaxed'] as const).map(s => (
                <button key={s} onClick={() => upd('spacing', s)} className={`flex-1 py-2 rounded-lg border-2 text-sm capitalize transition-all ${c.spacing === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-text">Paper Size</label>
            <div className="flex gap-2">
              {(['a4', 'letter'] as const).map(s => (
                <button key={s} onClick={() => upd('paperSize', s)} className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${c.paperSize === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s === 'a4' ? 'A4' : 'US Letter'}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section visibility */}
      <div className="card">
        <h2 className="section-title">👁️ Show / Hide Sections</h2>
        <div className="space-y-2">
          {(['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'] as const).map(section => (
            <label key={section} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={!c.hiddenSections.includes(section)}
                onChange={e => {
                  upd('hiddenSections', e.target.checked
                    ? c.hiddenSections.filter(s => s !== section)
                    : [...c.hiddenSections, section])
                }}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm capitalize text-gray-700">{section}</span>
              {c.hiddenSections.includes(section) && <span className="ml-auto badge-gray text-xs">hidden</span>}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── CV Preview ─────────────────── */
function CVPreview({ cv }: { cv: CV }) {
  const { primaryColor, textColor, fontFamily, fontSize, photoShape } = cv.customization
  const template = BUILT_IN_TEMPLATES.find(t => t.id === cv.customization.templateId)
  const isTwoCol = template?.columns === 2
  const visible  = cv.customization.sectionOrder.filter(s => !cv.customization.hiddenSections.includes(s))

  const pShape = photoShape ?? 'circle'
  const photoRadius = pShape === 'circle' ? '50%' : pShape === 'rounded' ? '12px' : '0'

  return (
    <div
      style={{ fontFamily, fontSize: `${fontSize - 2}px`, color: textColor, background: '#fff', padding: '32px', border: '1px solid #e5e7eb', minHeight: '842px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${primaryColor}`, paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {cv.personal.photo && (
          <img
            src={cv.personal.photo}
            alt="Profile"
            style={{ width: '64px', height: '64px', objectFit: 'cover', flexShrink: 0, borderRadius: photoRadius, border: `2px solid ${primaryColor}` }}
          />
        )}
        <div className="flex-1">
          <div style={{ fontSize: `${fontSize + 8}px`, fontWeight: 'bold', color: textColor }}>{cv.personal.fullName || 'Your Name'}</div>
          {cv.personal.title && <div style={{ fontSize: `${fontSize + 1}px`, color: primaryColor, marginTop: '2px' }}>{cv.personal.title}</div>}
          <div style={{ fontSize: `${fontSize - 2}px`, color: '#666', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {cv.personal.email    && <span>{cv.personal.email}</span>}
            {cv.personal.phone    && <span>· {cv.personal.phone}</span>}
            {cv.personal.location && <span>· {cv.personal.location}</span>}
          </div>
        </div>
      </div>

      {isTwoCol ? (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '35%' }}>
            {visible.filter(s => ['summary', 'skills', 'languages', 'certifications'].includes(s)).map(s => (
              <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {visible.filter(s => ['experience', 'education', 'projects'].includes(s)).map(s => (
              <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
            ))}
          </div>
        </div>
      ) : (
        visible.filter(s => s !== 'personal').map(s => (
          <PreviewSection key={s} section={s} cv={cv} primaryColor={primaryColor} fontSize={fontSize} />
        ))
      )}
    </div>
  )
}

function PreviewSection({ section, cv, primaryColor, fontSize }: { section: string; cv: CV; primaryColor: string; fontSize: number }) {
  const titles: Record<string, string> = {
    summary: 'Summary', experience: 'Experience', education: 'Education',
    skills: 'Skills', projects: 'Projects', certifications: 'Certifications', languages: 'Languages',
  }

  const hasContent = () => {
    switch (section) {
      case 'summary':        return cv.summary.length > 0
      case 'experience':     return cv.experience.length > 0
      case 'education':      return cv.education.length > 0
      case 'skills':         return cv.skills.length > 0
      case 'projects':       return cv.projects.length > 0
      case 'certifications': return cv.certifications.length > 0
      case 'languages':      return cv.languages.length > 0
      default: return false
    }
  }
  if (!hasContent()) return null

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: primaryColor, borderBottom: `1.5px solid ${primaryColor}`, paddingBottom: '3px', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {titles[section]}
      </div>
      {section === 'summary' && <p style={{ fontSize: `${fontSize - 2}px`, lineHeight: 1.5 }}>{cv.summary.substring(0, 300)}</p>}
      {section === 'experience' && cv.experience.slice(0, 3).map(e => (
        <div key={e.id} style={{ marginBottom: '8px', fontSize: `${fontSize - 2}px` }}>
          <div style={{ fontWeight: 600 }}>{e.role} <span style={{ fontWeight: 400, color: '#555' }}>@ {e.company}</span></div>
          <div style={{ color: '#888', fontSize: `${fontSize - 3}px` }}>{e.startDate}{e.current ? ' – Present' : e.endDate ? ` – ${e.endDate}` : ''}</div>
        </div>
      ))}
      {section === 'education' && cv.education.slice(0, 2).map(e => (
        <div key={e.id} style={{ marginBottom: '7px', fontSize: `${fontSize - 2}px` }}>
          <div style={{ fontWeight: 600 }}>{e.degree}</div>
          <div style={{ color: '#666' }}>{e.institution}</div>
        </div>
      ))}
      {section === 'skills' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {cv.skills.slice(0, 15).map(s => (
            <span key={s.id} style={{ background: `${primaryColor}20`, color: primaryColor, padding: '1px 7px', borderRadius: '12px', fontSize: `${fontSize - 3}px` }}>{s.name}</span>
          ))}
        </div>
      )}
      {section === 'projects' && cv.projects.slice(0, 2).map(p => (
        <div key={p.id} style={{ marginBottom: '5px', fontSize: `${fontSize - 2}px` }}><strong>{p.name}</strong></div>
      ))}
      {section === 'certifications' && cv.certifications.slice(0, 3).map(c => (
        <div key={c.id} style={{ marginBottom: '4px', fontSize: `${fontSize - 2}px` }}>{c.name}{c.issuer ? ` – ${c.issuer}` : ''}</div>
      ))}
      {section === 'languages' && (
        <div style={{ fontSize: `${fontSize - 2}px` }}>{cv.languages.map(l => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(' · ')}</div>
      )}
    </div>
  )
}
