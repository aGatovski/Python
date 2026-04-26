/**
 * AIAssistantPage — the AI Personal Finance Assistant chat interface.
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │  Page header (title + clear button) │
 *   ├─────────────────────────────────────┤
 *   │  Scrollable message list            │
 *   │    • Empty state / welcome          │
 *   │    • Message bubbles                │
 *   │    • Typing indicator               │
 *   ├─────────────────────────────────────┤
 *   │  Suggested prompts (pre-first msg)  │
 *   ├─────────────────────────────────────┤
 *   │  ChatInput (textarea + send btn)    │
 *   └─────────────────────────────────────┘
 *
 * State is kept entirely local — no global store needed for a single-page chat.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types/chat'
import { SUGGESTED_PROMPTS } from '../services/mockAI'
import { initChatSession, sendChatMessage } from '../api/aiApi'
import ChatMessageBubble, { TypingIndicator } from '../components/ai/ChatMessage'
import ChatInput from '../components/ai/ChatInput'
import SuggestedPrompts from '../components/ai/SuggestedPrompts'

// ─── ID generator ─────────────────────────────────────────────────────────────
// Simple incrementing counter — no UUID library needed for a mock chat.
let _msgCounter = 0
function nextId(): string {
  return `msg-${++_msgCounter}`
}

// ─── Welcome message ──────────────────────────────────────────────────────────
// The first message shown when the page loads — sets the tone for the assistant.

const WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `Hi there! 👋 I'm your AI Finance Assistant.

I can help you with budgeting, saving strategies, spending analysis, investment basics, and reaching your financial goals.

Feel free to ask me anything — or pick one of the suggested questions below to get started!`,
  timestamp: new Date(),
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  // ── State ──────────────────────────────────────────────────────────────────

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Session context loaded once from /ai/chat/init — sent with every message
  const [sessionContext, setSessionContext] = useState<string>('')

  // Whether the user has sent at least one message (hides suggested prompts)
  const hasUserMessages = messages.some((m) => m.role === 'user')

  // ── Load session context once on mount ────────────────────────────────────
  // Fetches all user financial data from the backend once per chat session.
  // The context string is stored in state and sent with every message.

  useEffect(() => {
    initChatSession()
      .then((ctx) => setSessionContext(ctx))
      .catch(() => {
        // If init fails, chat still works — AI will have no financial context
        console.warn('AI chat: failed to load financial context')
      })
  }, []) // empty deps — runs once on mount

  // ── Scroll management ──────────────────────────────────────────────────────
  // Scroll to the bottom of the message list whenever messages change.

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      // 1. Append the user's message immediately
      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      try {
        // 2. Send to real AI backend with full conversation history
        const responseText = await sendChatMessage(trimmed, messages, sessionContext)

        // 3. Append the assistant's response
        const assistantMessage: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        // Graceful error fallback — shown as an assistant message
        const errorMessage: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: `Sorry, I ran into an issue processing your question. Please try again in a moment.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, sessionContext],
  )

  // ── Handle suggested prompt click ──────────────────────────────────────────

  function handlePromptSelect(prompt: string) {
    sendMessage(prompt)
  }

  // ── Clear conversation ─────────────────────────────────────────────────────

  function handleClear() {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }])
    setInputValue('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-57px)]">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Gradient AI icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">AI Finance Assistant</h1>
            <p className="text-xs text-slate-500">Ask me anything about your finances</p>
          </div>
        </div>

        {/* Clear conversation button — only shown once there are user messages */}
        {hasUserMessages && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Clear conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            New chat
          </button>
        )}
      </div>

      {/* ── Chat area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">

        {/* Scrollable message list */}
        <div
          className="flex-1 overflow-y-auto px-4 py-5 space-y-5"
          role="list"
          aria-label="Conversation"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator — shown while waiting for AI response */}
          {isLoading && <TypingIndicator />}

          {/* Invisible anchor for auto-scroll */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Suggested prompts — visible only before the first user message */}
        <SuggestedPrompts
          prompts={SUGGESTED_PROMPTS}
          onSelect={handlePromptSelect}
          hidden={hasUserMessages}
        />

        {/* Message input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => sendMessage(inputValue)}
          isLoading={isLoading}
        />
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <p className="mt-3 text-center text-[11px] text-slate-400 flex-shrink-0">
        AI responses are for informational purposes only and do not constitute financial advice.
      </p>
    </main>
  )
}