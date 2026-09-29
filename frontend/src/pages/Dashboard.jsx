/**
 * pages/Dashboard.jsx — Research Platform dashboard.
 * Features: High-impact hero banner, embedded semantic query bar,
 * live stat cards, quick action launchers, and recent research papers library.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import PaperUpload from '../components/PaperUpload.jsx'
import {
  IconPapers,
  IconSearch,
  IconCompare,
  IconCitations,
  IconReview,
  IconSparkles,
  IconUpload,
  IconBrain,
  IconArrowRight,
} from '../components/Icons.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [heroSearch, setHeroSearch] = useState('')

  const loadPapers = async () => {
    try {
      const data = await papersApi.list()
      setPapers(data.papers || [])
    } catch {
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPapers() }, [])

  const handleUploadSuccess = () => {
    setShowUpload(false)
    loadPapers()
  }

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault()
    if (heroSearch.trim()) {
      navigate('/search', { state: { autoQuery: heroSearch.trim() } })
    }
  }

  const recentPapers = [...papers].sort(
    (a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp)
  ).slice(0, 6)

  // Calculate total pages
  const totalPages = papers.reduce((sum, p) => sum + (p.num_pages || 0), 0)

  return (
    <div className="page-container">
      {/* ── 1. HERO BANNER ─────────────────────────────────────────── */}
      <div className="hero-banner">
        <div style={{ maxWidth: 860, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--accent-glow-subtle)',
                color: 'var(--text-accent)',
                border: '1px solid var(--border-default)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <IconSparkles size={14} color="var(--accent-bright)" />
              Next-Gen Academic Analysis
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              FAISS Semantic Vector Indexing
            </span>
          </div>

          <h1 style={{ marginBottom: '0.85rem', lineHeight: 1.2 }}>
            Transform Research Papers into{' '}
            <span style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Actionable Intelligence
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 660 }}>
            Upload PDFs to automatically extract methodologies, datasets, algorithms, and results. Search across literature by meaning and discover citation networks.
          </p>

          {/* Embedded Semantic Search Bar */}
          <form
            onSubmit={handleHeroSearchSubmit}
            style={{
              display: 'flex',
              gap: '0.6rem',
              maxWidth: 620,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.35rem 0.5rem 0.35rem 1.25rem',
              boxShadow: 'var(--shadow-md), var(--shadow-glow)',
              marginBottom: '1rem',
              alignItems: 'center',
            }}
          >
            <IconSearch size={18} color="var(--accent-bright)" />
            <input
              type="text"
              placeholder="Search concepts across papers (e.g. self-attention in medical imaging)…"
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.94rem',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.1rem' }}>
              Search
            </button>
          </form>

          {/* Quick Query Suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try:</span>
            {['Transformer models', 'Self-supervised NLP', 'Diffusion limits'].map(q => (
              <button
                key={q}
                type="button"
                className="chip"
                onClick={() => navigate('/search', { state: { autoQuery: q } })}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. UPLOAD MODAL / ACCORDION ─────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Document Ingestion</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Index new PDF papers with automated section breakdown</p>
          </div>
          <button
            id="dashboard-upload-btn"
            className="btn btn-primary"
            onClick={() => setShowUpload(s => !s)}
          >
            {showUpload ? '✕ Close Ingestion' : '+ Upload New Paper'}
          </button>
        </div>

        {showUpload && (
          <div style={{ animation: 'fadeInUp 0.3s ease', marginBottom: '1.5rem' }}>
            <PaperUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}
      </div>

      {/* ── 3. METRIC STATS ROW ─────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Indexed Papers',  value: papers.length,   sub: 'Full-text parsed', icon: IconPapers,    color: 'var(--accent-primary)' },
          { label: 'Total Pages',     value: totalPages,      sub: 'Sections extracted', icon: IconBrain,    color: 'var(--accent-cyan)' },
          { label: 'Semantic Vectors',value: papers.length * 15, sub: 'SBERT Embeddings', icon: IconSearch,  color: 'var(--accent-purple)' },
          { label: 'Synthesis Status',value: papers.length >= 2 ? 'Ready' : 'Pending', sub: 'Multi-paper synthesis', icon: IconReview, color: 'var(--accent-green)' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-value">{loading ? '…' : stat.value}</div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-glow-subtle)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>
              <div className="stat-label">{stat.label}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* ── 4. QUICK WORKFLOW CARDS ─────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="section-header">
          <div className="section-title">
            <div className="icon-box">
              <IconSparkles size={18} />
            </div>
            Intelligence Workflows
          </div>
        </div>

        <div className="grid-4">
          {[
            {
              title: 'Semantic Search',
              desc: 'Search by conceptual meaning across all paper embeddings.',
              to: '/search',
              icon: IconSearch,
              badge: 'Deep Search',
            },
            {
              title: 'Multi-Paper Compare',
              desc: 'Side-by-side matrices of models, datasets & results.',
              to: '/comparison',
              icon: IconCompare,
              badge: 'Benchmarking',
            },
            {
              title: 'Citation Graph',
              desc: 'Interactive 2D force-directed citation relationship network.',
              to: '/citations',
              icon: IconCitations,
              badge: 'Network',
            },
            {
              title: 'Literature Review',
              desc: 'Auto-synthesize structured literature review reports.',
              to: '/literature-review',
              icon: IconReview,
              badge: 'Synthesis',
            },
          ].map(wf => {
            const Icon = wf.icon
            return (
              <div
                key={wf.to}
                className="glass-card"
                style={{
                  padding: '1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(wf.to)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-glow-subtle)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-bright)',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{wf.badge}</span>
                  </div>

                  <h4 style={{ marginBottom: '0.4rem', color: 'var(--text-primary)' }}>{wf.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {wf.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-accent)', fontSize: '0.82rem', fontWeight: 600 }}>
                  Launch Workflow <IconArrowRight size={14} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. RECENTLY INDEXED PAPERS ──────────────────────────────── */}
      <div>
        <div className="section-header">
          <div className="section-title">
            <div className="icon-box">
              <IconPapers size={18} />
            </div>
            Recently Indexed Papers
          </div>
          {papers.length > 6 && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/papers')}>
              View Library ({papers.length}) →
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 85, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">
              <IconPapers size={32} />
            </div>
            <h3>No research papers in library yet</h3>
            <p>Upload your PDF papers to generate summaries, compare benchmarks, and query with semantic search.</p>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <IconUpload size={16} /> Upload First Paper
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentPapers.map((paper, idx) => (
              <div
                key={paper.paper_id || idx}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.6rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                }}
                onClick={() => navigate(`/papers/${paper.paper_id}/summary`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-bright)',
                      flexShrink: 0,
                    }}
                  >
                    <IconPapers size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                        fontSize: '0.98rem',
                        fontFamily: 'var(--font-heading)',
                      }}
                      className="truncate"
                    >
                      {paper.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span>{paper.authors?.slice(0, 3).join(', ') || 'Authors N/A'}</span>
                      <span>•</span>
                      <span>{paper.num_pages || '?'} pages</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                  {paper.year && <span className="badge badge-purple">{paper.year}</span>}
                  <span className="badge badge-blue">View Summary →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
