/**
 * ChatInput — the message composition area at the bottom of the chat.
 *
 * Features:
 * - Auto-growing textarea (up to ~4 lines)
 * - Send on Enter (Shift+Enter inserts a newline)
 * - Send button disabled when input is empty or assistant is loading
 * - Accessible label and ARIA attributes
 */

import { useRef, useEffect } from 'react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  placeholder?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Ask me anything about your finances…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize the textarea as the user types
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    // Reset height first so shrinking works correctly
    el.style.height = 'auto'
    // Cap at ~4 lines (approx 96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [value])

  // Focus the input when the component mounts
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const canSend = value.trim().length > 0 && !isLoading

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter; Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      {/* Hint text */}
      <p className="text-[11px] text-slate-400 mb-2 text-center">
        Press <kbd className="font-mono bg-slate-100 px-1 rounded text-slate-500">Enter</kbd> to send
        &nbsp;·&nbsp;
        <kbd className="font-mono bg-slate-100 px-1 rounded text-slate-500">Shift+Enter</kbd> for new line
      </p>

      <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Hidden label for screen readers */}
        <label htmlFor="chat-input" className="sr-only">
          Ask your finance assistant
        </label>

        <textarea
          id="chat-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          aria-label="Ask your finance assistant"
          aria-multiline="true"
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed py-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={[
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            canSend
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            // Spinner while waiting for response
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            // Send arrow icon
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}