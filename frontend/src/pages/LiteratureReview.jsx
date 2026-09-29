/**
 * pages/LiteratureReview.jsx — Structured literature review generator.
 */

import React, { useEffect, useState } from 'react'
import { papersApi, reviewApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import toast from 'react-hot-toast'

function ReviewSection({ title, icon, content, isList = false }) {
  if (!content) return null
  const hasContent = isList ? content.length > 0 : content.trim().length > 0
  if (!hasContent) return null

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
        <span>{icon}</span> {title}
      </h3>
      {isList ? (
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {content.map((item, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
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
  const [reviewTitle, setTitle]     = useState('Literature Review')

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

  const handleGenerate = async () => {
    if (selected.size < 2) { toast.error('Select at least 2 papers.'); return }
    setLoading(true)
    try {
      const data = await reviewApi.generate([...selected], reviewTitle)
      setReview(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Literature Review</h1>
        <p>
          Select papers and generate a structured literature review.
          All content is grounded in the uploaded papers — no fabrication.
        </p>
      </div>

      {/* Paper selection */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-header">
          <h3 className="section-title">
            <span className="icon">📄</span>
            Select Papers ({selected.size} selected)
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              id="review-title-input"
              className="input"
              placeholder="Review title…"
              value={reviewTitle}
              onChange={e => setTitle(e.target.value)}
              style={{ width: 220, fontSize: '0.85rem' }}
            />
            <button
              id="generate-review-btn"
              className="btn btn-primary"
              disabled={selected.size < 2 || loading}
              onClick={handleGenerate}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
                : '📚 Generate Review'}
            </button>
          </div>
        </div>

        {loadingPapers ? (
          <div className="grid-3">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No papers available</h3>
            <p>Upload at least 2 papers to generate a review.</p>
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

      {/* Review output */}
      {review && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.4s ease' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div>
              <h2 style={{ marginBottom: '0.3rem' }}>{review.title}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {review.paper_ids.length} papers · Generated from uploaded content only
              </span>
            </div>
            <span className="badge badge-green">✓ Complete</span>
          </div>

          <ReviewSection title="Introduction"          icon="📖" content={review.introduction} />
          <ReviewSection title="Existing Research"     icon="🔬" content={review.existing_research} />
          <ReviewSection title="Methodologies"         icon="⚙️" content={review.methodologies} />
          <ReviewSection title="Datasets"              icon="🗃️" content={review.datasets} />
          <ReviewSection title="Experimental Results"  icon="📊" content={review.experimental_results} />
          <ReviewSection title="Comparison"            icon="⚖️" content={review.comparison} />

          <ReviewSection
            title="Research Trends"
            icon="📈"
            content={review.research_trends}
            isList={true}
          />

          {review.potential_research_gaps?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.75rem', borderColor: 'rgba(245,158,11,0.25)' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                🔭 Potential Research Gaps
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                  ⚠️ Potential only — Researcher verification required
                </span>
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {review.potential_research_gaps.map((g, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          <ReviewSection title="Conclusion" icon="🏁" content={review.conclusion} />
        </div>
      )}
    </div>
  )
}
