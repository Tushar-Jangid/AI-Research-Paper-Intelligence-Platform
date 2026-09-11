/**
 * components/PaperCard.jsx — Research paper summary card.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PaperCard({ paper, onSelect, isSelected, showActions = true }) {
  const navigate = useNavigate()

  const truncate = (str, n = 120) =>
    str && str.length > n ? str.slice(0, n) + '…' : str || ''

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        border: isSelected
          ? '1px solid var(--accent-primary)'
          : '1px solid var(--glass-border)',
        background: isSelected ? 'rgba(59,130,246,0.06)' : undefined,
        position: 'relative',
      }}
      onClick={() => onSelect?.(paper)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', color: 'white', fontWeight: 700,
        }}>✓</div>
      )}

      {/* Paper type badge */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span className="badge badge-blue">📄 Paper</span>
        {paper.year && (
          <span className="badge badge-purple">{paper.year}</span>
        )}
        {paper.num_pages && (
          <span className="badge badge-cyan">{paper.num_pages} pages</span>
        )}
      </div>

      {/* Title */}
      <h4 style={{
        marginBottom: '0.5rem',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        lineHeight: 1.4,
        fontWeight: 700,
      }}>
        {truncate(paper.title, 80)}
      </h4>

      {/* Authors */}
      {paper.authors?.length > 0 && (
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          fontWeight: 500,
        }}>
          {paper.authors.slice(0, 3).join(', ')}
          {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
        </p>
      )}

      {/* Abstract */}
      <p style={{
        fontSize: '0.83rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: showActions ? '1.25rem' : 0,
      }}>
        {truncate(paper.abstract)}
      </p>

      {/* Actions */}
      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            id={`btn-summary-${paper.paper_id}`}
            className="btn btn-secondary btn-sm"
            onClick={e => { e.stopPropagation(); navigate(`/papers/${paper.paper_id}/summary`) }}
          >
            📝 Summary
          </button>
          <button
            id={`btn-compare-${paper.paper_id}`}
            className="btn btn-secondary btn-sm"
            onClick={e => {
              e.stopPropagation()
              navigate('/comparison', { state: { preselected: paper.paper_id } })
            }}
          >
            ⚖️ Compare
          </button>
          <button
            id={`btn-citations-${paper.paper_id}`}
            className="btn btn-secondary btn-sm"
            onClick={e => {
              e.stopPropagation()
              navigate('/citations', { state: { paperId: paper.paper_id } })
            }}
          >
            🕸️ Citations
          </button>
        </div>
      )}
    </div>
  )
}
