/**
 * context/ThemeContext.jsx
 * Provides theme management across the Research Platform.
 * Supports: cyber-obsidian, cosmic-amethyst, emerald-matrix, solar-amber, academic-light
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'cyber-obsidian', name: 'Cyber Obsidian', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  { id: 'cosmic-amethyst', name: 'Cosmic Amethyst', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'emerald-matrix', name: 'Emerald Matrix', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'solar-amber', name: 'Solar Amber', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'academic-light', name: 'Academic Light', color: '#4f46e5', glow: 'rgba(79, 70, 229, 0.3)' },
]

const ThemeContext = createContext({
  theme: 'cyber-obsidian',
  setTheme: () => {},
  themes: THEMES,
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('rp-theme') || 'cyber-obsidian'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('rp-theme', theme)
  }, [theme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
