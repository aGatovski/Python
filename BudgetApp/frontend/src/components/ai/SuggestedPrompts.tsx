/**
 * SuggestedPrompts — a row of clickable prompt chips shown in the empty state.
 *
 * Clicking a chip fires the prompt as if the user had typed and sent it.
 * The component hides itself once the conversation has started (hasMessages).
 */

import type { SuggestedPrompt } from '../../types/chat'

// ─── Props ────────────────────────────────────────────────────────────────────

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[]
  onSelect: (prompt: string) => void
  /** When true the chips are hidden — conversation is already underway */
  hidden?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuggestedPrompts({ prompts, onSelect, hidden = false }: SuggestedPromptsProps) {
  if (hidden) return null

  return (
    <section aria-label="Suggested questions" className="px-4 pb-4">
      <p className="text-xs font-medium text-slate-500 mb-2.5 text-center">
        Not sure where to start? Try one of these:
      </p>

      {/* Wrap chips — they reflow naturally on smaller screens */}
      <div className="flex flex-wrap justify-center gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelect(prompt.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-sm"
          >
            {/* Small sparkle icon on each chip */}
            <svg
              className="w-3 h-3 text-blue-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            {prompt.label}
          </button>
        ))}
      </div>
    </section>
  )
}