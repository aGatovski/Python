import api from './client'
import type { ChatMessage } from '../types/chat'

// ─── Response shapes ──────────────────────────────────────────────────────────

interface InitResponse {
  session_context: string
}

interface ChatResponse {
  response: string
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Called ONCE when the chat session starts.
 * Loads all user financial data from the backend and returns a context string.
 * Store this in React state — send it with every subsequent message.
 */
export async function initChatSession(): Promise<string> {
  const data = await api.get<InitResponse>('/ai/chat/init')
  return data.session_context
}

/**
 * Send a message to the AI with full conversation history.
 * No financial data is re-fetched — it's all in sessionContext from initChatSession().
 *
 * @param message        - The user's latest message text
 * @param history        - All previous messages in this session (for context)
 * @param sessionContext - The context string returned by initChatSession()
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  sessionContext: string,
): Promise<string> {
  // Convert frontend ChatMessage[] to Gemini format (role: 'user' | 'model').
  // Filter out the welcome message (id: 'msg-welcome') — it's UI-only, not real history.
  // Map 'assistant' → 'model' since Gemini uses 'model' for AI turns.
  const apiHistory = history
    .filter((m) => m.id !== 'msg-welcome')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }))

  const data = await api.post<ChatResponse>('/ai/chat', {
    message,
    history: apiHistory,
    session_context: sessionContext,
  })

  return data.response
}