import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import api from '../utils/api'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user, showNotification } = useApp()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDonors: 0,
    totalRequests: 0,
    successRate: 0
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [allDonors, setAllDonors] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch admin dashboard stats
      const dashboardRes = await api.get('/admin/dashboard')
      if (dashboardRes.data.success) {
        const data = dashboardRes.data.stats
        setStats({
          totalUsers: data.totalDonors || 0,
          activeDonors: data.verifiedDonors || 0,
          totalRequests: data.totalRequests || 0,
          successRate: data.totalRequests > 0 
            ? Math.round((data.fulfilledRequests / data.totalRequests) * 100) 
            : 0
        })
        
        // Set recent activity from dashboard data
        const activities = []
        if (data.recentDonors) {
          data.recentDonors.forEach(donor => {
            activities.push({
              id: donor._id,
              action: 'New donor registered',
              user: donor.name,
              time: new Date(donor.createdAt).toLocaleString(),
              type: 'registration'
            })
          })
        }
        if (data.recentRequests) {
          data.recentRequests.forEach(request => {
            activities.push({
              id: request._id,
              action: request.status === 'Fulfilled' ? 'Blood request fulfilled' : 'New blood request',
              user: request.location?.city || 'Unknown',
              time: new Date(request.createdAt).toLocaleString(),
              type: request.status === 'Fulfilled' ? 'success' : 'alert'
            })
          })
        }
        setRecentActivity(activities.slice(0, 5))
      }

      // Fetch pending verifications
      const donorsRes = await api.get('/admin/donors', {
        params: { status: 'Pending', limit: 50 }
      })
      if (donorsRes.data.success) {
        setPendingVerifications(donorsRes.data.donors.map(donor => ({
          id: donor._id,
          name: donor.name,
          email: donor.email,
          bloodGroup: donor.bloodGroup,
          type: 'donor',
          date: donor.createdAt
        })))
        setAllDonors(donorsRes.data.donors)
      }

      // Fetch all requests
      const requestsRes = await api.get('/admin/requests')
      if (requestsRes.data.success) {
        setAllRequests(requestsRes.data.requests)
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      showNotification('Error loading dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id) => {
    try {
      const response = await api.put(`/admin/donors/${id}/verify`)
      if (response.data.success) {
        showNotification('Donor verified successfully', 'success')
        setPendingVerifications(prev => prev.filter(item => item.id !== id))
        loadDashboardData() // Reload data
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to verify donor', 'error')
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this donor?')) return
    
    try {
      const response = await api.put(`/admin/donors/${id}/reject`, {
        reason: 'Does not meet verification criteria'
      })
      if (response.data.success) {
        showNotification('Donor rejected', 'success')
        setPendingVerifications(prev => prev.filter(item => item.id !== id))
        loadDashboardData()
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to reject donor', 'error')
    }
  }

  const handleBroadcast = () => {
    const message = prompt('Enter broadcast message:')
    if (message && message.trim()) {
      showNotification(`Broadcast sent: ${message}`, 'success')
    }
  }

  const handleSettings = () => {
    showNotification('Settings panel coming soon', 'info')
  }

  if (loading) {
    return (
      <div className="admin-dashboard" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <div style={{color: 'white', fontSize: '24px'}}>Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="admin-info">
            <h1>⚡ Admin Control Center</h1>
            <p>System Management & Monitoring</p>
          </div>
          <div className="header-actions">
            <button className="btn-broadcast" onClick={handleBroadcast}>📢 Broadcast Alert</button>
            <button className="btn-settings" onClick={handleSettings}>⚙️ Settings</button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="admin-stat-card donors">
          <div className="stat-icon">🩸</div>
          <div className="stat-content">
            <h3>{stats.activeDonors.toLocaleString()}</h3>
            <p>Active Donors</p>
          </div>
        </div>
        <div className="admin-stat-card requests">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalRequests.toLocaleString()}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="admin-stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.successRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={`admin-tab ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => setActiveTab('verifications')}>
          ✓ Verifications ({pendingVerifications.length})
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users
        </button>
        <button className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          📋 Requests
        </button>
        <button className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📈 Analytics
        </button>
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content">
        {activeTab === 'overview' && (
          <div className="tab-section">
            {/* Pending Verifications */}
            <div className="content-card">
              <div className="card-header">
                <h2>⏳ Pending Verifications</h2>
                <span className="badge-count">{pendingVerifications.length}</span>
              </div>
              <div className="verifications-list">
                {pendingVerifications.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)'}}>
                    No pending verifications
                  </div>
                ) : (
                  pendingVerifications.map(item => (
                    <div key={item.id} className="verification-item">
                      <div className="verification-info">
                        <div className="user-avatar">{item.name.charAt(0)}</div>
                        <div className="user-details">
                          <h4>{item.name}</h4>
                          <p>{item.email}</p>
                          <div className="verification-meta">
                            {item.bloodGroup && <span className="blood-badge">{item.bloodGroup}</span>}
                            <span className="type-badge">{item.type}</span>
                            <span className="time-badge">{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="verification-actions">
                        <button className="btn-verify" onClick={() => handleVerify(item.id)}>✓ Verify</button>
                        <button className="btn-reject" onClick={() => handleReject(item.id)}>✗ Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="content-card">
              <div className="card-header">
                <h2>📌 Recent Activity</h2>
              </div>
              <div className="activity-timeline">
                {recentActivity.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className={`timeline-icon ${item.type}`}></div>
                    <div className="timeline-content">
                      <h4>{item.action}</h4>
                      <p>{item.user}</p>
                      <span className="timeline-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="content-card">
              <div className="card-header">
                <h2>🖥️ System Status</h2>
              </div>
              <div className="system-status-grid">
                <div className="status-item healthy">
                  <div className="status-dot"></div>
                  <div className="status-info">
                    <h4>Database</h4>
                    <p>Operational</p>
                  </div>
                </div>
                <div className="status-item healthy">
                  <div className="status-dot"></div>
                  <div className="status-info">
                    <h4>API Server</h4>
                    <p>Operational</p>
                  </div>
                </div>
                <div className="status-item healthy">
                  <div className="status-dot"></div>
                  <div className="status-info">
                    <h4>Socket.IO</h4>
                    <p>Connected</p>
                  </div>
                </div>
                <div className="status-item warning">
                  <div className="status-dot"></div>
                  <div className="status-info">
                    <h4>Firebase</h4>
                    <p>Limited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="tab-section">
            <div className="content-card">
              <div className="card-header">
                <h2>Verification Queue</h2>
                <div className="filter-buttons">
                  <button className="filter-btn active">All</button>
                  <button className="filter-btn">Donors</button>
                  <button className="filter-btn">Hospitals</button>
                </div>
              </div>
              <div className="verifications-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Blood Group</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVerifications.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)'}}>
                          No pending verifications
                        </td>
                      </tr>
                    ) : (
                      pendingVerifications.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.email}</td>
                          <td><span className="table-badge">{item.type}</span></td>
                          <td>{item.bloodGroup || '-'}</td>
                          <td>{new Date(item.date).toLocaleDateString()}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-table-verify" onClick={() => handleVerify(item.id)}>Verify</button>
                              <button className="btn-table-reject" onClick={() => handleReject(item.id)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-section">
            <div className="content-card">
              <div className="card-header">
                <h2>👥 All Users</h2>
                <div className="filter-buttons">
                  <button className="filter-btn active">All</button>
                  <button className="filter-btn">Donors</button>
                  <button className="filter-btn">Patients</button>
                  <button className="filter-btn">Hospitals</button>
                </div>
              </div>
              <div className="verifications-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Blood Group</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDonors.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)'}}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      allDonors.slice(0, 20).map(donor => (
                        <tr key={donor._id}>
                          <td><strong>{donor.name}</strong></td>
                          <td>{donor.email}</td>
                          <td><span className="table-badge">{donor.type || 'donor'}</span></td>
                          <td>{donor.bloodGroup || '-'}</td>
                          <td>
                            <span className={`status-badge ${donor.isVerified ? 'verified' : 'pending'}`}>
                              {donor.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td>{new Date(donor.createdAt || Date.now()).toLocaleDateString()}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-table-view">View</button>
                              {!donor.isVerified && (
                                <button className="btn-table-verify" onClick={() => handleVerify(donor._id)}>Verify</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="tab-section">
            <div className="content-card">
              <div className="card-header">
                <h2>📋 Blood Requests</h2>
                <div className="filter-buttons">
                  <button className="filter-btn active">All</button>
                  <button className="filter-btn">Active</button>
                  <button className="filter-btn">Fulfilled</button>
                  <button className="filter-btn">Expired</button>
                </div>
              </div>
              <div className="verifications-table">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Blood Group</th>
                      <th>Units</th>
                      <th>Hospital</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)'}}>
                          No requests found
                        </td>
                      </tr>
                    ) : (
                      allRequests.slice(0, 20).map(request => (
                        <tr key={request._id}>
                          <td><strong>{request.patientName}</strong></td>
                          <td><span className="blood-type-badge">{request.bloodGroup}</span></td>
                          <td>{request.unitsNeeded} units</td>
                          <td>{request.hospital}</td>
                          <td>
                            <span className={`urgency-badge ${request.urgency}`}>
                              {request.urgency}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${request.status}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-section">
            <div className="content-card">
              <h2>📊 Platform Analytics</h2>
              <div className="analytics-charts">
                <div className="chart-container">
                  <h3>User Growth (Last 6 Months)</h3>
                  <div className="line-chart">
                    <div className="chart-placeholder">
                      <div className="chart-line">
                        <div className="point" style={{left: '0%', bottom: '20%'}}></div>
                        <div className="point" style={{left: '20%', bottom: '35%'}}></div>
                        <div className="point" style={{left: '40%', bottom: '45%'}}></div>
                        <div className="point" style={{left: '60%', bottom: '60%'}}></div>
                        <div className="point" style={{left: '80%', bottom: '75%'}}></div>
                        <div className="point" style={{left: '100%', bottom: '85%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <h3>Request Success Rate</h3>
                  <div className="donut-chart">
                    <div className="donut-center">
                      <div className="donut-percentage">96%</div>
                      <div className="donut-label">Success</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-section">
            <div className="content-card">
              <h2>⚙️ Platform Settings</h2>
              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Email Notifications</h4>
                    <p>Send email alerts for critical requests</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Push Notifications</h4>
                    <p>Enable browser push notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Auto-Verification</h4>
                    <p>Automatically verify donors after 24 hours</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Emergency Alerts</h4>
                    <p>Broadcast emergency requests to all users</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
