import { useState } from 'react'
import type { NavPage } from './types/dashboard'
import HeaderNav from './components/HeaderNav'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage from './pages/BudgetsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import GoalsPage from './pages/GoalsPage'
import AIAssistantPage from './pages/AIAssistantPage'

/**
 * Root application component.
 *
 * Manages top-level navigation state and renders the active page.
 * Uses simple state-based routing — no external router dependency required.
 * When the app grows, this can be swapped for react-router-dom with minimal
 * changes to the individual page components.
 */
function App() {
  // Active page state — defaults to the dashboard landing page
  const [activePage, setActivePage] = useState<NavPage>('dashboard')

  // ── Page renderer ──────────────────────────────────────────────────────────

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActivePage} />

      case 'transactions':
        return <TransactionsPage />

      case 'budget':
        return <BudgetsPage />

      case 'analytics':
        return <AnalyticsPage />

      case 'goals':
        return <GoalsPage />

      case 'ai-chat':
        return <AIAssistantPage />

      default:
        return <DashboardPage onNavigate={setActivePage} />
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top navigation with tab-style page switching */}
      <HeaderNav activePage={activePage} onNavigate={setActivePage} />

      {/* Page content area */}
      {renderPage()}
    </div>
  )
}

export default App