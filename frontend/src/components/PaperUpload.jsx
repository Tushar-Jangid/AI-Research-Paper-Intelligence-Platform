/**
 * components/PaperUpload.jsx — Drag-and-drop PDF upload component.
 */

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { papersApi } from '../services/api.js'
import toast from 'react-hot-toast'

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
      setProgress(`Uploading "${file.name}"…`)
      try {
        const result = await papersApi.upload(file)
        toast.success(`"${result.title}" uploaded successfully!`)
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
        border: `2px dashed ${isDragActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: isDragActive
          ? 'rgba(59, 130, 246, 0.06)'
          : 'var(--bg-card)',
        transition: 'all var(--transition-base)',
        boxShadow: isDragActive ? 'var(--shadow-glow)' : 'none',
      }}
    >
      <input {...getInputProps()} disabled={uploading} />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{progress}</p>
        </div>
      ) : (
        <>
          <div style={{
            fontSize: '2.5rem', marginBottom: '1rem',
            filter: isDragActive ? 'none' : 'grayscale(0.3)',
          }}>
            {isDragActive ? '📂' : '📄'}
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {isDragActive ? 'Drop your papers here' : 'Upload Research Papers'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Drag &amp; drop PDF files, or click to browse
          </p>
          <span className="btn btn-primary">
            📎 Browse PDFs
          </span>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supported format: PDF · Multiple files allowed
          </p>
        </>
      )}
    </div>
  )
}
