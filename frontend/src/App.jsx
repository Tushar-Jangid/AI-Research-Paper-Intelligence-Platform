import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Papers from './pages/Papers.jsx'
import Search from './pages/Search.jsx'
import Summary from './pages/Summary.jsx'
import Comparison from './pages/Comparison.jsx'
import Citations from './pages/Citations.jsx'
import LiteratureReview from './pages/LiteratureReview.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <Routes>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/papers"              element={<Papers />} />
            <Route path="/search"              element={<Search />} />
            <Route path="/papers/:id/summary"  element={<Summary />} />
            <Route path="/comparison"          element={<Comparison />} />
            <Route path="/citations"           element={<Citations />} />
            <Route path="/literature-review"   element={<LiteratureReview />} />
            <Route path="*"                    element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
