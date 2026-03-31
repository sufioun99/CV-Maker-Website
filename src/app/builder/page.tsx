'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'manual'
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>(mode === 'upload' ? 'upload' : 'manual')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const handleStartManual = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/cv', { method: 'POST' })
      const data = await res.json()
      if (data.cv) {
        router.push('/editor')
      } else {
        setError('Failed to create CV. Please try again.')
      }
    } catch {
      setError('Failed to create CV. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return

    setUploading(true)
    setError('')
    setUploadResult(null)

    try {
      // Ensure session exists first
      await fetch('/api/cv', { method: 'POST' })

      const formData = new FormData()
      formData.append('file', uploadFile)
      const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok) {
        setUploadResult(data)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CV Builder</h1>
          <p className="text-gray-600 mt-2">Create your professional CV from scratch or upload an existing one.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 mr-2 transition-colors ${activeTab === 'manual' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('manual')}
          >
            ✏️ Manual Entry
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('upload')}
          >
            ⬆️ Upload Existing CV
          </button>
        </div>

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="card">
            <h2 className="section-title">Build Your CV Step by Step</h2>
            <p className="text-gray-600 mb-6">
              Use our guided form to enter your personal info, work experience, education, skills, and more.
              All sections are optional — fill in what&apos;s relevant to you.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: '👤', title: 'Personal Info', desc: 'Name, contact, title' },
                { icon: '📝', title: 'Summary', desc: 'Professional overview' },
                { icon: '💼', title: 'Experience', desc: 'Work history & achievements' },
                { icon: '🎓', title: 'Education', desc: 'Degrees & institutions' },
                { icon: '⚡', title: 'Skills', desc: 'Technical & soft skills' },
                { icon: '🚀', title: 'Projects', desc: 'Notable projects' },
                { icon: '🏆', title: 'Certifications', desc: 'Credentials & licenses' },
                { icon: '🌍', title: 'Languages', desc: 'Languages you speak' },
              ].map(step => (
                <div key={step.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleStartManual} disabled={creating} className="btn-primary w-full sm:w-auto text-lg px-8 py-3">
              {creating ? 'Starting...' : '🚀 Start Building'}
            </button>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="card">
            <h2 className="section-title">Upload Your Existing CV</h2>
            <p className="text-gray-600 mb-4">
              Upload a PDF or DOCX file. We&apos;ll extract your information and let you review and edit it.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-sm text-yellow-800">
              <strong>Privacy note:</strong> Your file is temporarily stored for this session only and auto-deleted after 2 hours.
            </div>

            {!uploadResult ? (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600 mb-3">PDF or DOCX, max 10MB</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-2">Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)}MB)</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="btn-primary w-full"
                >
                  {uploading ? 'Extracting...' : 'Upload & Extract'}
                </button>
              </form>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Extraction Complete!</h3>
                  <p className="text-sm text-green-700">{uploadResult.message}</p>
                </div>

                {/* Show extracted fields with confidence */}
                {uploadResult.extraction?.extractedFields && Object.keys(uploadResult.extraction.extractedFields).length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Extracted Fields:</h3>
                    <div className="space-y-2">
                      {Object.entries(uploadResult.extraction.extractedFields).map(([key, field]: [string, any]) => (
                        <div key={key} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium text-gray-700 w-36">{key}</span>
                          <span className="flex-1 text-gray-900">{String(field.value).substring(0, 50)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${field.confidence > 0.8 ? 'bg-green-100 text-green-700' : field.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {Math.round(field.confidence * 100)}% confident
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResult.extraction?.warnings?.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    {uploadResult.extraction.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-sm text-yellow-800">⚠️ {w}</p>
                    ))}
                  </div>
                )}

                <button onClick={() => router.push('/editor')} className="btn-primary w-full">
                  Review & Edit Your CV →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BuilderContent />
    </Suspense>
  )
}
