'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function SessionPage() {
  const router = useRouter()
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string | null; hasCV: boolean } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(data => setSessionInfo(data))
      .catch(() => setSessionInfo({ sessionId: null, hasCV: false }))
  }, [])

  const handleDeleteSession = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your session data? This will permanently remove your CV and all uploaded files. This cannot be undone.'
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await fetch('/api/session', { method: 'DELETE' })
      setDeleted(true)
      setSessionInfo({ sessionId: null, hasCV: false })

      // Redirect to home after 2 seconds
      setTimeout(() => router.push('/'), 2000)
    } catch {
      alert('Failed to delete session. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔒 Session Management</h1>
          <p className="text-gray-600 mt-2">Manage your temporary CV data and session.</p>
        </div>

        {deleted ? (
          <div className="card text-center py-8">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Session Deleted</h2>
            <p className="text-gray-600">All your data has been permanently removed. Redirecting to home...</p>
          </div>
        ) : (
          <>
            {/* Session Info */}
            <div className="card mb-6">
              <h2 className="section-title">Session Information</h2>
              {sessionInfo === null ? (
                <p className="text-gray-500">Loading...</p>
              ) : sessionInfo.sessionId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">Active Session</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 font-mono text-xs text-gray-600 break-all">
                    Session ID: {sessionInfo.sessionId}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>✅ Your CV data is stored in a temporary session on the server.</p>
                    <p className="mt-1">⏰ Session auto-expires after <strong>2 hours</strong> of inactivity.</p>
                    <p className="mt-1">🔒 No account required. Data is never shared.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">No Active Session</span>
                  </div>
                  <p className="text-sm text-gray-600">Start building your CV to create a session.</p>
                  <a href="/builder" className="btn-primary inline-block text-sm">Create CV →</a>
                </div>
              )}
            </div>

            {/* Privacy Info */}
            <div className="card mb-6">
              <h2 className="section-title">Privacy &amp; Data</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📄 <strong>CV Data:</strong> Stored as JSON in a temporary server directory</p>
                <p>📁 <strong>Uploaded Files:</strong> Stored temporarily under <code className="bg-gray-100 px-1 rounded">.tmp/&lt;sessionId&gt;/</code></p>
                <p>⏰ <strong>Auto-Expire:</strong> All data automatically deleted after 2 hours</p>
                <p>🚫 <strong>No Logging:</strong> Full CV content and extracted text are never logged</p>
                <p>🔒 <strong>No Sharing:</strong> Your data is never transmitted to third parties</p>
                <p>🍪 <strong>Cookie:</strong> A session cookie is used to identify your session (HttpOnly, SameSite=Lax)</p>
              </div>
            </div>

            {/* Delete Button */}
            {sessionInfo?.sessionId && (
              <div className="card border-red-200 bg-red-50">
                <h2 className="section-title text-red-800">⚠️ Danger Zone</h2>
                <p className="text-sm text-red-700 mb-4">
                  Deleting your session will permanently remove all your CV data and uploaded files.
                  This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteSession}
                  disabled={deleting}
                  className="btn-danger"
                >
                  {deleting ? '⏳ Deleting...' : '🗑️ Delete Session Data Now'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
