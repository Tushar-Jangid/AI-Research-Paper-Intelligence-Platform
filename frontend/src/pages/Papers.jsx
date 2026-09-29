/**
 * pages/Papers.jsx — Paper library browser.
 */

import React, { useEffect, useState } from 'react'
import { papersApi } from '../services/api.js'
import PaperCard from '../components/PaperCard.jsx'
import PaperUpload from '../components/PaperUpload.jsx'

export default function Papers() {
  const [papers, setPapers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await papersApi.list()
      setPapers(data.papers || [])
    } catch { setPapers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = papers.filter(p =>
    !filter ||
    p.title?.toLowerCase().includes(filter.toLowerCase()) ||
    p.authors?.some(a => a.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Paper Library</h1>
        <p>Browse and manage your uploaded research papers.</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <PaperUpload onUploadSuccess={load} />
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          id="papers-filter-input"
          className="input"
          placeholder="Filter by title or author…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {filtered.length} of {papers.length} papers
        </span>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>{filter ? 'No matching papers' : 'No papers uploaded'}</h3>
          <p>{filter ? 'Try a different search term.' : 'Upload your first research paper above.'}</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(paper => (
            <PaperCard key={paper.paper_id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}
