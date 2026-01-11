import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './DonorDashboard.css'

const DonorDashboard = () => {
  const { user, requests, fetchRequests } = useApp()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDonations: 0,
    livesImpacted: 0,
    nextEligibleDate: null,
    donorScore: 100,
    thisMonthDonations: 0,
    monthStreak: 0,
    percentile: 'Top 50%'
  })
  const [nearbyRequests, setNearbyRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [donorProfile, setDonorProfile] = useState(null)
  const [donations, setDonations] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDonorData()
    }
  }, [user])

  const loadDonorData = async () => {
    try {
      setLoading(true)
      
      // Fetch donor statistics
      const statsRes = await api.get('/donations/stats')
      if (statsRes.data.success) {
        setStats(statsRes.data.stats)
      }

      // Fetch donation history
      const donationsRes = await api.get('/donations/my-donations')
      if (donationsRes.data.success) {
        setDonations(donationsRes.data.donations)
      }

      // Fetch achievements
      const achievementsRes = await api.get('/donations/achievements')
      if (achievementsRes.data.success) {
        setAchievements(achievementsRes.data.achievements)
      }

      // Fetch nearby requests
      const requestsRes = await api.get('/requests', {
        params: {
          status: 'Pending',
          bloodGroup: user.bloodGroup,
          city: user.city
        }
      })
      if (requestsRes.data.success) {
        setNearbyRequests(requestsRes.data.requests)
      }
    } catch (error) {
      console.error('Error loading donor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDonorScore = (donor) => {
    let score = 100
    score += (donor.totalDonations || 0) * 50
    if (donor.status === 'Verified') score += 100
    if (donor.isAvailable) score += 50
    return Math.min(score, 1000)
  }

  const handleRespond = async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/respond`)
      if (response.data.success) {
        alert('Your response has been recorded! The requester will contact you soon.')
        loadDonorData() // Reload data
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to respond to request')
    }
  }

  const daysUntilEligible = stats.nextEligibleDate 
    ? Math.ceil((new Date(stats.nextEligibleDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="donor-dashboard" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <div style={{color: 'white', fontSize: '24px'}}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="donor-dashboard">
      {/* Hero Section with Status */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="donor-status">
            <div className="status-badge verified">
              <span className="badge-icon">✓</span>
              Verified Donor
            </div>
            <h1 className="donor-name">Welcome back, {user?.name}! 🩸</h1>
            <p className="donor-subtitle">Your contribution matters. Lives are counting on you.</p>
          </div>
          
          <div className="eligibility-card">
            {daysUntilEligible <= 0 ? (
              <div className="eligible">
                <div className="eligibility-icon">✅</div>
                <h3>You're Eligible to Donate!</h3>
                <p>Your body has fully recovered. Ready to save lives?</p>
                <button className="btn-primary">Find Urgent Requests</button>
              </div>
            ) : (
              <div className="not-eligible">
                <div className="eligibility-icon">⏳</div>
                <h3>Next Donation in {daysUntilEligible} Days</h3>
                <p>Your body is recovering. Stay healthy!</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${100 - (daysUntilEligible / 90 * 100)}%`}}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Quick Stats Dashboard */}
        <div className="stats-grid">
          <div className="stat-card impact">
            <div className="stat-icon">❤️</div>
            <div className="stat-info">
              <h3>{stats.livesImpacted}</h3>
              <p>Lives Impacted</p>
            </div>
            <div className="stat-trend">+{stats.thisMonthDonations} this month</div>
          </div>
          
          <div className="stat-card donations">
            <div className="stat-icon">🩸</div>
            <div className="stat-info">
              <h3>{stats.totalDonations}</h3>
              <p>Total Donations</p>
            </div>
            <div className="stat-trend">Lifetime</div>
          </div>
          
          <div className="stat-card score">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>{stats.donorScore}</h3>
              <p>Donor Score</p>
            </div>
            <div className="stat-trend">{stats.percentile}</div>
          </div>
          
          <div className="stat-card streak">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <h3>{stats.monthStreak}</h3>
              <p>Month Streak</p>
            </div>
            <div className="stat-trend">Keep it up!</div>
          </div>
        </div>

        {/* Emergency Alerts Section */}
        <div className="emergency-section">
          <div className="section-header">
            <h2>🚨 Emergency Requests Near You</h2>
            <span className="live-indicator">
              <span className="pulse"></span> Live
            </span>
          </div>
          
          <div className="requests-container">
          {nearbyRequests.length === 0 ? (
            <div className="no-requests">
              <div className="no-requests-icon">✨</div>
              <h3>No Emergency Requests</h3>
              <p>Great news! No urgent requests in your area right now.</p>
            </div>
          ) : (
            nearbyRequests.slice(0, 3).map(request => (
              <div key={request._id} className="request-card emergency">
                <div className="request-header">
                  <div className="blood-type-badge">{request.bloodGroup}</div>
                  <div className={`urgency-badge ${request.urgency?.toLowerCase()}`}>
                    {request.urgency || 'NORMAL'}
                  </div>
                </div>
                <div className="request-body">
                  <h3>{request.hospitalName || request.location?.hospital || 'City Hospital'}</h3>
                  <div className="request-details">
                    <div className="detail">
                      <span className="detail-icon">📍</span>
                      <span>{request.location?.city || 'Nearby'}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-icon">🩸</span>
                      <span>{request.requiredUnits || request.unitsRequired || 2} Units Needed</span>
                    </div>
                    <div className="detail">
                      <span className="detail-icon">⏰</span>
                      <span>{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="request-note">{request.notes || 'Patient in need. Immediate help appreciated.'}</p>
                </div>
                <div className="request-actions">
                  <button className="btn-respond" onClick={() => handleRespond(request._id)}>
                    🚑 I Can Help
                  </button>
                  <button className="btn-share">Share</button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="achievements-section">
          <h2>🏆 Your Achievements</h2>
          <div className="achievements-grid">
          {achievements.slice(0, 4).map(achievement => (
            <div key={achievement.id} className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">{achievement.icon}</div>
              <h4>{achievement.title}</h4>
              <p>{achievement.unlocked ? achievement.description : `${achievement.progress}/${achievement.required} - ${achievement.description}`}</p>
            </div>
          ))}
          {achievements.length === 0 && (
            <div className="achievement locked">
              <div className="achievement-icon">🎖️</div>
              <h4>Start Your Journey</h4>
              <p>Make your first donation to unlock achievements</p>
            </div>
          )}
        </div>
        </div>

        {/* Donation History */}
        <div className="history-section">
          <h2>📊 Donation History</h2>
        <div className="timeline">
          {donations.length > 0 ? (
            donations.slice(0, 5).map(donation => (
              <div key={donation._id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">
                    {new Date(donation.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <h4>{donation.hospital}</h4>
                  <p>Donated {donation.quantity}ml • {donation.donationType}</p>
                  <span className={`timeline-badge ${donation.status.toLowerCase()}`}>
                    {donation.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="timeline-empty">
              <p>No donation history yet. Make your first donation to start saving lives!</p>
            </div>
          )}
        </div>
        </div>

        {/* Health Tips */}
        <div className="tips-section">
          <h2>💡 Health Tips for Donors</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">💧</div>
            <h4>Stay Hydrated</h4>
            <p>Drink plenty of water before and after donation</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🥗</div>
            <h4>Eat Iron-Rich Foods</h4>
            <p>Spinach, red meat, beans help recover faster</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">😴</div>
            <h4>Get Good Sleep</h4>
            <p>7-8 hours of sleep helps body recover</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default DonorDashboard
