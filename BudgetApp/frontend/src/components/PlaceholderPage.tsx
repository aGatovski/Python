import type { NavPage } from '../types/dashboard'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlaceholderPageProps {
  page: Exclude<NavPage, 'dashboard' | 'transactions'>
  onNavigate: (page: NavPage) => void
}

// ─── Page metadata ────────────────────────────────────────────────────────────

const META: Record<
  Exclude<NavPage, 'dashboard' | 'transactions'>,
  { title: string; description: string; badge: string; badgeColor: string }
> = {
  budget: {
    title: 'Budget',
    description: 'Set monthly spending limits per category and track how you\'re doing in real time.',
    badge: 'Coming soon',
    badgeColor: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  goals: {
    title: 'Goals',
    description: 'Define savings goals — emergency fund, vacation, new laptop — and watch your progress grow.',
    badge: 'Coming soon',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  analytics: {
    title: 'Analytics',
    description: 'Visualise income vs expenses over time, spot trends, and understand your spending patterns.',
    badge: 'Coming soon',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  'ai-chat': {
    title: 'AI Chat',
    description: 'Ask your personal finance assistant anything — budgeting tips, spending analysis, savings advice.',
    badge: 'Coming soon',
    badgeColor: 'bg-pink-50 text-pink-600 border-pink-100',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Generic placeholder shown for pages that are not yet implemented.
 * Displays the page title, description, and a "coming soon" badge.
 */
export default function PlaceholderPage({ page, onNavigate }: PlaceholderPageProps) {
  const meta = META[page]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">

        {/* Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        {/* Badge */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${meta.badgeColor}`}
        >
          {meta.badge}
        </span>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {meta.title}
        </h1>

        {/* Description */}
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
          {meta.description}
        </p>

        {/* Back to dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>
    </main>
  )
}