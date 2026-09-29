/**
 * pages/Summary.jsx — Paper structured summary viewer.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import SummaryCard from '../components/SummaryCard.jsx'
import {
  IconPapers,
  IconCompare,
  IconCitations,
  IconSparkles,
} from '../components/Icons.jsx'

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
      {/* Top action navigation */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/papers')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          ← Back to Paper Library
        </button>

        {summary && (
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/comparison', { state: { preselected: id } })}
            >
              <IconCompare size={14} color="var(--accent-purple)" /> Compare Paper
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/citations', { state: { paperId: id } })}
            >
              <IconCitations size={14} color="var(--accent-cyan)" /> Citation Network
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">
            <IconPapers size={32} />
          </div>
          <h3>Could not load paper summary</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/papers')}>
            ← Return to Paper Library
          </button>
        </div>
      )}

      {summary && !loading && <SummaryCard summary={summary} />}
    </div>
  )
}
