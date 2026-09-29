/**
 * components/CommandPalette.jsx
 * Global quick search & navigation palette triggered by Ctrl+K or clicking the search trigger in Navbar.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch, IconDashboard, IconPapers, IconCompare,
  IconCitations, IconReview, IconClose, IconArrowRight
} from './Icons.jsx'

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else onClose(true) // toggle
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navigationItems = [
    { label: 'Dashboard', icon: IconDashboard, to: '/', desc: 'Overview, statistics & quick actions' },
    { label: 'Paper Library', icon: IconPapers, to: '/papers', desc: 'Browse all indexed research papers' },
    { label: 'Semantic Search', icon: IconSearch, to: '/search', desc: 'Search papers by conceptual meaning' },
    { label: 'Compare Papers', icon: IconCompare, to: '/comparison', desc: 'Side-by-side methodology & results analysis' },
    { label: 'Citation Network', icon: IconCitations, to: '/citations', desc: 'Interactive graph visualization of paper links' },
    { label: 'Literature Review', icon: IconReview, to: '/literature-review', desc: 'Generate multi-paper synthesis reports' },
  ]

  const filteredItems = navigationItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (to) => {
    onClose()
    navigate(to)
  }

  const handleSemanticSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onClose()
      navigate('/search', { state: { autoQuery: query.trim() } })
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSemanticSearch} style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', gap: '0.75rem' }}>
          <IconSearch size={20} color="var(--accent-bright)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a page name or search by meaning… (Press Enter to search)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <IconClose size={16} />
            </button>
          )}
          <span style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            ESC
          </span>
        </form>

        {/* Content list */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0.75rem' }}>
          {query.trim().length > 0 && (
            <div
              onClick={handleSemanticSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-glow-subtle)',
                border: '1px solid var(--border-default)',
                marginBottom: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <IconSearch size={18} color="var(--accent-bright)" />
                <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Semantic Search for &ldquo;<span style={{ color: 'var(--accent-bright)' }}>{query}</span>&rdquo;
                </span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--accent-bright)', fontWeight: 600 }}>
                Press Enter <IconArrowRight size={14} />
              </span>
            </div>
          )}

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, padding: '0.4rem 0.6rem 0.6rem' }}>
            Navigation Destinations
          </div>

          {filteredItems.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.to}
                onClick={() => handleSelect(item.to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-bright)',
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
                <IconArrowRight size={16} color="var(--text-muted)" />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.65rem 1.25rem',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <span>Navigate with click or enter</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Research Intelligence Engine</span>
        </div>
      </div>
    </div>
  )
}
