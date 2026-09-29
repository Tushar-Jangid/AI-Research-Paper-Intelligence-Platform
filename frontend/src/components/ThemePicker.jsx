/**
 * components/ThemePicker.jsx
 * Interactive theme switcher with live preview swatches.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { IconPalette, IconCheck } from './Icons.jsx'

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        id="theme-picker-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        title="Change UI Theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderRadius: 'var(--radius-pill)',
          padding: '0.45rem 0.85rem',
          border: '1px solid var(--border-default)',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: currentTheme.color,
            boxShadow: `0 0 8px ${currentTheme.color}`,
          }}
        />
        <IconPalette size={15} color="var(--text-secondary)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentTheme.name}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 230,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            backdropFilter: 'blur(20px)',
            padding: '0.5rem',
            zIndex: 300,
            animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            padding: '0.4rem 0.6rem 0.5rem',
          }}>
            Select Theme
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {themes.map(t => {
              const isSelected = t.id === theme
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id)
                    setIsOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--accent-glow-subtle)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: t.color,
                        boxShadow: isSelected ? `0 0 8px ${t.color}` : 'none',
                      }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {isSelected && <IconCheck size={14} color="var(--accent-bright)" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
