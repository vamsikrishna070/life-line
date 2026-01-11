import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import './AdminPanel.css'

function AdminPanel() {
  const { donors, verifyDonor, deleteDonor } = useApp()
  const [searchTerm, setSearchTerm] = useState('')

  const handleVerify = (id) => {
    verifyDonor(id)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this donor?')) {
      deleteDonor(id)
    }
  }

  const filteredDonors = donors.filter(donor =>
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.phone.includes(searchTerm)
  )

  const pendingCount = donors.filter(d => d.status === 'Pending').length
  const verifiedCount = donors.filter(d => d.status === 'Verified').length

  return (
    <div className="admin-panel-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#E91E63"/>
            </svg>
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Manage and verify registered donors.</p>
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Search donors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#e3f2fd'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#2196f3"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{donors.length}</div>
              <div className="stat-label">Total Donors</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{background: '#e8f5e9'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#4caf50"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{verifiedCount}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fff3e0'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#ff9800"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        <div className="donors-section">
          <h2 className="section-title">Registered Donors ({filteredDonors.length})</h2>
          
          {filteredDonors.length === 0 ? (
            <div className="no-data">
              <p>No donors found matching your search</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="donors-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Blood Group</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map(donor => (
                    <tr key={donor.id}>
                      <td>{donor.name}</td>
                      <td><span className="blood-badge">{donor.bloodGroup}</span></td>
                      <td>{donor.city}</td>
                      <td>
                        <a href={`tel:${donor.phone}`} className="phone-link">
                          {donor.phone}
                        </a>
                      </td>
                      <td>
                        <a href={`mailto:${donor.email}`} className="email-link">
                          {donor.email}
                        </a>
                      </td>
                      <td>
                        {donor.status === 'Verified' ? (
                          <span className="status-verified">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="status-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {donor.status === 'Pending' && (
                            <button 
                              className="btn-verify"
                              onClick={() => handleVerify(donor.id)}
                            >
                              Verify
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => handleDelete(donor.id)}
                            title="Remove donor"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
