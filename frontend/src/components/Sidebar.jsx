/**
 * components/Sidebar.jsx — Sleek modern sidebar navigation.
 */

import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  IconDashboard,
  IconPapers,
  IconSearch,
  IconCompare,
  IconCitations,
  IconReview,
  IconBrain,
  IconSparkles,
} from './Icons.jsx'

const NAV_GROUPS = [
  {
    title: 'Core Engine',
    items: [
      { to: '/',                  icon: IconDashboard, label: 'Dashboard'       },
      { to: '/papers',            icon: IconPapers,    label: 'Paper Library'   },
      { to: '/search',            icon: IconSearch,    label: 'Semantic Search' },
    ],
  },
  {
    title: 'Intelligence & Synthesis',
    items: [
      { to: '/comparison',        icon: IconCompare,   label: 'Compare Papers'   },
      { to: '/citations',         icon: IconCitations, label: 'Citation Network' },
      { to: '/literature-review', icon: IconReview,    label: 'Literature Review'},
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        overflowY: 'auto',
        transition: 'background var(--transition-slow), border-color var(--transition-slow)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.4rem 1.4rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px var(--accent-glow)',
              flexShrink: 0,
              color: '#ffffff',
            }}
          >
            <IconBrain size={22} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.02rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              ScholarAI
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent-glow-subtle)',
                  color: 'var(--text-accent)',
                  border: '1px solid var(--border-default)',
                  letterSpacing: '0.05em',
                }}
              >
                PRO
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              Research Intelligence Engine
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ padding: '1.25rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div
              style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                padding: '0 0.75rem 0.5rem',
              }}
            >
              {group.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {group.items.map(({ to, icon: Icon, label }) => {
                const isActive = to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to)

                return (
                  <NavLink
                    key={to}
                    to={to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.7rem 0.95rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-glow-subtle)' : 'transparent',
                      border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 10px var(--accent-glow-subtle)' : 'none',
                      transition: 'all var(--transition-fast)',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    <Icon
                      size={18}
                      color={isActive ? 'var(--accent-bright)' : 'currentColor'}
                    />
                    <span>{label}</span>

                    {isActive && (
                      <div
                        style={{
                          marginLeft: 'auto',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          boxShadow: '0 0 8px var(--accent-primary)',
                        }}
                      />
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AI Intelligence Status Card at bottom */}
      <div style={{ padding: '1rem 1rem' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <IconSparkles size={15} color="var(--accent-bright)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              FAISS + SBERT Engine
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Ground-truth semantic index &amp; structured extractor ready.
          </p>
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--accent-green)',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
              Vector DB Active
            </span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>v0.1.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
