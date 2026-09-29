/**
 * pages/Search.jsx — Semantic search page.
 * Searches across paper embeddings by conceptual meaning.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchApi } from '../services/api.js'
import SearchBar from '../components/SearchBar.jsx'
import toast from 'react-hot-toast'
import {
  IconSearch,
  IconPapers,
  IconSparkles,
  IconCopy,
  IconCheck,
  IconArrowRight,
} from '../components/Icons.jsx'

const EXAMPLE_QUERIES = [
  'Transformer models for medical image classification',
  'Self-supervised learning for NLP pretraining',
  'Attention mechanism in neural networks',
  'Graph neural networks for knowledge representation',
  'Diffusion models for image synthesis',
]

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const isHigh = score > 0.8
  const isMed = score > 0.6
  const color = isHigh ? 'var(--accent-green)' : isMed ? 'var(--accent-amber)' : 'var(--accent-bright)'
  const badgeClass = isHigh ? 'badge-green' : isMed ? 'badge-amber' : 'badge-blue'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <div style={{ width: 80, height: 6, background: 'var(--bg-elevated)', borderRadius: 100, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            background: color,
            borderRadius: 100,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.72rem' }}>
        {pct}% Match
      </span>
    </div>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const location = useLocation()
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [topK, setTopK]           = useState(10)
  const [copiedId, setCopiedId]   = useState(null)

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

  // Handle incoming query from location state (e.g. from Hero or Command Palette)
  useEffect(() => {
    if (location.state?.autoQuery) {
      handleSearch(location.state.autoQuery)
    }
  }, [location.state?.autoQuery])

  const handleCopyExcerpt = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Excerpt copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-blue">
            <IconSparkles size={12} /> Semantic Search Engine
          </span>
        </div>
        <h1 style={{ marginBottom: '0.4rem' }}>Semantic Literature Search</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Search across indexed papers by <strong style={{ color: 'var(--accent-bright)' }}>meaning and concept</strong>, not literal keywords.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="glass-card" style={{ padding: '2.25rem', marginBottom: '2.5rem' }}>
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          initialValue={location.state?.autoQuery || ''}
        />

        {/* Top-K filter pills */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Retrieve Depth:</span>
          {[5, 10, 20].map(k => (
            <button
              key={k}
              id={`top-k-${k}`}
              type="button"
              className={`btn btn-sm ${topK === k ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTopK(k)}
              style={{ borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.85rem' }}
            >
              Top {k} Chunks
            </button>
          ))}
        </div>

        {/* Example prompts */}
        {!results && (
          <div style={{ marginTop: '1.75rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Suggested research queries:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {EXAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  type="button"
                  className="chip"
                  onClick={() => handleSearch(q)}
                >
                  <IconSearch size={13} color="var(--accent-bright)" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Computing cosine similarity over FAISS vectors…</div>
        </div>
      )}

      {/* Results View */}
      {results && !loading && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="section-header">
            <div className="section-title">
              <div className="icon-box">
                <IconSearch size={18} />
              </div>
              Results for: &ldquo;<span style={{ color: 'var(--accent-bright)' }}>{lastQuery}</span>&rdquo;
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {results.results?.length || 0} semantic matches found
            </span>
          </div>

          {results.results?.length === 0 ? (
            <div className="glass-card empty-state">
              <div className="empty-state-icon">
                <IconSearch size={32} />
              </div>
              <h3>No matching conceptual chunks found</h3>
              <p>
                Try broader academic phrases or upload additional related papers.
                {results.error && <> ({results.error})</>}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {results.results.map((res, idx) => {
                const uniqueId = `${res.paper_id}-${idx}`
                return (
                  <div
                    key={uniqueId}
                    className="glass-card"
                    style={{ padding: '1.75rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                            {res.section || 'General Content'}
                          </span>
                          {res.year && (
                            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                              {res.year}
                            </span>
                          )}
                        </div>
                        <h4
                          style={{
                            color: 'var(--text-primary)',
                            fontSize: '1.05rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/papers/${res.paper_id}/summary`)}
                        >
                          {res.paper_title || `Paper #${res.paper_id}`}
                        </h4>
                      </div>

                      <ScoreBadge score={res.similarity_score ?? res.score ?? 0.85} />
                    </div>

                    {/* Chunk text snippet */}
                    <div
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem 1.25rem',
                        fontSize: '0.92rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        marginBottom: '1rem',
                        borderLeft: '3px solid var(--accent-primary)',
                      }}
                    >
                      &ldquo;{res.chunk_text || res.text}&rdquo;
                    </div>

                    {/* Bottom actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Paper ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{res.paper_id}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCopyExcerpt(res.chunk_text || res.text, uniqueId)}
                        >
                          {copiedId === uniqueId ? (
                            <>
                              <IconCheck size={14} color="var(--accent-green)" /> Copied
                            </>
                          ) : (
                            <>
                              <IconCopy size={14} /> Copy Excerpt
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/papers/${res.paper_id}/summary`)}
                        >
                          View Paper Summary →
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
