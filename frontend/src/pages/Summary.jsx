/**
 * pages/Summary.jsx — Paper structured summary viewer.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import SummaryCard from '../components/SummaryCard.jsx'

export default function Summary() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    papersApi.getSummary(id)
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/papers')}>
          ← Back to Papers
        </button>
        {summary && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => navigate('/comparison', { state: { preselected: id } })}>
              ⚖️ Compare
            </button>
            <button className="btn btn-secondary btn-sm"
              onClick={() => navigate('/citations', { state: { paperId: id } })}>
              🕸️ Citations
            </button>
          </div>
        )}
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>Paper Summary</h1>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Could not load summary</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/papers')}>
            ← Go to Papers
          </button>
        </div>
      )}

      {summary && !loading && <SummaryCard summary={summary} />}
    </div>
  )
}
