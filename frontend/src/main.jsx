import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            fontFamily: "var(--font-sans)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
            backdropFilter: "blur(12px)",
          },
          success: { iconTheme: { primary: 'var(--accent-green)', secondary: '#ffffff' } },
          error:   { iconTheme: { primary: 'var(--accent-red)', secondary: '#ffffff' } },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>,
)
