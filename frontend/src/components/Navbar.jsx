/**
 * components/Navbar.jsx — Top navigation bar with live backend health check.
 */

import React, { useEffect, useState, useCallback } from 'react'
import api from '../services/api.js'

const PING_INTERVAL_MS = 30_000 // ping every 30s

export default function Navbar() {
  const [backendStatus, setBackendStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [currentTime, setCurrentTime] = useState(new Date())

  const pingBackend = useCallback(async () => {
    try {
      await api.get('/health')
      setBackendStatus('online')
    } catch {
      setBackendStatus('offline')
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
    online:   { dot: 'var(--accent-green)',  label: 'API Online',   text: 'var(--accent-green)' },
    offline:  { dot: 'var(--accent-red)',    label: 'API Offline',  text: 'var(--accent-red)'   },
    checking: { dot: 'var(--accent-amber)',  label: 'Connecting…',  text: 'var(--accent-amber)' },
  }
  const status = statusColors[backendStatus]

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      height: 'var(--navbar-height)',
      background: 'rgba(5, 10, 20, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 100,
    }}>
      {/* Left — Backend status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status.dot,
          boxShadow: `0 0 8px ${status.dot}`,
          animation: backendStatus === 'online' ? 'pulse-glow 2s infinite' : 'none',
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
          Research Platform{' '}
          <span style={{ color: status.text, marginLeft: 4 }}>● {status.label}</span>
        </span>
      </div>

      {/* Right — Time + Version + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Live clock */}
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-elevated)',
          padding: '0.3rem 0.75rem',
          borderRadius: '100px',
          border: '1px solid var(--border-subtle)',
          letterSpacing: '0.05em',
        }}>
          {timeStr}
        </span>

        <span style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
          padding: '0.3rem 0.75rem',
          borderRadius: '100px',
          border: '1px solid var(--border-subtle)',
        }}>
          v0.1.0
        </span>

        {/* Avatar */}
        <div
          id="navbar-avatar"
          title="Research Platform"
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            color: 'white',
            boxShadow: '0 0 12px rgba(59,130,246,0.25)',
            transition: 'transform var(--transition-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          R
        </div>
      </div>
    </nav>
  )
}
