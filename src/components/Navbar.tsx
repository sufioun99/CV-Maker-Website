'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/templates', label: 'Templates', icon: '🎨' },
  { href: '/builder',   label: 'Builder',   icon: '📄' },
  { href: '/editor',    label: 'Editor',    icon: '✏️' },
  { href: '/tailor',    label: 'Tailor',    icon: '🤖' },
  { href: '/export',    label: 'Export',    icon: '💾' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-sm tracking-tight">CV</span>
              </div>
              <div>
                <span className="font-bold text-lg text-gray-900 leading-none tracking-tight">Smart CV Maker</span>
                <span className="block text-[10px] text-gray-400 leading-none font-medium tracking-wide uppercase">Professional Builder</span>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/session" className="ml-2 btn-ghost text-gray-500 text-xs gap-1.5 py-1.5">
              <span>⚙️</span> Session
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="btn-icon text-gray-600"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 animate-fade-in">
            <div className="flex flex-col gap-1 pt-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <Link href="/session" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                <span>⚙️</span> Session
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
