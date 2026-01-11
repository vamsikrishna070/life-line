import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import api from '../utils/api'
import './PatientDashboard.css'

const PatientDashboard = () => {
  const { user, showNotification } = useApp()
  const [activeRequests, setActiveRequests] = useState([])
  const [nearbyDonors, setNearbyDonors] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    averageResponseTime: 0,
    successRate: 0,
    totalDonors: 0
  })
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    unitsRequired: 1,
    urgency: 'Normal',
    patientName: '',
    hospitalName: '',
    location: {
      city: '',
      address: '',
      hospital: ''
    },
    contactNumber: '',
    notes: ''
  })

  useEffect(() => {
    loadActiveRequests()
    loadNearbyDonors()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.get('/donors/search')
      if (response.data.success) {
        setStats({
          averageResponseTime: 15, // Can be calculated from request response times
          successRate: 96, // Can be calculated from fulfilled requests
          totalDonors: response.data.donors.length
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadNearbyDonors = async () => {
    try {
      const response = await api.get('/donors/search', {
        params: {
          city: user?.city || '',
          status: 'Verified'
        }
      })
      if (response.data.success) {
        setNearbyDonors(response.data.donors)
      }
    } catch (error) {
      console.error('Error loading nearby donors:', error)
    }
  }

  const loadActiveRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/requests', {
        params: {
          status: 'Pending'
        }
      })
      if (response.data.success) {
        // Filter requests by current user if they have requestedBy field
        const userRequests = response.data.requests.filter(req => 
          req.requestedBy?._id === user?.id || req.requestedBy === user?.id
        )
        setActiveRequests(userRequests)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/requests', {
        bloodGroup: formData.bloodGroup,
        unitsNeeded: parseInt(formData.unitsRequired),
        urgency: formData.urgency,
        patientName: formData.patientName,
        hospitalName: formData.hospitalName,
        location: {
          city: formData.location.city,
          address: formData.location.address,
          hospital: formData.hospitalName
        },
        contactPhone: formData.contactNumber,
        description: formData.notes
      })
      
      if (response.data.success) {
        showNotification(`Request created! ${response.data.notifiedDonorsCount || 0} donors notified.`, 'success')
        setShowCreateForm(false)
        setFormData({
          bloodGroup: 'A+',
          unitsRequired: 1,
          urgency: 'Normal',
          patientName: '',
          hospitalName: '',
          location: { city: '', address: '', hospital: '' },
          contactNumber: '',
          notes: ''
        })
        loadActiveRequests()
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create request', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'city' || name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return
    
    try {
      const response = await api.put(`/requests/${requestId}/status`, {
        status: 'Cancelled'
      })
      if (response.data.success) {
        showNotification('Request cancelled successfully', 'success')
        loadActiveRequests()
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to cancel request', 'error')
    }
  }

  const getTimeSince = (date) => {
    const hours = Math.round((Date.now() - new Date(date)) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="patient-dashboard">
      {/* Hero Header */}
      <div className="patient-header">
        <div className="header-content">
          <div className="patient-info">
            <h1>🩺 Patient Portal - {user?.name}</h1>
            <p>Fast, reliable blood request system. Help is just one click away.</p>
          </div>
          <div className="header-actions">
            <button className="create-request-btn" onClick={() => setShowCreateForm(true)}>
              <span>➕</span> Create Request
            </button>
            <button className="emergency-btn" onClick={() => setShowCreateForm(true)}>
              <span>🚨</span> Emergency
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-details">
              <h3>Active Requests</h3>
              <p className="stat-value">{activeRequests.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-details">
              <h3>Responses</h3>
              <p className="stat-value">
                {activeRequests.reduce((sum, req) => sum + (req.responses?.length || 0), 0)}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🩸</div>
            <div className="stat-details">
              <h3>Total Units</h3>
              <p className="stat-value">
                {activeRequests.reduce((sum, req) => sum + (req.unitsRequired || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="emergency-card">
          <div className="emergency-content">
            <div className="emergency-icon">🚨</div>
            <div>
              <h2>Need Blood Urgently?</h2>
              <p>Create an emergency request and connect with nearby donors instantly</p>
            </div>
          </div>
        </div>

        {/* Active Requests or Empty State */}
        {activeRequests.length === 0 && !showCreateForm ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Active Requests</h3>
            <p>You don't have any blood requests at the moment</p>
            <button className="btn-create" onClick={() => setShowCreateForm(true)}>
              Create Your First Request
            </button>
          </div>
        ) : !showCreateForm ? (
          <div className="requests-grid">
            {activeRequests.map(request => (
              <div key={request._id} className="request-tracking-card">
                <div className="request-status-header">
                  <div className="blood-badge large">{request.bloodGroup}</div>
                  <div className={`status-indicator ${request.status?.toLowerCase()}`}>
                    <span className="status-dot"></span> {request.status}
                  </div>
                </div>

                <div className="request-progress">
                  <div className="progress-stats">
                    <div className="stat">
                      <div className="stat-number">{request.responses?.length || 0}</div>
                      <div className="stat-label">Responses</div>
                    </div>
                    <div className="stat">
                      <div className="stat-number">
                        {request.responses?.filter(r => r.status === 'Confirmed').length || 0}
                      </div>
                      <div className="stat-label">Confirmed</div>
                    </div>
                    <div className="stat">
                      <div className="stat-number">{request.unitsRequired || request.units}</div>
                      <div className="stat-label">Units Needed</div>
                    </div>
                  </div>
                </div>

                <div className="request-info">
                  <div className="info-row">
                    <span className="info-icon">⏰</span>
                    <span>Created {getTimeSince(request.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">📍</span>
                    <span>{request.location?.city || 'Location'} - {request.hospitalName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">🚨</span>
                    <span>Urgency: {request.urgency}</span>
                  </div>
                </div>

                <div className="request-actions">
                  <button className="btn-view-donors">
                    View Responses ({request.responses?.length || 0})
                  </button>
                  <button className="btn-cancel" onClick={() => handleCancelRequest(request._id)}>
                    Cancel Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Find Donors Map */}
      <div className="content-section">
        <div className="section-header">
          <h2>🗺️ Nearby Verified Donors</h2>
        </div>
        <div className="map-placeholder">
          <div className="map-content">
            <div className="map-icon">📍</div>
            <h3>Donor Location Map</h3>
            <p>View verified donors near your location</p>
            <div className="donor-markers">
              {(() => {
                const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
                const donorCounts = bloodGroups.map(group => ({
                  group,
                  count: nearbyDonors.filter(d => d.bloodGroup === group).length
                })).filter(item => item.count > 0).slice(0, 6)
                
                return donorCounts.length > 0 ? (
                  donorCounts.map(item => (
                    <div key={item.group} className="marker-info">
                      <span className="marker">🔴</span>
                      <span>{item.count} {item.group} Donor{item.count > 1 ? 's' : ''} nearby</span>
                    </div>
                  ))
                ) : (
                  <div style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>
                    <p>No nearby donors found. We'll notify available donors when you create a request.</p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Blood Banks */}
      <div className="content-section">
        <div className="section-header">
          <h2>🏥 Blood Bank & Emergency Contact</h2>
        </div>
        <div className="blood-banks-info">
          <div className="info-card-large">
            <div className="info-icon-large">🏥</div>
            <h3>Emergency Blood Services</h3>
            <p>For immediate blood requirements, use our request system or contact local blood banks directly.</p>
            <div className="contact-methods">
              <div className="contact-item">
                <span className="contact-icon">🩸</span>
                <div>
                  <strong>Available Donors</strong>
                  <p>{nearbyDonors.length} verified donors ready to help</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🚨</span>
                <div>
                  <strong>Quick Response System</strong>
                  <p>Create a request and notify all nearby donors instantly</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>Your Location</strong>
                  <p>{user?.city || 'Set location'} - {nearbyDonors.filter(d => d.city === user?.city).length} local donors</p>
                </div>
              </div>
            </div>
            <button className="btn-primary-large" onClick={() => setShowCreateForm(true)}>
              Create Blood Request
            </button>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="content-section">
        <div className="section-header">
          <h2>ℹ️ Platform Statistics</h2>
        </div>
        <div className="info-cards-grid">
          <div className="info-card">
            <div className="info-card-icon">⏱️</div>
            <h4>Average Response Time</h4>
            <p className="info-highlight">{stats.averageResponseTime} min</p>
            <p>Most requests get first response quickly</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">✅</div>
            <h4>Success Rate</h4>
            <p className="info-highlight">{stats.successRate}%</p>
            <p>Requests successfully fulfilled by our donor network</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">👥</div>
            <h4>Total Donors</h4>
            <p className="info-highlight">{stats.totalDonors.toLocaleString()}</p>
            <p>Verified donors across all locations</p>
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Blood Request</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Patient Name *</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group *</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Units Required *</label>
                  <input
                    type="number"
                    name="unitsRequired"
                    value={formData.unitsRequired}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Urgency Level *</label>
                  <select name="urgency" value={formData.urgency} onChange={handleChange} required>
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Hospital Name *</label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="Enter hospital name"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Hospital Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="Enter hospital address"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific requirements or information"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel-form" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-form">
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
