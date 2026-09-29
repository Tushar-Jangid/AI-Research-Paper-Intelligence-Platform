/**
 * components/SummaryCard.jsx — Structured paper summary display.
 */

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  IconPapers,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconBrain,
} from './Icons.jsx'

const FIELD_CONFIG = [
  { key: 'research_problem',  label: 'Research Problem',   badge: '🎯 Problem',      color: 'var(--accent-red)' },
  { key: 'methodology',       label: 'Methodology',         badge: '⚙️ Method',       color: 'var(--accent-primary)' },
  { key: 'dataset',           label: 'Dataset',             badge: '🗃️ Dataset',      color: 'var(--accent-amber)' },
  { key: 'model_algorithm',   label: 'Model / Algorithm',   badge: '🤖 Architecture', color: 'var(--accent-purple)' },
  { key: 'results',           label: 'Key Results',         badge: '📊 Findings',     color: 'var(--accent-green)' },
  { key: 'limitations',       label: 'Limitations',         badge: '⚠️ Constraints',  color: 'var(--accent-amber)' },
  { key: 'conclusion',        label: 'Conclusion',          badge: '🏁 Takeaway',     color: 'var(--accent-cyan)' },
]

function SummaryField({ badge, label, value, color }) {
  if (!value || value.includes('[TODO') || value.includes('[Not identified')) return null

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.4rem',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          background: color,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {badge}
        </span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

export default function SummaryCard({ summary }) {
  const [copied, setCopied] = useState(false)

  if (!summary) return null

  const handleCopySummary = () => {
    const text = `
Title: ${summary.title}
Authors: ${summary.authors?.join(', ') || 'N/A'}

Abstract:
${summary.abstract || 'N/A'}

Research Problem:
${summary.research_problem || 'N/A'}

Methodology:
${summary.methodology || 'N/A'}

Dataset:
${summary.dataset || 'N/A'}

Model/Algorithm:
${summary.model_algorithm || 'N/A'}

Results:
${summary.results || 'N/A'}

Limitations:
${summary.limitations || 'N/A'}

Conclusion:
${summary.conclusion || 'N/A'}
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Summary copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Glass Card */}
      <div className="glass-card" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">
              <IconPapers size={12} /> Research Paper
            </span>
            {summary.year && (
              <span className="badge badge-purple">{summary.year}</span>
            )}
            {summary.authors?.length > 0 && (
              <span className="badge badge-cyan">{summary.authors.slice(0, 2).join(', ')}</span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopySummary}
          >
            {copied ? (
              <>
                <IconCheck size={14} color="var(--accent-green)" /> Copied
              </>
            ) : (
              <>
                <IconCopy size={14} /> Copy Full Summary
              </>
            )}
          </button>
        </div>

        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.5rem', lineHeight: 1.35, color: 'var(--text-primary)' }}>
          {summary.title}
        </h2>

        {summary.abstract && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <IconBrain size={14} color="var(--accent-bright)" /> Abstract &amp; Background
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.93rem', margin: 0 }}>
              {summary.abstract}
            </p>
          </div>
        )}
      </div>

      {/* Key Contributions */}
      {summary.key_contributions?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent-glow-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-bright)',
              }}
            >
              <IconSparkles size={16} />
            </div>
            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Key Research Contributions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {summary.key_contributions
              .filter(c => !c.includes('[TODO') && !c.includes('[Key'))
              .map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--accent-bright)', fontWeight: 700, fontSize: '0.85rem' }}>
                    0{i + 1}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    {c}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Structured Fields Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {FIELD_CONFIG.map(f => (
          <SummaryField
            key={f.key}
            badge={f.badge}
            label={f.label}
            value={summary[f.key]}
            color={f.color}
          />
        ))}
      </div>
    </div>
  )
}
