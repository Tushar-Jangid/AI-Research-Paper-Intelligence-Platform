/**
 * components/SearchBar.jsx — Semantic search input bar.
 */

import React, { useState } from 'react'
import { IconSearch, IconClose } from './Icons.jsx'

export default function SearchBar({ onSearch, loading, placeholder, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length >= 3) onSearch(query.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.75rem', width: '100%' }}
    >
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            left: '1.2rem',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconSearch size={20} color="var(--accent-bright)" />
        </span>

        <input
          id="semantic-search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder || 'Search papers by conceptual meaning (e.g. transformer attention in medical imaging)…'}
          className="search-input"
          style={{ paddingLeft: '3.1rem', paddingRight: query ? '2.5rem' : '1.2rem' }}
          disabled={loading}
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      <button
        id="semantic-search-btn"
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading || query.trim().length < 3}
        style={{ whiteSpace: 'nowrap' }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            <span>Analyzing Embeddings…</span>
          </>
        ) : (
          <>
            <IconSearch size={18} />
            <span>Search Meaning</span>
          </>
        )}
      </button>
    </form>
  )
}
