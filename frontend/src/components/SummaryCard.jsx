/**
 * components/SummaryCard.jsx — Structured paper summary display.
 */

import React from 'react'

const FIELD_CONFIG = [
  { key: 'research_problem',  label: 'Research Problem',   icon: '🎯' },
  { key: 'methodology',       label: 'Methodology',         icon: '⚙️' },
  { key: 'dataset',           label: 'Dataset',             icon: '🗃️' },
  { key: 'model_algorithm',   label: 'Model / Algorithm',   icon: '🤖' },
  { key: 'results',           label: 'Results',             icon: '📊' },
  { key: 'limitations',       label: 'Limitations',         icon: '⚠️' },
  { key: 'conclusion',        label: 'Conclusion',          icon: '🏁' },
]

function SummaryField({ icon, label, value }) {
  if (!value || value.includes('[TODO') || value.includes('[Not identified')) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      transition: 'border-color var(--transition-fast)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <span>{icon}</span>
        <span style={{
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)',
        }}>
          {label}
        </span>
      </div>
      <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

export default function SummaryCard({ summary }) {
  if (!summary) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-blue">📄 Research Paper</span>
          {summary.authors?.length > 0 && (
            <span className="badge badge-purple">{summary.authors.slice(0,2).join(', ')}</span>
          )}
        </div>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>{summary.title}</h2>
        {summary.abstract && (
          <>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem',
            }}>Abstract</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {summary.abstract}
            </p>
          </>
        )}
      </div>

      {/* Key Contributions */}
      {summary.key_contributions?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <span>⭐</span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-muted)',
            }}>
              Key Contributions
            </span>
          </div>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {summary.key_contributions
              .filter(c => !c.includes('[TODO') && !c.includes('[Key'))
              .map((c, i) => (
                <li key={i} style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {c}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {FIELD_CONFIG.map(f => (
          <SummaryField key={f.key} icon={f.icon} label={f.label} value={summary[f.key]} />
        ))}
      </div>
    </div>
  )
}
