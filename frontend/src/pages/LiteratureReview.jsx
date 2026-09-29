/**
 * pages/LiteratureReview.jsx — Structured literature review generator.
 */

import React, { useEffect, useState } from 'react'
import { papersApi, reviewApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import toast from 'react-hot-toast'
import {
  IconReview,
  IconPapers,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconBrain,
} from '../components/Icons.jsx'

function ReviewSection({ title, icon, content, isList = false, isCallout = false }) {
  if (!content) return null
  const hasContent = isList ? content.length > 0 : content.trim().length > 0
  if (!hasContent) return null

  return (
    <div
      className="glass-card"
      style={{
        padding: '2rem',
        border: isCallout ? '1px solid rgba(245, 158, 11, 0.4)' : undefined,
        background: isCallout ? 'rgba(245, 158, 11, 0.05)' : undefined,
      }}
    >
      <h3
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '1.15rem',
          color: isCallout ? 'var(--accent-amber)' : 'var(--text-primary)',
        }}
      >
        <span>{icon}</span> {title}
      </h3>

      {isList ? (
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {content.map((item, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.7 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.94rem', whiteSpace: 'pre-wrap', margin: 0 }}>
          {content}
        </p>
      )}
    </div>
  )
}

export default function LiteratureReview() {
  const [papers, setPapers]         = useState([])
  const [selected, setSelected]     = useState(new Set())
  const [review, setReview]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [loadingPapers, setLP]      = useState(true)
  const [reviewTitle, setTitle]     = useState('Advances in Contemporary Machine Learning')
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    papersApi.list()
      .then(d => setPapers(d.papers || []))
      .catch(() => {})
      .finally(() => setLP(false))
  }, [])

  const toggleSelect = (paper) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(paper.paper_id) ? next.delete(paper.paper_id) : next.add(paper.paper_id)
      return next
    })
    setReview(null)
  }

  const selectAll = () => {
    setSelected(new Set(papers.map(p => p.paper_id)))
    setReview(null)
  }

  const clearAll = () => {
    setSelected(new Set())
    setReview(null)
  }

  const handleGenerate = async () => {
    if (selected.size < 2) {
      toast.error('Select at least 2 papers to synthesize a review.')
      return
    }
    setLoading(true)
    try {
      const data = await reviewApi.generate([...selected], reviewTitle)
      setReview(data)
      toast.success('Literature review synthesized successfully!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReview = () => {
    if (!review) return
    const text = `
# Literature Review: ${review.title || reviewTitle}
Generated based on ${selected.size} research papers.

## 1. Overview
${review.overview || ''}

## 2. Common Themes & Patterns
${Array.isArray(review.common_themes) ? review.common_themes.map(t => `- ${t}`).join('\n') : review.common_themes || ''}

## 3. Methodology Comparison
${review.methodology_comparison || ''}

## 4. Potential Research Gaps & Frontiers
${Array.isArray(review.research_gaps) ? review.research_gaps.map(g => `- ${g}`).join('\n') : review.research_gaps || ''}

## 5. Future Research Directions
${Array.isArray(review.future_directions) ? review.future_directions.map(d => `- ${d}`).join('\n') : review.future_directions || ''}
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Review markdown copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-green">
            <IconReview size={12} /> Multi-Paper Synthesis
          </span>
        </div>
        <h1 style={{ marginBottom: '0.4rem' }}>Structured Literature Review</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Synthesize qualitative cross-paper analyses grounded strictly in verified PDF text — zero hallucination.
        </p>
      </div>

      {/* Configuration & Selection Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div className="section-header">
          <div className="section-title">
            <div className="icon-box">
              <IconPapers size={18} />
            </div>
            Target Papers ({selected.size} selected)
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              id="review-title-input"
              className="input"
              placeholder="Review report title…"
              value={reviewTitle}
              onChange={e => setTitle(e.target.value)}
              style={{ width: 260, fontSize: '0.88rem' }}
            />

            {papers.length > 0 && (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={selectAll}>
                  Select All
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
                  Clear
                </button>
              </>
            )}

            <button
              id="generate-review-btn"
              type="button"
              className="btn btn-primary"
              disabled={selected.size < 2 || loading}
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Synthesizing Report…
                </>
              ) : (
                <>
                  <IconSparkles size={16} /> Synthesize Review ({selected.size})
                </>
              )}
            </button>
          </div>
        </div>

        {loadingPapers ? (
          <div className="grid-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconReview size={32} />
            </div>
            <h3>No research papers available</h3>
            <p>Upload 2 or more PDF papers to synthesize a comprehensive literature review.</p>
          </div>
        ) : (
          <div className="grid-3">
            {papers.map(paper => (
              <PaperCard
                key={paper.paper_id}
                paper={paper}
                onSelect={toggleSelect}
                isSelected={selected.has(paper.paper_id)}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generated Literature Review View */}
      {review && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
          {/* Review Header Banner */}
          <div className="glass-card" style={{ padding: '2.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '0.75rem' }}>
                  ✓ Grounded Multi-Paper Synthesis
                </span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {review.title || reviewTitle}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Synthesized across {selected.size} verified academic sources • Zero fabrication guarantee
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyReview}
              >
                {copied ? (
                  <>
                    <IconCheck size={14} color="var(--accent-green)" /> Copied Markdown
                  </>
                ) : (
                  <>
                    <IconCopy size={14} /> Copy Full Review (MD)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sections */}
          <ReviewSection
            title="Executive Overview"
            icon="📖"
            content={review.overview}
          />

          <ReviewSection
            title="Common Methodological Themes & Patterns"
            icon="🧩"
            content={review.common_themes}
            isList={Array.isArray(review.common_themes)}
          />

          <ReviewSection
            title="Cross-Paper Methodology Comparison"
            icon="⚙️"
            content={review.methodology_comparison}
          />

          <ReviewSection
            title="Potential Research Gaps & Unexplored Frontiers"
            icon="⚠️"
            content={review.research_gaps}
            isList={Array.isArray(review.research_gaps)}
            isCallout={true}
          />

          <ReviewSection
            title="Promising Future Directions"
            icon="🚀"
            content={review.future_directions}
            isList={Array.isArray(review.future_directions)}
          />
        </div>
      )}
    </div>
  )
}
