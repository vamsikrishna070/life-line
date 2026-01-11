import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading } = useApp()
  
  const [userType, setUserType] = useState('donor')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleUserTypeChange = (type) => {
    setUserType(type)
    setFormData({ email: '', password: '' })
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      setErrors({ email: 'Email is required' })
      return
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    if (!formData.password) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' })
      return
    }

    const result = await login(formData.email, formData.password, userType)
    
    if (result.success) {
      // Redirect based on user type
      if (userType === 'admin') {
        navigate('/admin')
      } else if (userType === 'donor') {
        navigate('/donor-dashboard')
      } else if (userType === 'patient') {
        navigate('/patient-dashboard')
      } else {
        // Fallback to donor dashboard
        navigate('/donor-dashboard')
      }
    }
  }

  return (
    <div className="login-container-new">
      <div className="animated-background">
        <div className="blood-drop drop-1">🩸</div>
        <div className="blood-drop drop-2">🩸</div>
        <div className="blood-drop drop-3">🩸</div>
        <div className="blood-drop drop-4">🩸</div>
        <div className="blood-drop drop-5">🩸</div>
      </div>
      
      <div className="login-left">
        <div className="brand-section">
          <div className="brand-header">
            <div className="pulse-icon">💉</div>
            <div>
              <h1 className="brand-name">LifeLine</h1>
              <p className="brand-tagline">Connecting Lives, Saving Futures</p>
            </div>
          </div>
          
          <div className="hero-content">
            <h2 className="hero-title">
              Every <span className="gradient-text">Drop</span> Counts.<br />
              Every <span className="gradient-text">Second</span> Matters.
            </h2>
            
            <p className="hero-subtitle">
              Join 10,000+ heroes making a difference in real-time
            </p>
          </div>

          <div className="features-carousel">
            <div className="feature-badge">
              <span className="badge-icon">⚡</span> Instant Alerts
            </div>
            <div className="feature-badge">
              <span className="badge-icon">🛡️</span> Verified Network
            </div>
            <div className="feature-badge">
              <span className="badge-icon">📍</span> Location-Based
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="glass-card">
          <div className="card-glow"></div>
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title">Welcome Back 👋</h2>
              <p className="form-subtitle">Choose your role and sign in securely</p>
            </div>

            <div className="user-type-tabs">
            <button 
              className={`user-tab ${userType === 'donor' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('donor')}
            >
              DONOR
            </button>
            <button 
              className={`user-tab ${userType === 'patient' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('patient')}
            >
              PATIENT
            </button>
            <button 
              className={`user-tab ${userType === 'admin' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('admin')}
            >
              ADMIN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form-new">
            <div className="form-group-new">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@gmail.com"
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group-new">
              <label htmlFor="password">PASSWORD</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'error' : ''}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className="secure-login-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Authenticating...
                </span>
              ) : (
                <span>🔐 Secure Login</span>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="form-footer">
            <p>New to LifeLink? <Link to="/register" className="create-account-link">Create Account →</Link></p>
            <div className="trust-badges">
              <span className="trust-badge">🔒 256-bit Encrypted</span>
              <span className="trust-badge">✓ Verified Platform</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
