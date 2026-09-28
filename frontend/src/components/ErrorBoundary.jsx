/**
 * components/ErrorBoundary.jsx — React Error Boundary for production stability.
 * Catches rendering errors and shows a graceful fallback UI.
 */

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: 560,
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>⚠️</div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
              An unexpected error occurred in the application.
              This has been noted. Please return to the dashboard and try again.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <summary style={{
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Error details
                </summary>
                <pre style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  overflow: 'auto',
                  maxHeight: 200,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              id="error-boundary-reset-btn"
              className="btn btn-primary btn-lg"
              onClick={this.handleReset}
            >
              ← Return to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
