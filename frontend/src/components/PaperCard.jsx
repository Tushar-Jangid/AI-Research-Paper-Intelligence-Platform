/**
 * components/PaperCard.jsx — Premium research paper card.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconPapers,
  IconCompare,
  IconCitations,
  IconCheck,
  IconSparkles,
} from './Icons.jsx'

export default function PaperCard({ paper, onSelect, isSelected, showActions = true }) {
  const navigate = useNavigate()

  const truncate = (str, n = 130) =>
    str && str.length > n ? str.slice(0, n) + '…' : str || ''

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.6rem',
        cursor: 'pointer',
        border: isSelected
          ? '1.5px solid var(--accent-primary)'
          : '1px solid var(--glass-border)',
        background: isSelected ? 'var(--accent-glow-subtle)' : 'var(--glass-bg)',
        boxShadow: isSelected ? '0 0 20px var(--accent-glow)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
      onClick={() => onSelect?.(paper)}
    >
      <div>
        {/* Top Badges & Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">
              <IconPapers size={12} /> Paper
            </span>
            {paper.year && (
              <span className="badge badge-purple">{paper.year}</span>
            )}
            {paper.num_pages && (
              <span className="badge badge-cyan">{paper.num_pages}p</span>
            )}
          </div>

          {isSelected && (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 10px var(--accent-primary)',
              }}
            >
              <IconCheck size={14} />
            </div>
          )}
        </div>

        {/* Paper Title */}
        <h4
          style={{
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            lineHeight: 1.4,
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {truncate(paper.title, 85)}
        </h4>

        {/* Authors */}
        {paper.authors?.length > 0 && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginBottom: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>✍️</span>
            <span>
              {paper.authors.slice(0, 3).join(', ')}
              {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
            </span>
          </div>
        )}

        {/* Abstract snippet */}
        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: showActions ? '1.4rem' : 0,
          }}
        >
          {truncate(paper.abstract || 'No abstract text available.')}
        </p>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            gap: '0.45rem',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            id={`btn-summary-${paper.paper_id}`}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={e => {
              e.stopPropagation()
              navigate(`/papers/${paper.paper_id}/summary`)
            }}
          >
            <IconSparkles size={14} color="var(--accent-bright)" /> Summary
          </button>
          <button
            id={`btn-compare-${paper.paper_id}`}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={e => {
              e.stopPropagation()
              navigate('/comparison', { state: { preselected: paper.paper_id } })
            }}
          >
            <IconCompare size={14} color="var(--accent-purple)" /> Compare
          </button>
          <button
            id={`btn-citations-${paper.paper_id}`}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={e => {
              e.stopPropagation()
              navigate('/citations', { state: { paperId: paper.paper_id } })
            }}
          >
            <IconCitations size={14} color="var(--accent-cyan)" /> Citations
          </button>
        </div>
      )}
    </div>
  )
}
