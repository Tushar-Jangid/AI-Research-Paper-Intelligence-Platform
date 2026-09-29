/**
 * components/PaperUpload.jsx — Drag-and-drop PDF upload component.
 */

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { papersApi } from '../services/api.js'
import toast from 'react-hot-toast'
import { IconUpload, IconSparkles, IconCheck } from './Icons.jsx'

export default function PaperUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const pdfFiles = acceptedFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'))
    if (!pdfFiles.length) {
      toast.error('Only PDF files are supported.')
      return
    }

    for (const file of pdfFiles) {
      setUploading(true)
      setProgress(`Extracting sections & indexing "${file.name}"…`)
      try {
        const result = await papersApi.upload(file)
        toast.success(`"${result.title || file.name}" indexed successfully!`)
        onUploadSuccess?.(result)
      } catch (err) {
        toast.error(`Upload failed: ${err.message}`)
      } finally {
        setUploading(false)
        setProgress(null)
      }
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      id="paper-upload-dropzone"
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent-bright)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: isDragActive ? 'var(--accent-glow-subtle)' : 'var(--bg-card)',
        transition: 'all var(--transition-base)',
        boxShadow: isDragActive ? 'var(--shadow-glow)' : 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input {...getInputProps()} disabled={uploading} />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
              Analyzing Research Paper
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{progress}</p>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-glow-subtle)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--accent-bright)',
              transition: 'transform var(--transition-base)',
              transform: isDragActive ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <IconUpload size={30} />
          </div>

          <h3 style={{ marginBottom: '0.4rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
            {isDragActive ? 'Drop your PDF papers here' : 'Upload Research Papers'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            Drag &amp; drop PDF files to extract sections, generate vector embeddings, and enable deep semantic search.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="btn btn-primary">
              <IconUpload size={16} /> Select PDF Document
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            {['Format: PDF', 'Sections Auto-Extracted', 'SBERT Vectorized', 'Grounded Summaries'].map(badge => (
              <span
                key={badge}
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
