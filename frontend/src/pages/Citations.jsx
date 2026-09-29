/**
 * pages/Citations.jsx — Interactive citation network page.
 */

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import CitationGraph from '../components/CitationGraph.jsx'
import toast from 'react-hot-toast'

export default function Citations() {
  const location = useLocation()
  const [papers, setPapers]     = useState([])
  const [selected, setSelected] = useState(location.state?.paperId || '')
  const [network, setNetwork]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [clickedNode, setClickedNode] = useState(null)

  useEffect(() => {
    papersApi.list().then(d => setPapers(d.papers || [])).catch(() => {})
  }, [])

  const loadNetwork = async (paperId) => {
    setLoading(true)
    setNetwork(null)
    try {
      const data = await papersApi.getCitations(paperId)
      setNetwork(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selected) loadNetwork(selected)
  }, [selected])

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Citation Network</h1>
        <p>Explore citation relationships between papers interactively. Click nodes to inspect.</p>
      </div>

      {/* Paper selector */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          Select a Paper
        </label>
        <select
          id="citation-paper-select"
          className="input"
          value={selected}
          onChange={e => { setSelected(e.target.value); setClickedNode(null) }}
          style={{ maxWidth: 500 }}
        >
          <option value="">— Choose a paper —</option>
          {papers.map(p => (
            <option key={p.paper_id} value={p.paper_id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {network && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Nodes',       value: network.statistics?.num_nodes ?? network.nodes.length },
            { label: 'Edges',       value: network.statistics?.num_edges ?? network.edges.length },
            { label: 'Outgoing',    value: network.statistics?.focal_out_degree ?? 0 },
            { label: 'Incoming',    value: network.statistics?.focal_in_degree  ?? 0 },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ minWidth: 120, flex: 1 }}>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Graph */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
        </div>
      )}

      {!selected && !loading && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🕸️</div>
          <h3>Select a paper above</h3>
          <p>The citation graph will appear here.</p>
        </div>
      )}

      {network && !loading && (
        <>
          <CitationGraph
            nodes={network.nodes}
            edges={network.edges}
            onNodeClick={setClickedNode}
          />

          {/* Node info panel */}
          {clickedNode && (
            <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem', animation: 'slideInRight 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{clickedNode.name}</h4>
                <button className="btn btn-ghost btn-sm" onClick={() => setClickedNode(null)}>✕</button>
              </div>
              {clickedNode.authors?.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {clickedNode.authors.slice(0, 3).join(', ')}
                </p>
              )}
              {clickedNode.year && (
                <span className="badge badge-cyan" style={{ marginTop: '0.5rem' }}>
                  {clickedNode.year}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
