'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import type { TailoringReport, TailoringSuggestion } from '@/lib/schema'

export default function TailorPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [report, setReport] = useState<TailoringReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim()) return

    setLoading(true)
    setError('')
    setReport(null)

    try {
      const res = await fetch('/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, jobTitle }),
      })

      const data = await res.json()

      if (res.ok) {
        setReport(data.report)
      } else {
        setError(data.error || 'Tailoring failed')
      }
    } catch {
      setError('Failed to analyze job description. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplySuggestion = async (suggestion: TailoringSuggestion) => {
    // CRITICAL: PROMPT_IF_TRUE suggestions are NEVER auto-applied
    if (suggestion.isPromptIfTrue || suggestion.type === 'PROMPT_IF_TRUE') {
      alert('This suggestion requires your manual review and confirmation. Please edit your CV directly if you have this skill/experience.')
      return
    }

    if (suggestion.requiresUserConfirmation) {
      const confirmed = window.confirm(`Apply this suggestion?\n\n${suggestion.reason}`)
      if (!confirmed) return
    }

    setAppliedSuggestions(prev => { const next = new Set(prev); next.add(suggestion.id); return next })

    try {
      const cvRes = await fetch('/api/cv')
      const cvData = await cvRes.json()
      if (!cvData.cv) return

      if (suggestion.type === 'REWRITE' && suggestion.section === 'summary') {
        await fetch('/api/cv', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: suggestion.suggested }),
        })
      }
    } catch {
      setAppliedSuggestions(prev => {
        const next = new Set(prev)
        next.delete(suggestion.id)
        return next
      })
    }
  }

  const suggestionTypeColors: Record<string, string> = {
    'REWRITE': 'bg-blue-50 border-blue-200 text-blue-800',
    'REORDER': 'bg-purple-50 border-purple-200 text-purple-800',
    'EMPHASIZE': 'bg-green-50 border-green-200 text-green-800',
    'REMOVE_REDUNDANCY': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    'PROMPT_IF_TRUE': 'bg-orange-50 border-orange-200 text-orange-800',
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Smart CV Tailoring</h1>
          <p className="text-gray-600 mt-2">Paste a job description to get smart suggestions for tailoring your CV.</p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <strong>🛡️ No False Data Guarantee:</strong> We never invent employers, roles, dates, schools, degrees, certifications, tools, skills, or achievements.
            Missing requirements appear only as PROMPT_IF_TRUE and are never auto-applied.
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="card">
            <h2 className="section-title">Job Description</h2>
            <form onSubmit={handleTailor} className="space-y-4">
              <div>
                <label className="label-text">Job Title (optional)</label>
                <input className="input-field" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <label className="label-text">Job Description *</label>
                <textarea
                  className="input-field h-64 resize-none"
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  required
                  maxLength={10000}
                />
                <p className="text-xs text-gray-400 mt-1">{jobDescription.length}/10000</p>
              </div>
              <button type="submit" disabled={loading || !jobDescription.trim()} className="btn-primary w-full">
                {loading ? '🔄 Analyzing...' : '🎯 Analyze & Suggest'}
              </button>
            </form>
            {error && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
          </div>

          {/* Results */}
          <div>
            {report && (
              <div className="space-y-4">
                {/* Match Score */}
                <div className="card">
                  <h2 className="section-title">Match Report</h2>
                  <div className="text-center mb-4">
                    <div className={`text-5xl font-bold ${report.matchScore >= 70 ? 'text-green-600' : report.matchScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {report.matchScore}%
                    </div>
                    <p className="text-gray-600 mt-1">Match Score</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full transition-all ${report.matchScore >= 70 ? 'bg-green-500' : report.matchScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${report.matchScore}%` }}
                    ></div>
                  </div>
                  {report.matchedKeywords.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-700 mb-1">✅ Matched Keywords ({report.matchedKeywords.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {report.matchedKeywords.map(kw => (
                          <span key={kw} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.missingKeywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">❌ Missing Keywords ({report.missingKeywords.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {report.missingKeywords.map(kw => (
                          <span key={kw} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="card">
                  <h2 className="section-title">Suggestions ({report.suggestions.length})</h2>
                  <div className="space-y-3">
                    {report.suggestions.map(sug => (
                      <div key={sug.id} className={`p-3 rounded-lg border ${suggestionTypeColors[sug.type] || 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="text-xs font-bold uppercase tracking-wide">{sug.type.replace('_', ' ')}</span>
                            {sug.isPromptIfTrue && (
                              <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">⚠️ NOT AUTO-APPLIED</span>
                            )}
                            <p className="text-sm mt-1">{sug.reason}</p>
                            {sug.suggested && !sug.isPromptIfTrue && (
                              <div className="mt-2 text-xs bg-white bg-opacity-60 rounded p-2">
                                <div className="text-gray-500">Suggested: {sug.suggested.substring(0, 100)}</div>
                              </div>
                            )}
                            {sug.isPromptIfTrue && (
                              <div className="mt-2 text-xs font-medium">
                                💡 To add this: Go to your CV editor and add it manually if you truly have this skill/experience.
                              </div>
                            )}
                          </div>
                          {!sug.isPromptIfTrue && !appliedSuggestions.has(sug.id) && (
                            <button
                              onClick={() => handleApplySuggestion(sug)}
                              className="text-xs px-2 py-1 bg-white border border-current rounded hover:opacity-80 whitespace-nowrap"
                            >
                              Apply
                            </button>
                          )}
                          {appliedSuggestions.has(sug.id) && (
                            <span className="text-xs text-green-600">✅ Applied</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {report.suggestions.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">No suggestions. Your CV looks great for this job!</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {!report && !loading && (
              <div className="card text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">🎯</div>
                <p>Paste a job description and click &quot;Analyze&quot; to see your match report and suggestions.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
