'use client'

import { createContext, useContext } from 'react'

export interface PortalThemeContextType {
  darkMode: boolean
  toggleTheme: () => void
}

export const PortalThemeContext = createContext<PortalThemeContextType>({ darkMode: true, toggleTheme: () => {} })

export function usePortalTheme() {
  return useContext(PortalThemeContext)
}

/**
 * The portal's theme, resolved the same way everywhere.
 *
 * The auth/loading screen renders *outside* PortalThemeContext.Provider, so it
 * used to fall back to the context default (dark) and hardcode a near-black
 * background — which is why refreshing the portal in light mode flashed a dark
 * page before the real UI appeared. Both now read from this one function.
 */
export function resolvePortalTheme(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const saved = localStorage.getItem('ep-theme')
    if (saved) return saved === 'dark'
    // No preference stored yet: phones default to light, desktop to dark.
    return !window.matchMedia('(max-width: 768px)').matches
  } catch {
    return true
  }
}
