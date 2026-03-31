import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart CV Maker',
  description: 'Build professional CVs with AI-powered tailoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
