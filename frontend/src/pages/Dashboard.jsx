/**
 * pages/Dashboard.jsx — Research Platform dashboard.
 *
 * Shows: stats, recent papers, quick actions, research overview.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import PaperUpload from '../components/PaperUpload.jsx'

export default function Dashboard() {
  const navigate   = useNavigate()
  const [papers, setPapers]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showUpload, setShowUpload] = useState(false)

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

  const recentPapers = [...papers].sort(
    (a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp)
  ).slice(0, 5)

  return (
    <div className="page-container">
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: '0.4rem' }}>
              Research Dashboard
              <span style={{
                marginLeft: '0.75rem',
                fontSize: '1rem',
                background: 'var(--accent-glow)',
                color: 'var(--accent-bright)',
                padding: '0.2rem 0.75rem',
                borderRadius: '100px',
                border: '1px solid var(--border-default)',
                fontWeight: 600,
              }}>Intelligence Platform</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Upload, analyze, and explore your research paper collection.
            </p>
          </div>
          <button
            id="dashboard-upload-btn"
            className="btn btn-primary"
            onClick={() => setShowUpload(s => !s)}
          >
            {showUpload ? '✕ Close' : '+ Upload Paper'}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={{ marginBottom: '2rem', animation: 'slideInRight 0.3s ease' }}>
          <PaperUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Papers',      value: papers.length,                         icon: '📄', color: 'var(--accent-primary)' },
          { label: 'Ready to Search',   value: papers.length,                         icon: '🔍', color: 'var(--accent-cyan)'    },
          { label: 'Comparisons',       value: papers.length > 1 ? '✓' : '—',        icon: '⚖️', color: 'var(--accent-purple)'  },
          { label: 'Review Ready',      value: papers.length >= 2 ? '✓' : '—',       icon: '📚', color: 'var(--accent-green)'   },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-value">{loading ? '…' : stat.value}</div>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                background: `${stat.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>
                {stat.icon}
              </div>
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: '🔍 Semantic Search',   to: '/search',            id: 'quick-search'   },
            { label: '⚖️ Compare Papers',    to: '/comparison',        id: 'quick-compare'  },
            { label: '🕸️ Citation Network',  to: '/citations',         id: 'quick-citations'},
            { label: '📚 Literature Review', to: '/literature-review', id: 'quick-review'   },
          ].map(action => (
            <button
              key={action.to}
              id={action.id}
              className="btn btn-secondary"
              onClick={() => navigate(action.to)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Papers */}
      <div>
        <div className="section-header">
          <h3 className="section-title">
            <span className="icon">📄</span>
            Recently Uploaded
          </h3>
          {papers.length > 5 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/papers')}>
              View all →
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No papers uploaded yet</h3>
            <p>Upload your first research paper to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              + Upload Paper
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentPapers.map(paper => (
              <div
                key={paper.paper_id}
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer' }}
                onClick={() => navigate(`/papers/${paper.paper_id}/summary`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', fontSize: '0.95rem' }}
                         className="truncate">
                      {paper.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {paper.authors?.slice(0, 2).join(', ')} · {paper.num_pages} pages
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <span className="badge badge-blue">{paper.year || 'n.d.'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
