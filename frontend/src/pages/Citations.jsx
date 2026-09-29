/**
 * pages/Citations.jsx — Interactive citation network page.
 */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { papersApi } from '../services/api.js'
import CitationGraph from '../components/CitationGraph.jsx'
import toast from 'react-hot-toast'
import {
  IconCitations,
  IconPapers,
  IconArrowRight,
  IconSparkles,
} from '../components/Icons.jsx'

export default function Citations() {
  const location = useLocation()
  const navigate = useNavigate()
  const [papers, setPapers]           = useState([])
  const [selected, setSelected]       = useState(location.state?.paperId || '')
  const [network, setNetwork]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [clickedNode, setClickedNode] = useState(null)

  useEffect(() => {
    papersApi.list().then(d => {
      const list = d.papers || []
      setPapers(list)
      if (!selected && list.length > 0) {
        setSelected(list[0].paper_id)
      }
    }).catch(() => {})
  }, [])

  const loadNetwork = async (paperId) => {
    setLoading(true)
    setNetwork(null)
    setClickedNode(null)
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
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-cyan">
            <IconCitations size={12} /> Graph Analytics
          </span>
        </div>
        <h1 style={{ marginBottom: '0.4rem' }}>Citation Relationship Network</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Visualize inter-paper citations, reference clusters, and influence propagation interactively.
        </p>
      </div>

      {/* Paper selector & Meta Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 280, maxWidth: 550 }}>
          <label
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Focal Research Paper
          </label>
          <select
            id="citation-paper-select"
            className="input"
            value={selected}
            onChange={e => { setSelected(e.target.value); setClickedNode(null) }}
          >
            <option value="">— Select focal paper to center graph —</option>
            {papers.map(p => (
              <option key={p.paper_id} value={p.paper_id}>
                {p.title} ({p.year || 'n.d.'})
              </option>
            ))}
          </select>
        </div>

        {/* Network Metrics pills */}
        {network && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Nodes',    value: network.statistics?.num_nodes ?? network.nodes?.length ?? 0 },
              { label: 'Edges',    value: network.statistics?.num_edges ?? network.edges?.length ?? 0 },
              { label: 'Outgoing', value: network.statistics?.focal_out_degree ?? 0 },
              { label: 'Incoming', value: network.statistics?.focal_in_degree ?? 0 },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.95rem',
                  textAlign: 'center',
                  minWidth: 75,
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-bright)', fontFamily: 'var(--font-heading)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '1rem' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Simulating force layout physics…</div>
        </div>
      )}

      {/* Empty State */}
      {!selected && !loading && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">
            <IconCitations size={32} />
          </div>
          <h3>Select a focal paper</h3>
          <p>Choose any research paper from the dropdown to construct its citation tree.</p>
        </div>
      )}

      {/* Network Graph Visualizer */}
      {network && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
          <CitationGraph
            nodes={network.nodes || []}
            edges={network.edges || []}
            onNodeClick={node => setClickedNode(node)}
          />

          {/* Node Inspector Bar */}
          {clickedNode && (
            <div
              className="glass-card"
              style={{
                padding: '1.5rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                border: '1px solid var(--accent-primary)',
                animation: 'fadeInUp 0.2s ease',
              }}
            >
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.4rem', fontSize: '0.7rem' }}>
                  Focused Node
                </span>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {clickedNode.name}
                </h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {clickedNode.authors?.slice(0, 3).join(', ')} {clickedNode.year && `• ${clickedNode.year}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/papers/${clickedNode.id}/summary`)}
                >
                  View Paper Summary <IconArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
