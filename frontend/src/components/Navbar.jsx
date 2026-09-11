/**
 * components/Navbar.jsx — Top navigation bar.
 */

import React from 'react'

export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      height: 'var(--navbar-height)',
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 8px var(--accent-green)',
          animation: 'pulse-glow 2s infinite',
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
          Research Platform <span style={{ color: 'var(--accent-green)', marginLeft: 6 }}>● Online</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
          padding: '0.3rem 0.75rem',
          borderRadius: '100px',
          border: '1px solid var(--border-subtle)',
        }}>
          AI Research Platform v0.1
        </span>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          color: 'white',
        }}>
          R
        </div>
      </div>
    </nav>
  )
}
