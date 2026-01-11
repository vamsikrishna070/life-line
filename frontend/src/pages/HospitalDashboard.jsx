import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import api from '../utils/api'
import './HospitalDashboard.css'

const HospitalDashboard = () => {
  const { user, showNotification } = useApp()
  const [stats, setStats] = useState({
    activeRequests: 0,
    totalDonors: 0,
    successfulMatches: 0,
    pendingVerifications: 0
  })
  const [inventory, setInventory] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterBloodGroup, setFilterBloodGroup] = useState('All Blood Groups')
  const [donorSearch, setDonorSearch] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch requests
      const requestsRes = await api.get('/requests')
      if (requestsRes.data.success) {
        setRequests(requestsRes.data.requests)
        const activeCount = requestsRes.data.requests.filter(r => r.status === 'Pending').length
        const fulfilledCount = requestsRes.data.requests.filter(r => r.status === 'Fulfilled').length
        setStats(prev => ({ 
          ...prev, 
          activeRequests: activeCount,
          successfulMatches: fulfilledCount
        }))
      }

      // Fetch donors
      const donorsRes = await api.get('/donors/search', {
        params: { city: user?.city || '' }
      })
      if (donorsRes.data.success) {
        setDonors(donorsRes.data.donors)
        setStats(prev => ({ ...prev, totalDonors: donorsRes.data.count }))
      }

      // Calculate inventory from donors
      calculateInventory(donorsRes.data.donors || [])
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      showNotification('Error loading dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateInventory = (donorsList) => {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    const inventoryData = bloodGroups.map(group => {
      const count = donorsList.filter(d => d.bloodGroup === group).length
      let status = 'critical'
      if (count >= 40) status = 'good'
      else if (count >= 20) status = 'adequate'
      else if (count >= 10) status = 'low'
      
      return {
        bloodGroup: group,
        units: count,
        status
      }
    })
    setInventory(inventoryData)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#10b981'
      case 'adequate': return '#3b82f6'
      case 'low': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (units) => {
    if (units >= 40) return 'good'
    if (units >= 20) return 'adequate'
    if (units >= 10) return 'low'
    return 'critical'
  }

  if (loading) {
    return (
      <div className="hospital-dashboard" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <div style={{color: '#1f2937', fontSize: '24px'}}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="hospital-dashboard">
      {/* Header */}
      <div className="hospital-header">
        <div className="header-content">
          <div className="hospital-info">
            <h1>🏥 {user?.hospitalName || user?.name || 'City General Hospital'}</h1>
            <p>Blood Bank Management System</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              🔔 Notifications
            </button>
            <button className="btn-primary">
              + New Request
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="hospital-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-details">
            <h3>Active Requests</h3>
            <p className="stat-value">{stats.activeRequests}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Total Donors</h3>
            <p className="stat-value">{stats.totalDonors}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <h3>Successful Matches</h3>
            <p className="stat-value">{stats.successfulMatches}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>Pending</h3>
            <p className="stat-value">{stats.pendingVerifications}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            🩸 Inventory
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📋 Requests
          </button>
          <button
            className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => setActiveTab('donors')}
          >
            👥 Donors
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Blood Inventory Grid */}
            <div className="inventory-grid">
              {inventory.map(item => (
                <div key={item.bloodGroup} className="blood-type-card">
                  <div className="blood-type-icon">🩸</div>
                  <div className="blood-type-label">{item.bloodGroup}</div>
                  <div className="blood-units">{item.units}</div>
                  <div className={`inventory-status ${item.status}`}>
                    {item.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

          {/* Quick Inventory Overview */}
          <div className="content-section">
            <div className="section-header">
              <h2>🩸 Blood Inventory Status</h2>
              <button className="btn-view-all">View All</button>
            </div>
            <div className="inventory-grid-mini">
              {inventory.map(item => (
                <div key={item.bloodGroup} className={`inventory-mini-card ${item.status}`}>
                  <div className="blood-type-large">{item.bloodGroup}</div>
                  <div className="units-count">{item.units} units</div>
                  <div className={`status-badge ${item.status}`}>
                    {item.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="content-section">
            <div className="section-header">
              <h2>📌 Recent Activity</h2>
            </div>
            <div className="activity-feed">
              {requests.slice(0, 4).map((request, idx) => (
                <div key={request._id} className="activity-item">
                  <div className={`activity-icon ${request.status === 'Fulfilled' ? 'success' : request.urgency === 'Critical' ? 'alert' : 'new'}`}>
                    {request.status === 'Fulfilled' ? '✓' : request.urgency === 'Critical' ? '!' : '+'}
                  </div>
                  <div className="activity-content">
                    <h4>{request.status === 'Fulfilled' ? 'Blood Request Fulfilled' : 'New Blood Request'}</h4>
                    <p>{request.bloodGroup} blood - {request.unitsRequired || request.units} units at {request.hospitalName || request.location?.hospital}</p>
                    <span className="activity-time">{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
        <div className="tab-content">
          <div className="content-section">
            <div className="section-header">
              <h2>Blood Inventory Management</h2>
              <div className="header-controls">
                <button className="btn-export">📥 Export Data</button>
                <button className="btn-add-stock">+ Add Stock</button>
              </div>
            </div>
            <div className="inventory-table">
              <table>
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Available Units</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Expiring Soon</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.bloodGroup}>
                      <td>
                        <div className="blood-group-cell">
                          <span className="blood-type-badge">{item.bloodGroup}</span>
                        </div>
                      </td>
                      <td>
                        <span className="units-number">{item.units}</span>
                      </td>
                      <td>
                        <span className={`table-status-badge ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span className="time-text">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                      </td>
                      <td>
                        <span className="expire-count">{item.status === 'critical' ? Math.max(0, Math.floor(item.units * 0.2)) : Math.floor(item.units * 0.1)} units</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon">✏️</button>
                          <button className="btn-icon">📊</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="content-section">
            <h3 className="subsection-title">⚠️ Inventory Alerts</h3>
            <div className="alerts-grid">
              {inventory.filter(item => item.status === 'critical' || item.status === 'low').length > 0 ? (
                inventory.filter(item => item.status === 'critical' || item.status === 'low').slice(0, 2).map(item => (
                  <div key={item.bloodGroup} className={`alert-card ${item.status}`}>
                    <div className="alert-header">
                      <span className="alert-icon">{item.status === 'critical' ? '🚨' : '⚠️'}</span>
                      <span className="alert-level">{item.status.toUpperCase()}</span>
                    </div>
                    <h4>{item.bloodGroup} Blood {item.status === 'critical' ? 'Critical' : 'Low'}</h4>
                    <p>Only {item.units} units remaining. {item.status === 'critical' ? 'Immediate restocking required.' : 'Consider requesting donations soon.'}</p>
                    <button className="btn-alert-action">Request Donations</button>
                  </div>
                ))
              ) : (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#10b981'}}>
                  <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
                  <h3 style={{color: '#10b981', marginBottom: '8px'}}>All Inventory Levels Good</h3>
                  <p style={{color: '#6b7280'}}>No critical or low stock alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="tab-content">
          <div className="content-section">
            <div className="section-header">
              <h2>Blood Requests Management</h2>
              <div className="filter-controls">
                <select 
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Fulfilled</option>
                  <option>Cancelled</option>
                </select>
                <select 
                  className="filter-select"
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                >
                  <option>All Blood Groups</option>
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
            </div>
            <div className="requests-list">
              {(() => {
                let filteredRequests = requests
                if (filterStatus !== 'All Status') {
                  filteredRequests = filteredRequests.filter(r => r.status === filterStatus)
                }
                if (filterBloodGroup !== 'All Blood Groups') {
                  filteredRequests = filteredRequests.filter(r => r.bloodGroup === filterBloodGroup)
                }
                return filteredRequests.length > 0 ? (
                filteredRequests.slice(0, 5).map((request, index) => {
                  const responses = request.responses?.length || 0
                  const required = request.unitsRequired || request.units || 1
                  const progress = Math.min(Math.round((responses / required) * 100), 100)
                  const priorityLevel = request.urgency === 'Critical' ? 'high' : request.urgency === 'Urgent' ? 'medium' : 'normal'
                  
                  return (
                    <div key={request._id} className="request-card-hosp">
                      <div className="request-card-header">
                        <div className="request-id">#REQ-{new Date(request.createdAt).getFullYear()}-{String(index + 1).padStart(3, '0')}</div>
                        <span className={`priority-badge ${priorityLevel}`}>{request.urgency?.toUpperCase() || 'NORMAL'} PRIORITY</span>
                      </div>
                      <div className="request-card-body">
                        <div className="request-info-grid">
                          <div className="info-item">
                            <span className="info-label">Blood Group</span>
                            <span className="info-value blood-group">{request.bloodGroup}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Units Required</span>
                            <span className="info-value">{required} units</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Hospital</span>
                            <span className="info-value">{request.hospitalName || request.location?.hospital || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Status</span>
                            <span className="info-value">
                              <span className={`status-dot ${request.status?.toLowerCase()}`}></span> {request.status}
                            </span>
                          </div>
                        </div>
                        <div className="request-progress-bar">
                          <div className="progress-label">
                            <span>{responses} of {required} units matched</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{width: `${progress}%`}}></div>
                          </div>
                        </div>
                      </div>
                      <div className="request-card-footer">
                        <button className="btn-secondary">View Details</button>
                        <button className="btn-primary">Match Donors</button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{textAlign: 'center', padding: '60px 20px', color: '#6b7280'}}>
                  <div style={{fontSize: '48px', marginBottom: '16px'}}>📋</div>
                  <h3 style={{color: '#374151', marginBottom: '8px'}}>No Matching Requests</h3>
                  <p>No requests match the selected filters</p>
                </div>
              )
              })()}
            </div>
          </div>
        </div>
      )}

        {/* Donors Tab */}
        {activeTab === 'donors' && (
        <div className="tab-content">
          <div className="content-section">
            <div className="section-header">
              <h2>Donor Database</h2>
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search donors by name, blood group, or email..." 
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />
                <button className="btn-search">🔍</button>
              </div>
            </div>
            <div className="donors-grid">
              {(() => {
                const filteredDonors = donorSearch ? 
                  donors.filter(d => 
                    d.name?.toLowerCase().includes(donorSearch.toLowerCase()) ||
                    d.email?.toLowerCase().includes(donorSearch.toLowerCase()) ||
                    d.bloodGroup?.toLowerCase().includes(donorSearch.toLowerCase())
                  ) : donors
                
                return filteredDonors.length > 0 ? (
                  filteredDonors.slice(0, 12).map((donor, idx) => (
                <div key={donor._id} className="donor-card">
                  <div className="donor-avatar">👤</div>
                  <h4>{donor.name}</h4>
                  <div className="donor-blood-type">{donor.bloodGroup}</div>
                  <div className="donor-stats">
                    <span>{donor.totalDonations || 0} donations</span>
                    <span>⭐ {donor.rating || '5.0'}</span>
                  </div>
                  <div className={`donor-status-badge ${donor.status?.toLowerCase()}`}>
                    {donor.status}
                  </div>
                  <button className="btn-contact-donor">
                    {donor.status === 'Pending' ? 'Verify' : 'Contact'}
                  </button>
                </div>
              ))
                ) : (
                  <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                    <div style={{fontSize: '48px', marginBottom: '16px'}}>🔍</div>
                    <h3 style={{color: '#374151', marginBottom: '8px'}}>No Donors Found</h3>
                    <p>{donorSearch ? 'No donors match your search criteria' : 'No donors registered in your area'}</p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
        <div className="tab-content">
          <div className="content-section">
            <h2>📈 Analytics & Reports</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Monthly Request Trends (Last 6 Months)</h3>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {(() => {
                      const now = new Date()
                      const monthData = []
                      
                      // Calculate requests for last 6 months
                      for (let i = 5; i >= 0; i--) {
                        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
                        const monthRequests = requests.filter(r => {
                          const reqDate = new Date(r.createdAt)
                          return reqDate.getMonth() === monthDate.getMonth() && 
                                 reqDate.getFullYear() === monthDate.getFullYear()
                        }).length
                        
                        monthData.push({
                          month: monthDate.toLocaleString('default', { month: 'short' }),
                          count: monthRequests
                        })
                      }
                      
                      const maxCount = Math.max(...monthData.map(m => m.count), 1)
                      
                      return monthData.map((data, idx) => (
                        <div 
                          key={idx} 
                          className="bar" 
                          style={{height: `${Math.max((data.count / maxCount) * 100, 5)}%`}}
                          title={`${data.month}: ${data.count} requests`}
                        ></div>
                      ))
                    })()}
                  </div>
                  <div className="chart-labels">
                    {(() => {
                      const now = new Date()
                      const labels = []
                      for (let i = 5; i >= 0; i--) {
                        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
                        labels.push(monthDate.toLocaleString('default', { month: 'short' }))
                      }
                      return labels.map((label, idx) => <span key={idx}>{label}</span>)
                    })()}
                  </div>
                </div>
              </div>
              <div className="analytics-card">
                <h3>Blood Group Distribution</h3>
                <div className="distribution-grid">
                  {inventory.map(item => (
                    <div key={item.bloodGroup} className="distribution-item">
                      <span className="dist-label">{item.bloodGroup}</span>
                      <div className="dist-bar">
                        <div 
                          className="dist-fill" 
                          style={{width: `${(item.units / 52) * 100}%`, background: getStatusColor(getStatusText(item.units))}}
                        ></div>
                      </div>
                      <span className="dist-value">{item.units}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default HospitalDashboard
