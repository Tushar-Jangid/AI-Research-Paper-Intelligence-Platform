/**
 * components/ComparisonTable.jsx — Side-by-side paper comparison table.
 */

import React from 'react'

const COMPARISON_FIELDS = [
  { key: 'dataset',      label: 'Dataset',      icon: '🗃️' },
  { key: 'model',        label: 'Model',         icon: '🤖' },
  { key: 'methodology',  label: 'Methodology',   icon: '⚙️' },
  { key: 'metrics',      label: 'Metrics',       icon: '📏' },
  { key: 'results',      label: 'Results',       icon: '📊' },
  { key: 'strengths',    label: 'Strengths',     icon: '✅' },
  { key: 'limitations',  label: 'Limitations',   icon: '⚠️' },
]

function truncate(str, n = 200) {
  return str && str.length > n ? str.slice(0, n) + '…' : str || '—'
}

export default function ComparisonTable({ comparison }) {
  if (!comparison?.length) return null

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="comparison-table" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}>
        <thead>
          <tr>
            <th style={{ width: 130, minWidth: 100 }}>Dimension</th>
            {comparison.map((paper, i) => (
              <th key={paper.paper_id} style={{ minWidth: 220 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                  {paper.title?.length > 40
                    ? paper.title.slice(0, 40) + '…'
                    : paper.title || `Paper ${i + 1}`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FIELDS.map(({ key, label, icon }) => (
            <tr key={key}>
              <td style={{
                background: 'var(--bg-elevated)',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ marginRight: '0.4rem' }}>{icon}</span>
                {label}
              </td>
              {comparison.map(paper => (
                <td key={paper.paper_id} style={{ fontSize: '0.85rem' }}>
                  {truncate(paper[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
