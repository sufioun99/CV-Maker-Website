import type { CV } from '@/lib/schema'

interface ProgressIndicatorProps {
  cv: CV
}

type SectionStatus = {
  label: string
  filled: boolean
  weight: number
}

function computeSections(cv: CV): SectionStatus[] {
  return [
    { label: 'Personal Info',  filled: !!(cv.personal.fullName && cv.personal.email), weight: 20 },
    { label: 'Summary',        filled: cv.summary.length > 30,                         weight: 10 },
    { label: 'Experience',     filled: cv.experience.length > 0,                       weight: 25 },
    { label: 'Education',      filled: cv.education.length > 0,                        weight: 15 },
    { label: 'Skills',         filled: cv.skills.length >= 3,                          weight: 15 },
    { label: 'Projects',       filled: cv.projects.length > 0,                         weight: 8  },
    { label: 'Certifications', filled: cv.certifications.length > 0,                   weight: 4  },
    { label: 'Languages',      filled: cv.languages.length > 0,                        weight: 3  },
  ]
}

function getLabel(pct: number): { text: string; color: string } {
  if (pct >= 90) return { text: 'Excellent',    color: 'text-emerald-600' }
  if (pct >= 70) return { text: 'Good',          color: 'text-blue-600'   }
  if (pct >= 40) return { text: 'Getting there', color: 'text-amber-600'  }
  return            { text: 'Just started',  color: 'text-gray-500'   }
}

function getBarColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-gray-400'
}

export default function ProgressIndicator({ cv }: ProgressIndicatorProps) {
  const sections = computeSections(cv)
  const totalWeight = sections.reduce((a, s) => a + s.weight, 0)
  const earnedWeight = sections.filter(s => s.filled).reduce((a, s) => a + s.weight, 0)
  const pct = Math.round((earnedWeight / totalWeight) * 100)
  const { text, color } = getLabel(pct)
  const barColor = getBarColor(pct)
  const missing = sections.filter(s => !s.filled)

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">CV Completion</span>
          <span className={`text-xs font-semibold ${color}`}>{text}</span>
        </div>
        <span className={`text-sm font-bold ${color}`}>{pct}%</span>
      </div>

      {/* Bar */}
      <div className="progress-bar h-2 mb-2">
        <div
          className={`progress-fill h-2 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Missing hint */}
      {missing.length > 0 && pct < 90 && (
        <p className="text-[11px] text-gray-400">
          Add: {missing.slice(0, 3).map(s => s.label).join(', ')}
          {missing.length > 3 ? ` +${missing.length - 3} more` : ''}
        </p>
      )}
    </div>
  )
}
