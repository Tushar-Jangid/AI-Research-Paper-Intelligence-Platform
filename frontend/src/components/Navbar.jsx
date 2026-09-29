/**
 * components/Navbar.jsx — Premium navigation header.
 * Includes: Breadcrumb, Global Search trigger (Ctrl+K), Theme Switcher,
 * Backend Health Ping, Real-time Clock, and User Profile.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import ThemePicker from './ThemePicker.jsx'
import CommandPalette from './CommandPalette.jsx'
import { IconSearch, IconUpload, IconSparkles } from './Icons.jsx'

const PING_INTERVAL_MS = 25_000

const ROUTE_NAMES = {
  '/':                  'Dashboard',
  '/papers':            'Paper Library',
  '/search':            'Semantic Search',
  '/comparison':        'Compare Papers',
  '/citations':         'Citation Network',
  '/literature-review': 'Literature Review',
}

export default function Navbar({ onUploadClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [backendStatus, setBackendStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [latency, setLatency] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  const pingBackend = useCallback(async () => {
    const start = performance.now()
    try {
      await api.get('/health')
      const diff = Math.round(performance.now() - start)
      setLatency(diff)
      setBackendStatus('online')
    } catch {
      setBackendStatus('offline')
      setLatency(null)
    }
  }, [])

  useEffect(() => {
    pingBackend()
    const interval = setInterval(pingBackend, PING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [pingBackend])

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const statusColors = {
    online:   { dot: 'var(--accent-green)', label: 'API Online', text: 'var(--accent-green)' },
    offline:  { dot: 'var(--accent-red)',   label: 'API Offline', text: 'var(--accent-red)' },
    checking: { dot: 'var(--accent-amber)', label: 'Connecting…', text: 'var(--accent-amber)' },
  }
  const status = statusColors[backendStatus]

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })

  const currentTitle = ROUTE_NAMES[location.pathname] ||
    (location.pathname.startsWith('/papers/') ? 'Paper Summary' : 'Research Platform')

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 'var(--sidebar-width)',
          right: 0,
          height: 'var(--navbar-height)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          zIndex: 100,
          transition: 'background var(--transition-slow), border-color var(--transition-slow)',
        }}
      >
        {/* Left — Breadcrumb & Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Platform</span>
              <span>/</span>
              <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{currentTitle}</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {currentTitle}
            </div>
          </div>

          {/* Backend Status Pill */}
          <div
            title={latency ? `Response time: ${latency}ms` : 'Connecting to API'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.73rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onClick={pingBackend}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: status.dot,
                boxShadow: `0 0 8px ${status.dot}`,
                animation: backendStatus === 'online' ? 'pulseGlow 2.5s infinite' : 'none',
              }}
            />
            <span style={{ color: status.text, fontWeight: 600 }}>{status.label}</span>
            {latency && (
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                {latency}ms
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Quick Search Trigger */}
          <button
            id="navbar-search-btn"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCommandPaletteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.42rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              border: '1px solid var(--border-default)',
            }}
          >
            <IconSearch size={15} color="var(--accent-bright)" />
            <span style={{ color: 'var(--text-secondary)' }}>Search everything…</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              Ctrl+K
            </span>
          </button>

          {/* Theme Selector */}
          <ThemePicker />

          {/* Live digital clock */}
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-elevated)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
              letterSpacing: '0.04em',
            }}
          >
            {timeStr}
          </div>

          {/* User Profile Avatar */}
          <div
            id="navbar-avatar"
            title="Researcher Account"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 2px 10px var(--accent-glow)',
              transition: 'transform var(--transition-fast)',
              position: 'relative',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            R
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'var(--accent-green)',
                border: '2px solid var(--bg-surface)',
              }}
            />
          </div>
        </div>
      </nav>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  )
}
