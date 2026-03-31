import Link from 'next/link'
import Navbar from '@/components/Navbar'

const features = [
  {
    icon: '📄',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    title: 'Manual Builder',
    desc: 'Build your CV step-by-step with our guided form. Add experience, education, skills and more.',
    href: '/builder',
    cta: 'Get started',
  },
  {
    icon: '🎨',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    title: '6+ Templates',
    desc: 'Choose from modern, minimal, classic, two-column, academic, and creative professional designs.',
    href: '/templates',
    cta: 'Browse templates',
  },
  {
    icon: '✏️',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
    title: 'Live Editor',
    desc: 'Edit your CV with real-time preview. See every change instantly across all sections.',
    href: '/editor',
    cta: 'Open editor',
  },
  {
    icon: '🤖',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    title: 'Smart Tailoring',
    desc: 'Paste a job description and get smart suggestions to tailor your CV. No fabricated data, ever.',
    href: '/tailor',
    cta: 'Tailor your CV',
  },
  {
    icon: '⬆️',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    title: 'Upload & Extract',
    desc: 'Upload your existing PDF or DOCX CV and we\'ll extract all the information automatically.',
    href: '/builder?mode=upload',
    cta: 'Upload CV',
  },
  {
    icon: '💾',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    title: 'PDF & DOCX Export',
    desc: 'Export your CV as a professional PDF or DOCX file, pixel-perfect and ready to send.',
    href: '/export',
    cta: 'Export now',
  },
]

const stats = [
  { value: '6+', label: 'Professional Templates' },
  { value: '10+', label: 'CV Sections' },
  { value: '2', label: 'Export Formats' },
  { value: '100%', label: 'Privacy First' },
]

const steps = [
  { step: '01', title: 'Choose a template', desc: 'Pick from 6 professionally designed CV templates.' },
  { step: '02', title: 'Fill in your details', desc: 'Add your experience, skills, education and more.' },
  { step: '03', title: 'Customize & tailor', desc: 'Adjust colors, fonts, and tailor to job descriptions.' },
  { step: '04', title: 'Export & share', desc: 'Download as PDF or DOCX, ready to send.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>

        {/* ── Hero ─────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-24 sm:py-32">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Free to use · No account required · Data auto-deleted in 2 hours
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Build Your{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Perfect CV
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Professional CV maker with smart tailoring, beautiful templates, and live preview.
              Create a job-winning CV in minutes — completely free.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Link href="/builder" className="btn-primary text-base px-8 py-3.5 shadow-lg hover:shadow-xl bg-white text-blue-700 hover:bg-blue-50">
                Start Building Free →
              </Link>
              <Link href="/templates" className="inline-flex items-center gap-2 text-white border border-white/30 px-8 py-3.5 rounded-lg font-medium text-base hover:bg-white/10 transition-all duration-150">
                View Templates
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-blue-200/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="badge-blue mb-3 inline-block">How it works</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Your CV ready in 4 simple steps
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <div key={s.step} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] right-0 h-px bg-gradient-to-r from-blue-200 to-transparent" />
                  )}
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-md">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────── */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="badge-purple mb-3 inline-block">Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to land your dream job
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                A complete, professional-grade CV builder packed with powerful features — all for free.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(f => (
                <div key={f.title} className="card-hover group">
                  <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 text-2xl`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <Link
                    href={f.href}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    {f.cta} <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────── */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to build your perfect CV?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join thousands of professionals who have landed their dream jobs with Smart CV Maker.
            </p>
            <Link href="/builder" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl text-base">
              Start for free →
            </Link>
          </div>
        </section>

        {/* ── Privacy Note ─────────────────────── */}
        <section className="py-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              🔒 <strong className="text-gray-600">Privacy first:</strong> All data is stored temporarily and auto-deleted after 2 hours. No account required.{' '}
              <Link href="/session" className="text-blue-600 hover:underline">Manage your session</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
