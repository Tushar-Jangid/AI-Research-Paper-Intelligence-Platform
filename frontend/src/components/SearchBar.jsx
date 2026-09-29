/**
 * components/SearchBar.jsx — Semantic search input bar.
 */

import React, { useState } from 'react'

export default function SearchBar({ onSearch, loading, placeholder }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length >= 3) onSearch(query.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.75rem', width: '100%' }}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '1rem', top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '1rem',
        }}>🔍</span>
        <input
          id="semantic-search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder || 'Search by meaning, not just keywords…'}
          className="search-input"
          style={{ paddingLeft: '2.75rem' }}
          disabled={loading}
        />
      </div>
      <button
        id="semantic-search-btn"
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading || query.trim().length < 3}
        style={{ whiteSpace: 'nowrap' }}
      >
        {loading ? (
          <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Searching…</>
        ) : 'Search'}
      </button>
    </form>
  )
}
