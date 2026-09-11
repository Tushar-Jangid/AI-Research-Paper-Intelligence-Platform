/**
 * components/CitationGraph.jsx — Interactive citation network visualization.
 *
 * Uses react-force-graph-2d for D3-powered interactive graph.
 * Features: zoom, pan, click nodes, hover tooltips.
 */

import React, { useCallback, useRef, useState } from 'react'

export default function CitationGraph({ nodes = [], edges = [], onNodeClick }) {
  const [tooltip, setTooltip] = useState(null)

  // Build graph data for react-force-graph
  const graphData = {
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.title || n.id,
      authors: n.authors || [],
      year: n.year,
      color: '#3b82f6',
    })),
    links: edges.map(e => ({
      source: e.source,
      target: e.target,
    })),
  }

  // Lazy import ForceGraph (bundle optimization)
  const [ForceGraph, setForceGraph] = React.useState(null)

  React.useEffect(() => {
    import('react-force-graph-2d').then(mod => setForceGraph(() => mod.default))
  }, [])

  if (!ForceGraph) {
    return (
      <div style={{
        height: 500, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      height: 550,
    }}>
      {/* Legend */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        background: 'rgba(5,10,20,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.6rem 0.9rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
          Paper node
        </div>
        <div style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}>
          Click nodes to view · Drag to explore
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: tooltip.y + 10, left: tooltip.x + 10,
          background: 'rgba(5,10,20,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          maxWidth: 260,
          pointerEvents: 'none',
          zIndex: 20,
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{tooltip.name}</div>
          {tooltip.authors?.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {tooltip.authors.slice(0,2).join(', ')}
            </div>
          )}
          {tooltip.year && (
            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              {tooltip.year}
            </div>
          )}
        </div>
      )}

      <ForceGraph
        graphData={graphData}
        nodeLabel=""
        nodeColor={node => node.color}
        nodeRelSize={8}
        linkColor={() => 'rgba(56,139,253,0.35)'}
        linkWidth={1.5}
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
          const label = node.name?.length > 20
            ? node.name.slice(0, 20) + '…'
            : node.name || ''
          const fontSize = Math.max(10, 13 / globalScale)
          ctx.font = `600 ${fontSize}px Inter, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = 'rgba(240,246,255,0.85)'
          ctx.fillText(label, node.x, node.y + 12)
        }}
      />
    </div>
  )
}
