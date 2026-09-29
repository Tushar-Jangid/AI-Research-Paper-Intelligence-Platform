/**
 * pages/Comparison.jsx — Multi-paper comparison page.
 */

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { papersApi, comparisonApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import toast from 'react-hot-toast'
import {
  IconCompare,
  IconPapers,
  IconCheck,
  IconSparkles,
} from '../components/Icons.jsx'

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
  }, [location.state?.preselected])

  const toggleSelect = (paper) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(paper.paper_id) ? next.delete(paper.paper_id) : next.add(paper.paper_id)
      return next
    })
    setComparison(null)
  }

  const selectAll = () => {
    setSelected(new Set(papers.map(p => p.paper_id)))
    setComparison(null)
  }

  const clearAll = () => {
    setSelected(new Set())
    setComparison(null)
  }

  const handleCompare = async () => {
    if (selected.size < 2) {
      toast.error('Select at least 2 papers to compare.')
      return
    }
    setLoading(true)
    try {
      const data = await comparisonApi.compare([...selected])
      setComparison(data)
      toast.success('Comparative matrix generated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-purple">
            <IconCompare size={12} /> Comparative Analysis
          </span>
        </div>
        <h1 style={{ marginBottom: '0.4rem' }}>Side-by-Side Paper Comparison</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Evaluate architectures, datasets, evaluation metrics, and empirical findings side-by-side.
        </p>
      </div>

      {/* Paper selection area */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div className="section-header">
          <div className="section-title">
            <div className="icon-box">
              <IconPapers size={18} />
            </div>
            Select Papers to Compare
            <span
              style={{
                fontSize: '0.78rem',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                background: selected.size >= 2 ? 'var(--accent-glow-subtle)' : 'var(--bg-elevated)',
                color: selected.size >= 2 ? 'var(--accent-bright)' : 'var(--text-muted)',
                border: '1px solid var(--border-default)',
              }}
            >
              {selected.size} selected (min 2)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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
              id="compare-btn"
              type="button"
              className="btn btn-primary"
              disabled={selected.size < 2 || loading}
              onClick={handleCompare}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Synthesizing Comparison…
                </>
              ) : (
                <>
                  <IconCompare size={16} /> Compare {selected.size} Papers
                </>
              )}
            </button>
          </div>
        </div>

        {loadingPapers ? (
          <div className="grid-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 170, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconPapers size={32} />
            </div>
            <h3>No research papers available</h3>
            <p>Upload at least 2 PDF papers to create side-by-side comparison tables.</p>
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
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="section-header">
            <div className="section-title">
              <div className="icon-box">
                <IconSparkles size={18} />
              </div>
              Comparison Matrix
            </div>
          </div>

          <ComparisonTable comparison={comparison.papers || comparison} />
        </div>
      )}
    </div>
  )
}
