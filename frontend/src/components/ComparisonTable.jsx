/**
 * components/ComparisonTable.jsx — Side-by-side paper comparison table.
 */

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { IconCopy, IconCheck } from './Icons.jsx'

const COMPARISON_FIELDS = [
  { key: 'dataset',      label: 'Dataset & Benchmarks', icon: '🗃️' },
  { key: 'model',        label: 'Model / Architecture',  icon: '🤖' },
  { key: 'methodology',  label: 'Methodology Approach',  icon: '⚙️' },
  { key: 'metrics',      label: 'Evaluation Metrics',    icon: '📏' },
  { key: 'results',      label: 'Empirical Results',     icon: '📊' },
  { key: 'strengths',    label: 'Key Strengths',         icon: '✅' },
  { key: 'limitations',  label: 'Limitations & Gaps',    icon: '⚠️' },
]

function truncate(str, n = 300) {
  return str && str.length > n ? str.slice(0, n) + '…' : str || '—'
}

export default function ComparisonTable({ comparison }) {
  const [copied, setCopied] = useState(false)

  if (!comparison?.length) return null

  const handleCopy = () => {
    let md = '# Research Paper Comparison\n\n'
    md += `| Dimension | ${comparison.map(p => p.title || 'Paper').join(' | ')} |\n`
    md += `| --- | ${comparison.map(() => '---').join(' | ')} |\n`

    COMPARISON_FIELDS.forEach(({ key, label }) => {
      const row = comparison.map(p => (p[key] || '—').replace(/\n/g, ' '))
      md += `| **${label}** | ${row.join(' | ')} |\n`
    })

    navigator.clipboard.writeText(md)
    setCopied(true)
    toast.success('Comparison table copied in Markdown format!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <IconCheck size={14} color="var(--accent-green)" /> Copied Markdown
            </>
          ) : (
            <>
              <IconCopy size={14} /> Copy as Markdown
            </>
          )}
        </button>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th style={{ width: 170, minWidth: 150 }}>Research Dimension</th>
              {comparison.map((paper, i) => (
                <th key={paper.paper_id || i} style={{ minWidth: 260 }}>
                  <div style={{ color: 'var(--text-accent)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                    Paper 0{i + 1}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35 }}>
                    {paper.title || `Paper ${i + 1}`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FIELDS.map(({ key, label, icon }) => (
              <tr key={key}>
                <td
                  style={{
                    background: 'var(--bg-elevated)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <span style={{ marginRight: '0.5rem' }}>{icon}</span>
                  {label}
                </td>
                {comparison.map((paper, i) => (
                  <td key={paper.paper_id || i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {truncate(paper[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
