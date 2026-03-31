'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function ExportPage() {
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(format)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/cv/render?format=${format}`)

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || `Failed to export ${format.toUpperCase()}`)
        return
      }

      const blob = await res.blob()
      if (blob.size === 0) {
        setError('Export produced an empty file. Please check your CV has content.')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(`${format.toUpperCase()} downloaded successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💾 Export Your CV</h1>
          <p className="text-gray-600 mt-2">Download your CV as a PDF or DOCX file.</p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">✅ {success}</div>}

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card text-center">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="text-xl font-semibold mb-2">PDF Export</h2>
            <p className="text-gray-600 text-sm mb-4">
              High-quality PDF generated with proper fonts and layout. Perfect for emailing or uploading to job portals.
            </p>
            <ul className="text-sm text-gray-500 text-left mb-4 space-y-1">
              <li>✓ Preserves fonts &amp; colors</li>
              <li>✓ Print-ready format</li>
              <li>✓ A4 or Letter size</li>
              <li>✓ Bookmarks &amp; links</li>
            </ul>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="btn-primary w-full"
            >
              {exporting === 'pdf' ? '⏳ Generating PDF...' : '⬇️ Download PDF'}
            </button>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">DOCX Export</h2>
            <p className="text-gray-600 text-sm mb-4">
              Microsoft Word format. Editable after download. Great if you need to make quick changes.
            </p>
            <ul className="text-sm text-gray-500 text-left mb-4 space-y-1">
              <li>✓ Fully editable</li>
              <li>✓ Works in MS Word &amp; Google Docs</li>
              <li>✓ Preserved headings &amp; bullets</li>
              <li>✓ ATS-friendly</li>
            </ul>
            <button
              onClick={() => handleExport('docx')}
              disabled={exporting !== null}
              className="btn-secondary w-full border-gray-300"
            >
              {exporting === 'docx' ? '⏳ Generating DOCX...' : '⬇️ Download DOCX'}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>💡 Notes:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>PDF generation requires Playwright/Chromium to be installed on the server</li>
            <li>DOCX is always available as a fallback</li>
            <li>Make sure you&apos;ve filled in your CV details in the <a href="/editor" className="underline">editor</a> first</li>
            <li>Downloads are generated fresh each time from your session data</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
