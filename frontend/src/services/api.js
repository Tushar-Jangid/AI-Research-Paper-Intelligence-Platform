/**
 * services/api.js — Axios-based API client for the Research Platform backend.
 *
 * All API calls go through this file.
 * Person 4 (Frontend Developer) owns this file.
 *
 * Base URL: /api (proxied to FastAPI backend by Vite dev server)
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Papers API ───────────────────────────────────────────────
export const papersApi = {
  /** Upload a PDF file */
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** List all papers */
  list: () => api.get('/papers'),

  /** Get paper details */
  get: (paperId) => api.get(`/papers/${paperId}`),

  /** Get paper summary */
  getSummary: (paperId) => api.get(`/papers/${paperId}/summary`),

  /** Get paper citations */
  getCitations: (paperId) => api.get(`/papers/${paperId}/citations`),
}

// ── Search API ───────────────────────────────────────────────
export const searchApi = {
  /** Semantic search across all papers */
  search: (query, topK = 10) =>
    api.post('/search', { query, top_k: topK }),
}

// ── Comparison API ───────────────────────────────────────────
export const comparisonApi = {
  /** Compare multiple papers */
  compare: (paperIds) =>
    api.post('/comparison', { paper_ids: paperIds }),
}

// ── Literature Review API ────────────────────────────────────
export const reviewApi = {
  /** Generate literature review */
  generate: (paperIds, title) =>
    api.post('/literature-review', { paper_ids: paperIds, title }),
}

export default api
