/**
 * Chat domain types for the AI Personal Finance Assistant.
 * Keeping these separate makes it easy to extend when a real AI API is integrated.
 */

/** Who sent the message */
export type MessageRole = 'user' | 'assistant'

/** A single message in the conversation */
export interface ChatMessage {
  /** Unique identifier — used as React key and for ordering */
  id: string
  role: MessageRole
  content: string
  /** Wall-clock time the message was created */
  timestamp: Date
}

/** A pre-written prompt shown to the user as a quick-start suggestion */
export interface SuggestedPrompt {
  id: string
  /** Short label shown on the chip button */
  label: string
  /** Full text sent as the user message when the chip is clicked */
  prompt: string
}