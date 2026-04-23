/**
 * Auth store stub.
 * The real implementation will use Zustand + persist middleware once
 * authentication is wired up. For now this is a simple in-memory store
 * so the frontend compiles without the zustand dependency.
 */

import type { User } from '../types/index'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
}

// Simple in-memory store — no persistence, no external deps
const state: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  setTokens(access, refresh) {
    state.accessToken = access
    state.refreshToken = refresh
  },
  setUser(user) {
    state.user = user
  },
  logout() {
    state.accessToken = null
    state.refreshToken = null
    state.user = null
  },
}

/** Hook-compatible accessor — returns the store state */
export const useAuthStore = {
  getState: () => state,
}