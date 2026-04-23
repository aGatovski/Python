/**
 * ChatMessage — renders a single message bubble in the conversation.
 *
 * User messages are right-aligned with a blue background.
 * Assistant messages are left-aligned with a white card style.
 * Markdown-style bold (**text**) and line breaks are rendered for readability.
 */

import type { ReactNode } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date object as a short time string, e.g. "14:32" */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Minimal markdown renderer — handles **bold** and newlines only.
 * This keeps the component dependency-free while still making AI responses
 * readable. Replace with a proper markdown library (e.g. react-markdown)
 * when integrating a real AI that may produce richer output.
 */
function renderContent(text: string): ReactNode[] {
  // Split on newlines first, then process each line for bold markers
  return text.split('\n').map((line, lineIdx) => {
    // Split on **...** bold markers
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={partIdx}>{part}</span>
    })

    return (
      <span key={lineIdx}>
        {rendered}
        {/* Add a line break after every line except the last */}
        {lineIdx < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

// ─── Assistant avatar ─────────────────────────────────────────────────────────

function AssistantAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm"
      aria-hidden="true"
    >
      {/* Sparkle / AI icon */}
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
        />
      </svg>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 group" role="listitem">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          {/* Bubble */}
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          {/* Timestamp */}
          <time
            dateTime={message.timestamp.toISOString()}
            className="text-[11px] text-slate-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {formatTime(message.timestamp)}
          </time>
        </div>
      </div>
    )
  }

  // ── Assistant message ──────────────────────────────────────────────────────
  return (
    <div className="flex items-start gap-2.5 group" role="listitem">
      <AssistantAvatar />

      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* Sender label */}
        <span className="text-[11px] font-medium text-slate-500 px-1">AI Assistant</span>

        {/* Bubble */}
        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-800 leading-relaxed">
            {renderContent(message.content)}
          </div>
        </div>

        {/* Timestamp */}
        <time
          dateTime={message.timestamp.toISOString()}
          className="text-[11px] text-slate-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
// Shown while the assistant is "thinking" (mocked delay in progress).

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5" role="status" aria-label="Assistant is typing">
      <AssistantAvatar />
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-slate-500 px-1">AI Assistant</span>
        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* Three animated dots */}
          <div className="flex items-center gap-1.5 h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  )
}