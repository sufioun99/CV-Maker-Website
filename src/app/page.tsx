import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Build Your Perfect CV
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional CV maker with AI-powered tailoring, beautiful templates,
              and smart extraction from existing CVs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/builder" className="btn-primary text-lg px-8 py-3">
                Start Building
              </Link>
              <Link href="/templates" className="btn-secondary text-lg px-8 py-3">
                Browse Templates
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to land your dream job
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Manual Builder</h3>
                <p className="text-gray-600">Build your CV step-by-step with our guided form. Add experience, education, skills and more.</p>
                <Link href="/builder" className="inline-block mt-4 text-blue-600 hover:underline">Get started →</Link>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">6+ Templates</h3>
                <p className="text-gray-600">Choose from modern, minimal, classic, two-column, academic, and creative designs.</p>
                <Link href="/templates" className="inline-block mt-4 text-blue-600 hover:underline">Browse templates →</Link>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Tailoring</h3>
                <p className="text-gray-600">Paste a job description and get smart suggestions to tailor your CV. No fabricated data.</p>
                <Link href="/tailor" className="inline-block mt-4 text-blue-600 hover:underline">Tailor your CV →</Link>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⬆️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload & Extract</h3>
                <p className="text-gray-600">Upload your existing PDF or DOCX CV and we&apos;ll extract all the information automatically.</p>
                <Link href="/builder?mode=upload" className="inline-block mt-4 text-blue-600 hover:underline">Upload CV →</Link>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📸</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Image Template</h3>
                <p className="text-gray-600">Upload a CV image and we&apos;ll derive a matching template layout for you.</p>
                <Link href="/templates?mode=image" className="inline-block mt-4 text-blue-600 hover:underline">Try it →</Link>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">PDF & DOCX Export</h3>
                <p className="text-gray-600">Export your CV as a professional PDF or DOCX file, ready to send to employers.</p>
                <Link href="/export" className="inline-block mt-4 text-blue-600 hover:underline">Export now →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <section className="py-8 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-500">
              🔒 Privacy first: All data is stored temporarily on the server (tied to your session cookie) and auto-deleted after 2 hours.
              No account required.&nbsp;
              <Link href="/session" className="text-blue-600 hover:underline">Manage your session</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
