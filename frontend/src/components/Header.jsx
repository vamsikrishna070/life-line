import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Header.css'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useApp()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Don't show header on login/register pages or dashboard pages (they have their own headers)
  if (
    location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname === '/admin' ||
    location.pathname === '/donor-dashboard' ||
    location.pathname === '/patient-dashboard' ||
    location.pathname === '/hospital-dashboard'
  ) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E91E63"/>
          </svg>
          <span className="logo-text">
            Life<span className="logo-line">Line</span>
          </span>
        </Link>

        <nav className="nav">
          {user?.type === 'donor' ? (
            <>
              <Link 
                to="/donor-dashboard" 
                className={`nav-btn ${location.pathname === '/donor-dashboard' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                </svg>
                Dashboard
              </Link>

              <Link 
                to="/requests" 
                className={`nav-btn ${location.pathname === '/requests' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                Live Requests
              </Link>
            </>
          ) : user?.type === 'patient' ? (
            <Link 
              to="/patient-dashboard" 
              className={`nav-btn ${location.pathname === '/patient-dashboard' ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
              </svg>
              Dashboard
            </Link>
          ) : user?.type === 'hospital' ? (
            <Link 
              to="/hospital-dashboard" 
              className={`nav-btn ${location.pathname === '/hospital-dashboard' ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
              </svg>
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/find-donors" 
                className={`nav-btn ${location.pathname === '/find-donors' || location.pathname === '/' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                </svg>
                Find Donors
              </Link>

              <Link 
                to="/requests" 
                className={`nav-btn ${location.pathname === '/requests' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                Live Requests
              </Link>
            </>
          )}

          {user?.type === 'admin' && (
            <Link 
              to="/admin" 
              className={`nav-btn ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor"/>
              </svg>
              Admin Panel
            </Link>
          )}
        </nav>

        {user && (
          <div className="user-section">
            <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                {user.status && (
                  <span className={`user-status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                )}
              </div>
            </div>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <p className="user-email">{user.email}</p>
                  {user.bloodGroup && (
                    <span className="blood-badge">{user.bloodGroup}</span>
                  )}
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
