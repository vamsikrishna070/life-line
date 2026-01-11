import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './RegisterDonor.css'

function RegisterDonor() {
  const navigate = useNavigate()
  const { addDonor, showNotification } = useApp()
  
  const [formData, setFormData] = useState({
    fullName: '',
    bloodGroup: '',
    phoneNumber: '',
    city: '',
    email: ''
  })

  const [errors, setErrors] = useState({})
  const [locationDetected, setLocationDetected] = useState(false)

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationDetected(true)
          showNotification('Location detected successfully!', 'success')
        },
        (error) => {
          showNotification('Unable to detect location. Please enter manually.', 'error')
        }
      )
    } else {
      showNotification('Geolocation is not supported by your browser.', 'error')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showNotification('Please fill in all required fields correctly', 'error')
      return
    }

    const donor = {
      name: formData.fullName,
      bloodGroup: formData.bloodGroup,
      phone: formData.phoneNumber,
      city: formData.city,
      email: formData.email
    }

    addDonor(donor)
    
    // Reset form
    setFormData({
      fullName: '',
      bloodGroup: '',
      phoneNumber: '',
      city: '',
      email: ''
    })
    setErrors({})
    setLocationDetected(false)
    
    // Redirect to home after 2 seconds
    setTimeout(() => {
      navigate('/')
    }, 2000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  return (
    <div className="register-donor-page">
      <div className="register-container">
        <div className="hero-section">
          <h1 className="hero-title">
            Be the <span className="hero-highlight">hero</span>
          </h1>
          <h1 className="hero-title">someone needs.</h1>
          
          <p className="hero-description">
            Your donation can save up to 3 lives. Join our community of over 5,000 donors making a difference every day.
          </p>

          <div className="benefits-list">
            <div className="benefit-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#fce4ec"/>
                <path d="M9 12l2 2 4-4" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Get notified of emergency requests nearby</span>
            </div>
            
            <div className="benefit-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#fce4ec"/>
                <path d="M9 12l2 2 4-4" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Track your donation history</span>
            </div>
            
            <div className="benefit-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#fce4ec"/>
                <path d="M9 12l2 2 4-4" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Connect with a community of lifesavers</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-card">
            <div className="form-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E91E63"/>
              </svg>
              <h2 className="form-title">Donor Registration</h2>
            </div>
            <p className="form-subtitle">Fill out your details to join the donor network.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="John Doe"
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group *</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className={`form-input ${errors.bloodGroup ? 'error' : ''}`}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  {errors.bloodGroup && <span className="error-message">{errors.bloodGroup}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <div className="city-input-group">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`form-input ${errors.city ? 'error' : ''}`}
                    placeholder="New York"
                  />
                  <button 
                    type="button" 
                    className="detect-location-btn"
                    onClick={detectLocation}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                    </svg>
                    Detect
                  </button>
                </div>
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              {locationDetected && (
                <div className="location-message">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4caf50"/>
                  </svg>
                  <span>Location detected successfully</span>
                </div>
              )}

              <button type="submit" className="submit-btn">
                Register Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterDonor
