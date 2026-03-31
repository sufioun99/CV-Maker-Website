'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'

export default function TemplatesPage() {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [deriving, setDeriving] = useState(false)
  const [deriveResult, setDeriveResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSelectTemplate = async (templateId: string) => {
    setSelecting(templateId)
    setError('')
    try {
      // Ensure session/CV exists
      const postRes = await fetch('/api/cv', { method: 'POST' })
      const postData = await postRes.json()

      if (postData.cv) {
        // Update template
        await fetch('/api/cv', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customization: {
              ...postData.cv.customization,
              templateId,
            }
          })
        })
      }

      router.push('/editor')
    } catch (e) {
      setError('Failed to select template. Please try again.')
    } finally {
      setSelecting(null)
    }
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) return

    setDeriving(true)
    setDeriveResult(null)
    setError('')

    try {
      // Ensure session/CV exists so the API has a valid session cookie
      await fetch('/api/cv', { method: 'POST' })

      const formData = new FormData()
      formData.append('image', imageFile)

      const res = await fetch('/api/templates/derive-from-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setDeriveResult(data)
      } else if (data.fallback) {
        setDeriveResult({
          ...data,
          fallback: true,
          message: data.message || 'Could not analyze image. Please choose a built-in template instead.'
        })
      } else {
        setError(data.error || 'Failed to analyze image')
      }
    } catch (e) {
      setError('Failed to analyze image')
    } finally {
      setDeriving(false)
    }
  }

  const templateColors: Record<string, string> = {
    'modern': 'border-blue-500 bg-blue-50',
    'minimal': 'border-gray-400 bg-gray-50',
    'classic': 'border-amber-700 bg-amber-50',
    'two-column': 'border-indigo-600 bg-indigo-50',
    'academic': 'border-emerald-700 bg-emerald-50',
    'creative': 'border-rose-500 bg-rose-50',
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CV Templates</h1>
          <p className="text-gray-600 mt-2">Choose from our professional templates. You can switch templates at any time without losing your data.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
        )}

        {/* Built-in Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {BUILT_IN_TEMPLATES.map(template => (
            <div key={template.id} className={`card border-t-4 ${templateColors[template.id] || 'border-blue-500 bg-white'} hover:shadow-md transition-shadow`}>
              {/* Template Preview */}
              <div className={`h-40 rounded-md mb-4 border-2 ${templateColors[template.id]} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  {template.columns === 2 ? (
                    <div className="flex h-full">
                      <div className="w-1/3 h-full bg-current"></div>
                      <div className="flex-1 p-2">
                        <div className="h-2 bg-current rounded mb-1 w-3/4"></div>
                        <div className="h-1 bg-current rounded mb-2 w-1/2"></div>
                        <div className="h-1 bg-current rounded mb-1"></div>
                        <div className="h-1 bg-current rounded mb-1 w-5/6"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="h-3 bg-current rounded mb-2 w-1/2 mx-auto"></div>
                      <div className="h-1 bg-current rounded mb-3 w-2/3 mx-auto"></div>
                      <div className="h-1 bg-current rounded mb-1 w-full"></div>
                      <div className="h-1 bg-current rounded mb-1 w-full"></div>
                      <div className="h-1 bg-current rounded mb-1 w-5/6"></div>
                    </div>
                  )}
                </div>
                <span className="font-bold text-lg z-10 opacity-70">{template.name}</span>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1 mb-3">{template.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{template.columns === 2 ? '2-column' : '1-column'}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{template.category}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{template.fontFamily}</span>
              </div>

              <button
                onClick={() => handleSelectTemplate(template.id)}
                disabled={selecting === template.id}
                className="btn-primary w-full"
              >
                {selecting === template.id ? 'Selecting...' : 'Use This Template'}
              </button>
            </div>
          ))}
        </div>

        {/* Image Template Section */}
        <div className="card mb-8">
          <h2 className="section-title">📸 Upload Image Template</h2>
          <p className="text-gray-600 mb-4">
            Upload a JPG or PNG of a CV template and we&apos;ll derive a similar layout for you.
            Best-effort detection — not pixel-perfect.
          </p>

          <form onSubmit={handleImageUpload} className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={!imageFile || deriving}
              className="btn-primary whitespace-nowrap"
            >
              {deriving ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </form>

          {deriveResult && !deriveResult.fallback && deriveResult.template && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Template Detected!</h3>
              <p className="text-sm text-green-700">
                Detected: <strong>{deriveResult.template.columns}-column</strong> layout,
                page ratio: <strong>{deriveResult.template.pageRatio.toUpperCase()}</strong>,
                primary color: <strong>{deriveResult.template.palette.primary}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">{deriveResult.note}</p>
              <button
                onClick={() => handleSelectTemplate(deriveResult.template.fallbackTemplateId || 'modern')}
                className="btn-primary mt-3 text-sm"
              >
                Apply as Template
              </button>
            </div>
          )}

          {deriveResult && deriveResult.fallback && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Could Not Detect Template</h3>
              <p className="text-sm text-yellow-700">{deriveResult.message}</p>
              <p className="text-sm text-yellow-700 mt-2">Please choose from our built-in templates above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
