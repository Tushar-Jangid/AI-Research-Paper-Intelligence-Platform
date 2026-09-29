/**
 * pages/Comparison.jsx — Multi-paper comparison page.
 */

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { papersApi, comparisonApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import toast from 'react-hot-toast'

export default function Comparison() {
  const location = useLocation()
  const [papers, setPapers]           = useState([])
  const [selected, setSelected]       = useState(new Set())
  const [comparison, setComparison]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [loadingPapers, setLP]        = useState(true)

  useEffect(() => {
    papersApi.list()
      .then(d => {
        setPapers(d.papers || [])
        // Pre-select from navigation state
        const pre = location.state?.preselected
        if (pre) setSelected(new Set([pre]))
      })
      .catch(() => setPapers([]))
      .finally(() => setLP(false))
  }, [])

  const toggleSelect = (paper) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(paper.paper_id) ? next.delete(paper.paper_id) : next.add(paper.paper_id)
      return next
    })
    setComparison(null)
  }

  const handleCompare = async () => {
    if (selected.size < 2) { toast.error('Select at least 2 papers to compare.'); return }
    setLoading(true)
    try {
      const data = await comparisonApi.compare([...selected])
      setComparison(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Compare Papers</h1>
        <p>Select 2 or more papers to compare side-by-side across methodology, datasets, results, and more.</p>
      </div>

      {/* Paper selection */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-header">
          <h3 className="section-title"><span className="icon">📄</span> Select Papers</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {selected.size} selected
            </span>
            <button
              id="compare-btn"
              className="btn btn-primary"
              disabled={selected.size < 2 || loading}
              onClick={handleCompare}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Comparing…</>
                : `⚖️ Compare ${selected.size} Papers`}
            </button>
          </div>
        </div>

        {loadingPapers ? (
          <div className="grid-3">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No papers available</h3>
            <p>Upload at least 2 papers to compare them.</p>
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

      {/* Comparison results */}
      {comparison && (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>📊 Comparison Results</h3>
          <ComparisonTable comparison={comparison.comparison} />

          {/* Trends */}
          {comparison.research_trends?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📈 Research Trends
                <span className="badge badge-amber" style={{ fontWeight: 500, fontSize: '0.7rem' }}>
                  Observations from selected papers only
                </span>
              </h4>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {comparison.research_trends.map((t, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {comparison.potential_gaps?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem', borderColor: 'rgba(245,158,11,0.2)' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔭 Potential Research Gaps
                <span className="badge badge-amber" style={{ fontWeight: 500, fontSize: '0.7rem' }}>
                  ⚠️ Requires researcher verification
                </span>
              </h4>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {comparison.potential_gaps.map((g, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
