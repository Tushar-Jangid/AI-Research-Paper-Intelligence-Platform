/**
 * pages/Papers.jsx — Paper library browser.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import PaperUpload from '../components/PaperUpload.jsx'
import {
  IconPapers,
  IconSearch,
  IconUpload,
  IconGrid,
  IconList,
  IconSparkles,
} from '../components/Icons.jsx'

export default function Papers() {
  const navigate = useNavigate()
  const [papers, setPapers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'title' | 'pages'

  const load = async () => {
    setLoading(true)
    try {
      const data = await papersApi.list()
      setPapers(data.papers || [])
    } catch {
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  let filtered = papers.filter(p =>
    !filter ||
    p.title?.toLowerCase().includes(filter.toLowerCase()) ||
    p.authors?.some(a => a.toLowerCase().includes(filter.toLowerCase()))
  )

  if (sortBy === 'title') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  } else if (sortBy === 'pages') {
    filtered.sort((a, b) => (b.num_pages || 0) - (a.num_pages || 0))
  } else {
    // recent
    filtered.sort((a, b) => new Date(b.upload_timestamp || 0) - new Date(a.upload_timestamp || 0))
  }

  const totalPages = papers.reduce((acc, p) => acc + (p.num_pages || 0), 0)

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.4rem' }}>Paper Library</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Explore, filter, and inspect all {papers.length} indexed research papers.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? '✕ Close Ingestion' : '+ Ingest New PDF'}
        </button>
      </div>

      {/* Upload Drawer */}
      {showUpload && (
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.3s ease' }}>
          <PaperUpload onUploadSuccess={() => { setShowUpload(false); load() }} />
        </div>
      )}

      {/* Filter and View Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260, maxWidth: 500, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={16} />
          </span>
          <input
            id="papers-filter-input"
            className="input"
            placeholder="Search by paper title or author name…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="pages">Length (Pages)</option>
            </select>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', padding: 3 }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 4,
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
            >
              <IconGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 4,
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="List View"
            >
              <IconList size={15} />
            </button>
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            {filtered.length} of {papers.length} papers
          </span>
        </div>
      </div>

      {/* Paper List Content */}
      {loading ? (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">
            <IconPapers size={32} />
          </div>
          <h3>{filter ? 'No papers matching your query' : 'No research papers uploaded yet'}</h3>
          <p>{filter ? 'Try refining your keywords or clearing the filter.' : 'Upload your first research paper above.'}</p>
          {filter && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilter('')}>
              Clear Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-3">
          {filtered.map(paper => (
            <PaperCard key={paper.paper_id} paper={paper} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map(paper => (
            <div
              key={paper.paper_id}
              className="glass-card"
              style={{
                padding: '1.25rem 1.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/papers/${paper.paper_id}/summary`)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                    {paper.year || 'n.d.'}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    {paper.num_pages || '?'} pages
                  </span>
                </div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }} className="truncate">
                  {paper.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {paper.authors?.slice(0, 4).join(', ') || 'Authors not specified'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={e => {
                    e.stopPropagation()
                    navigate(`/papers/${paper.paper_id}/summary`)
                  }}
                >
                  Summary
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={e => {
                    e.stopPropagation()
                    navigate('/comparison', { state: { preselected: paper.paper_id } })
                  }}
                >
                  Compare
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
