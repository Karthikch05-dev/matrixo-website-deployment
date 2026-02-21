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
