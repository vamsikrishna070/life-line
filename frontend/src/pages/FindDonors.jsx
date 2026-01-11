import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import './FindDonors.css'

function FindDonors() {
  const { searchDonors } = useApp()
  const [city, setCity] = useState('')
  const [bloodGroup, setBloodGroup] = useState('Blood Group')
  const [filteredDonors, setFilteredDonors] = useState([])

  useEffect(() => {
    const results = searchDonors('', bloodGroup, city)
    setFilteredDonors(results)
  }, [city, bloodGroup])

  const handleSearch = () => {
    const results = searchDonors('', bloodGroup, city)
    setFilteredDonors(results)
  }

  return (
    <div className="find-donors-page">
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#999"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search by city..." 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="blood-group-select">
            <select 
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="select-input"
            >
              <option>Blood Group</option>
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

          <div className="donors-found">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#E91E63"/>
            </svg>
            <span className="donors-count">{filteredDonors.length} Donors Found</span>
          </div>
        </div>
      </div>

      <div className="map-section">
        <div className="map-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#E0E0E0"/>
            <circle cx="12" cy="10" r="3" fill="#999"/>
          </svg>
          <p className="map-message">Map Unavailable</p>
          <p className="map-submessage">Please add a valid VITE_GOOGLE_MAPS_API_KEY to your environment variables to view the donor map.</p>
        </div>

        {filteredDonors.length > 0 && (
          <div className="donors-list-overlay">
            <h3>Available Donors</h3>
            <div className="donors-grid">
              {filteredDonors.map(donor => (
                <div key={donor.id} className="donor-card">
                  <div className="donor-avatar">
                    {donor.name.charAt(0)}
                  </div>
                  <div className="donor-info">
                    <h4>{donor.name}</h4>
                    <p className="donor-blood">{donor.bloodGroup}</p>
                    <p className="donor-location">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                      </svg>
                      {donor.city}
                    </p>
                    <a href={`tel:${donor.phone}`} className="contact-btn-small">
                      Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="request-blood-btn" onClick={() => window.location.href = '/requests'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/>
        </svg>
        Request Blood
      </button>
    </div>
  )
}

export default FindDonors
