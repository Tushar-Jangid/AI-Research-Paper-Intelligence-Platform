import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0f1a2e',
          color: '#f0f6ff',
          border: '1px solid rgba(56,139,253,0.2)',
          fontFamily: "'Inter', sans-serif",
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#f0f6ff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#f0f6ff' } },
      }}
    />
  </React.StrictMode>,
)
