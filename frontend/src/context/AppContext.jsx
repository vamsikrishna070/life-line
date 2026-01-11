import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { initializeSocket, getSocket, disconnectSocket, joinLocationRooms } from '../utils/socket'
import { requestNotificationPermission, onMessageListener } from '../utils/firebase'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [donors, setDonors] = useState([])
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)

  // Initialize socket connection when user logs in
  useEffect(() => {
    if (user && token) {
      const socketInstance = initializeSocket(user.id, user.type || 'donor')
      setSocket(socketInstance)

      // Setup socket listeners
      socketInstance.on('newRequest', (request) => {
        setRequests(prev => [request, ...prev])
        showNotification(`New ${request.bloodGroup} blood request in ${request.location.city}!`, 'info')
      })

      socketInstance.on('emergencyAlert', (request) => {
        showNotification(`🚨 EMERGENCY: ${request.bloodGroup} blood needed at ${request.hospitalName}!`, 'error')
        // Play sound or show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Emergency Blood Request', {
            body: `${request.bloodGroup} needed in ${request.location.city}`,
            icon: '/logo.png',
            tag: request._id
          })
        }
      })

      socketInstance.on('requestUpdated', (request) => {
        setRequests(prev => prev.map(r => r._id === request._id ? request : r))
      })

      socketInstance.on('statusUpdate', (data) => {
        showNotification(data.message, 'success')
        if (data.status === 'Verified') {
          setUser(prev => ({ ...prev, status: 'Verified' }))
        }
      })

      // Join location rooms
      if (user.city && user.bloodGroup) {
        joinLocationRooms(user.city, user.bloodGroup)
      }

      return () => {
        disconnectSocket()
      }
    }
  }, [user, token])

  // Request notification permission
  useEffect(() => {
    if (user) {
      requestNotificationPermission().then(async (fcmToken) => {
        if (fcmToken) {
          try {
            await api.put('/donors/fcm-token', { fcmToken })
            console.log('FCM token saved')
          } catch (error) {
            console.error('Error saving FCM token:', error)
          }
        }
      })

      // Listen for foreground messages
      onMessageListener().then((payload) => {
        showNotification(payload.notification.title, 'info')
      })
    }
  }, [user])

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchRequests()
    }
  }, [token])

  // Authentication functions
  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await api.post('/auth/donor/register', userData)
      
      if (response.data.success) {
        const { token, donor } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify({ ...donor, type: 'donor' }))
        setToken(token)
        setUser({ ...donor, type: 'donor' })
        showNotification(response.data.message, 'success')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      showNotification(message, 'error')
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, userType = 'donor') => {
    try {
      setLoading(true)
      
      // Use unified login endpoint
      const response = await api.post('/auth/login', { email, password, userType })
      
      if (response.data.success) {
        const { token } = response.data
        // Get user data from appropriate key (admin, donor, hospital, patient)
        const userData = response.data.admin || response.data.donor || response.data.hospital || response.data.patient
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify({ ...userData, type: userType }))
        setToken(token)
        setUser({ ...userData, type: userType })
        
        const userName = userData.name || userData.fullName || 'User'
        showNotification(`Welcome back, ${userName}!`, 'success')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.'
      showNotification(message, 'error')
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    disconnectSocket()
    showNotification('Logged out successfully', 'info')
  }

  // Donor functions
  const searchDonors = async (searchTerm, bloodGroup, city) => {
    try {
      const params = {}
      if (bloodGroup && bloodGroup !== 'Blood Group') params.bloodGroup = bloodGroup
      if (city) params.city = city
      
      const response = await api.get('/donors/search', { params })
      
      if (response.data.success) {
        setDonors(response.data.donors)
        return response.data.donors
      }
      return []
    } catch (error) {
      console.error('Error searching donors:', error)
      return []
    }
  }

  const updateProfile = async (updates) => {
    try {
      const response = await api.put('/donors/me', updates)
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, ...response.data.donor }))
        localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.donor }))
        showNotification('Profile updated successfully', 'success')
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Update failed', 'error')
      return { success: false }
    }
  }

  const updateLocation = async (latitude, longitude) => {
    try {
      const response = await api.put('/donors/location', { latitude, longitude })
      
      if (response.data.success) {
        showNotification('Location updated successfully', 'success')
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Location update failed', 'error')
      return { success: false }
    }
  }

  // Request functions
  const fetchRequests = async (filters = {}) => {
    try {
      const response = await api.get('/requests', { params: filters })
      
      if (response.data.success) {
        setRequests(response.data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const createRequest = async (requestData) => {
    try {
      setLoading(true)
      const response = await api.post('/requests', requestData)
      
      if (response.data.success) {
        setRequests(prev => [response.data.request, ...prev])
        showNotification(`Request created! ${response.data.notifiedDonorsCount} donors notified.`, 'success')
        return { success: true, request: response.data.request }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create request', 'error')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const respondToRequest = async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/respond`)
      
      if (response.data.success) {
        showNotification('Response sent successfully!', 'success')
        fetchRequests()
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to respond', 'error')
      return { success: false }
    }
  }

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await api.put(`/requests/${requestId}/status`, { status })
      
      if (response.data.success) {
        setRequests(prev => prev.map(r => r._id === requestId ? response.data.request : r))
        showNotification(`Request marked as ${status}`, 'success')
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update status', 'error')
      return { success: false }
    }
  }

  // Admin functions
  const fetchAllDonors = async (filters = {}) => {
    try {
      const response = await api.get('/admin/donors', { params: filters })
      
      if (response.data.success) {
        setDonors(response.data.donors)
        return response.data
      }
    } catch (error) {
      console.error('Error fetching donors:', error)
      return { donors: [] }
    }
  }

  const verifyDonor = async (donorId) => {
    try {
      const response = await api.put(`/admin/donors/${donorId}/verify`)
      
      if (response.data.success) {
        setDonors(prev => prev.map(d => d._id === donorId ? response.data.donor : d))
        showNotification('Donor verified successfully', 'success')
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Verification failed', 'error')
      return { success: false }
    }
  }

  const deleteDonor = async (donorId) => {
    try {
      const response = await api.delete(`/admin/donors/${donorId}`)
      
      if (response.data.success) {
        setDonors(prev => prev.filter(d => d._id !== donorId))
        showNotification('Donor deleted', 'success')
        return { success: true }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Deletion failed', 'error')
      return { success: false }
    }
  }

  const getDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      
      if (response.data.success) {
        return response.data.stats
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return null
    }
  }

  // Notification system
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type
    }
    setNotifications(prev => [...prev, notification])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const value = {
    user,
    token,
    donors,
    requests,
    notifications,
    loading,
    socket,
    register,
    login,
    logout,
    searchDonors,
    updateProfile,
    updateLocation,
    fetchRequests,
    createRequest,
    respondToRequest,
    updateRequestStatus,
    fetchAllDonors,
    verifyDonor,
    deleteDonor,
    getDashboardStats,
    showNotification,
    removeNotification
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

