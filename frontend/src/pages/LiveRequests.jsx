import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import './LiveRequests.css'

function LiveRequests() {
  const { requests, addRequest, updateRequestStatus, showNotification } = useApp()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    bloodGroup: '',
    location: '',
    patientName: '',
    hospitalName: '',
    contactPhone: '',
    urgency: 'Urgent'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.bloodGroup || !formData.location || !formData.patientName || !formData.contactPhone) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    addRequest(formData)
    setFormData({
      bloodGroup: '',
      location: '',
      patientName: '',
      hospitalName: '',
      contactPhone: '',
      urgency: 'Urgent'
    })
    setShowRequestForm(false)
  }

  const getTimeAgo = (isoTime) => {
    const now = new Date()
    const requestTime = new Date(isoTime)
    const diffMs = now - requestTime
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `about ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'just now'
  }

  const handleShare = (request) => {
    const shareText = `Urgent Blood Need: ${request.bloodGroup} needed in ${request.location}. Contact: ${request.contactPhone}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Blood Request',
        text: shareText
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText)
      showNotification('Request details copied to clipboard!', 'success')
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'Pending')

  return (
    <div className="live-requests-page">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Live Requests</h1>
          <p className="page-subtitle">Real-time emergency blood requests from the community.</p>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="no-requests">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#e0e0e0"/>
            </svg>
            <p>No pending blood requests at the moment</p>
          </div>
        ) : (
          <div className="requests-list">
            {pendingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <span className="blood-badge">{request.bloodGroup} Needed</span>
                  <span className="request-time">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#999"/>
                    </svg>
                    {getTimeAgo(request.time)}
                  </span>
                </div>

                <div className="request-details">
                  <div className="request-location">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/>
                    </svg>
                    {request.location}
                  </div>

                  {request.hospitalName && (
                    <div className="request-hospital">
                      <strong>Hospital:</strong> {request.hospitalName}
                    </div>
                  )}

                  {request.patientName && (
                    <div className="request-patient">
                      <strong>Patient:</strong> {request.patientName}
                    </div>
                  )}

                  <div className="request-status">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#666"/>
                    </svg>
                    Status: <span className={`status-${request.status.toLowerCase()}`}>{request.status}</span>
                    {request.urgency && <span className="urgency-badge">{request.urgency}</span>}
                  </div>
                </div>

                <div className="request-actions">
                  <button 
                    className="btn-share"
                    onClick={() => handleShare(request)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/>
                    </svg>
                    Share
                  </button>
                  <a 
                    href={`tel:${request.contactPhone}`}
                    className="btn-contact"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="white"/>
                    </svg>
                    Contact
                  </a>
                  <button 
                    className="btn-fulfill"
                    onClick={() => updateRequestStatus(request.id, 'Fulfilled')}
                  >
                    Mark as Fulfilled
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        className="request-blood-btn" 
        onClick={() => setShowRequestForm(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
        </svg>
        Request Blood
      </button>

      {showRequestForm && (
        <div className="modal-overlay" onClick={() => setShowRequestForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Blood Request</h2>
              <button 
                className="modal-close"
                onClick={() => setShowRequestForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="City or hospital location"
                  required
                />
              </div>

              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  placeholder="Patient's name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Hospital Name</label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                  placeholder="Hospital name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Contact Phone *</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  placeholder="+91 xxxxxxxxxx"
                  required
                />
              </div>

              <div className="form-group">
                <label>Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option>Critical</option>
                  <option>Urgent</option>
                  <option>Normal</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Post Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveRequests
