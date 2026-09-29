/**
 * components/CitationGraph.jsx — Interactive citation network visualization.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { IconCitations, IconExternalLink } from './Icons.jsx'

export default function CitationGraph({ nodes = [], edges = [], onNodeClick }) {
  const [tooltip, setTooltip] = useState(null)
  const fgRef = useRef()

  // Build graph data
  const graphData = {
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.title || n.id,
      authors: n.authors || [],
      year: n.year,
      color: n.isFocal ? '#ec4899' : '#6366f1',
    })),
    links: edges.map(e => ({
      source: e.source,
      target: e.target,
    })),
  }

  // Lazy import ForceGraph
  const [ForceGraph, setForceGraph] = useState(null)

  useEffect(() => {
    import('react-force-graph-2d').then(mod => setForceGraph(() => mod.default))
  }, [])

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400)
  }

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400)
  }

  const handleCenter = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 50)
  }

  if (!ForceGraph) {
    return (
      <div
        style={{
          height: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        height: 580,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Legend & Instructions */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Indexed Papers</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Click nodes to focus · Scroll to zoom · Drag canvas
        </div>
      </div>

      {/* Control Dock (Zoom / Center) */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          gap: '0.4rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-pill)',
          padding: '0.35rem 0.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ width: 30, height: 30, padding: 0 }}
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ width: 30, height: 30, padding: 0 }}
        >
          −
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleCenter}
          title="Reset View"
          style={{ padding: '0 0.5rem', fontSize: '0.75rem' }}
        >
          Reset
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            background: 'var(--bg-elevated)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.1rem',
            fontSize: '0.82rem',
            color: 'var(--text-primary)',
            maxWidth: 280,
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
            {tooltip.name}
          </div>
          {tooltip.authors?.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
              {tooltip.authors.slice(0, 2).join(', ')}
            </div>
          )}
          {tooltip.year && (
            <span className="badge badge-blue" style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>
              Year: {tooltip.year}
            </span>
          )}
        </div>
      )}

      <ForceGraph
        ref={fgRef}
        graphData={graphData}
        nodeLabel=""
        nodeColor={node => node.color}
        nodeRelSize={9}
        linkColor={() => 'rgba(99, 102, 241, 0.4)'}
        linkWidth={1.8}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        backgroundColor="transparent"
        onNodeClick={node => onNodeClick?.(node)}
        onNodeHover={(node, event) => {
          if (node && event) {
            setTooltip({ ...node, x: event.clientX, y: event.clientY })
          } else {
            setTooltip(null)
          }
        }}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name?.length > 24
            ? node.name.slice(0, 24) + '…'
            : node.name || ''
          const fontSize = Math.max(10, 13 / globalScale)
          ctx.font = `600 ${fontSize}px Plus Jakarta Sans, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = 'rgba(240, 246, 255, 0.9)'
          ctx.fillText(label, node.x, node.y + 14)
        }}
      />
    </div>
  )
}
