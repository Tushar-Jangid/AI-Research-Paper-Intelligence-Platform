/**
 * pages/Search.jsx — Semantic search page.
 *
 * Searches by MEANING, not keywords.
 * Results show paper, section, chunk text, and similarity score.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchApi } from '../services/api.js'
import SearchBar from '../components/SearchBar.jsx'

const EXAMPLE_QUERIES = [
  'Transformer models for medical image classification',
  'Self-supervised learning for NLP pretraining',
  'Attention mechanism in neural networks',
  'Graph neural networks for knowledge representation',
  'Diffusion models for image generation',
]

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score > 0.8 ? 'var(--accent-green)' : score > 0.6 ? 'var(--accent-amber)' : 'var(--text-secondary)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color,
          borderRadius: 100,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', color, minWidth: 40 }}>
        {pct}%
      </span>
    </div>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [topK, setTopK]           = useState(10)

  const handleSearch = async (query) => {
    setLoading(true)
    setLastQuery(query)
    try {
      const data = await searchApi.search(query, topK)
      setResults(data)
    } catch (err) {
      setResults({ query, results: [], total_results: 0, error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Semantic Search</h1>
        <p>
          Search across all uploaded papers by <strong style={{ color: 'var(--accent-bright)' }}>meaning</strong>, not just keywords.
          Results are ranked by semantic similarity.
        </p>
      </div>

      {/* Search form */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <SearchBar onSearch={handleSearch} loading={loading} />

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Results:</span>
          {[5, 10, 20].map(k => (
            <button
              key={k}
              id={`top-k-${k}`}
              className={`btn btn-sm ${topK === k ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTopK(k)}
            >
              Top {k}
            </button>
          ))}
        </div>

        {/* Example queries */}
        {!results && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Try these examples:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {EXAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  className="chip"
                  onClick={() => handleSearch(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
        </div>
      )}

      {results && !loading && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="section-header">
            <div className="section-title">
              <span className="icon">🔍</span>
              Results for: &ldquo;{lastQuery}&rdquo;
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {results.total_results} results found
            </span>
          </div>

          {results.results.length === 0 ? (
            <div className="glass-card empty-state">
              <div className="empty-state-icon">🔭</div>
              <h3>No results found</h3>
              <p>
                Upload more papers or try a different query.
                {results.error && <> Error: {results.error}</>}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.results.map((r, i) => (
                <div
                  key={i}
                  id={`search-result-${i}`}
                  className="glass-card"
                  style={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'var(--accent-glow)',
                          border: '1px solid var(--accent-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-bright)',
                        }}>{i + 1}</span>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{r.title || 'Unknown Paper'}</h4>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        Section: {r.section}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0, minWidth: 180 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'right' }}>
                        Semantic Similarity
                      </div>
                      <ScoreBar score={r.similarity_score} />
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.875rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginBottom: '0.875rem',
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{r.chunk_text?.slice(0, 300)}{r.chunk_text?.length > 300 ? '…' : ''}&rdquo;
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/papers/${r.paper_id}/summary`)}
                  >
                    View full paper →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
