export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // Join room based on user type and ID
    socket.on('join', ({ userId, userType }) => {
      if (userId && userType) {
        const room = `${userType}_${userId}`;
        socket.join(room);
        console.log(`User ${userId} (${userType}) joined room: ${room}`);
      }
    });

    // Join location-based room for nearby alerts
    socket.on('joinLocation', ({ city, bloodGroup }) => {
      if (city) {
        const locationRoom = `location_${city.toLowerCase().replace(/\s/g, '_')}`;
        socket.join(locationRoom);
      }
      if (bloodGroup) {
        const bloodGroupRoom = `bloodgroup_${bloodGroup}`;
        socket.join(bloodGroupRoom);
      }
    });

    // Donor availability update
    socket.on('updateAvailability', ({ donorId, isAvailable }) => {
      io.emit('donorAvailabilityChanged', { donorId, isAvailable });
    });

    // Real-time request updates
    socket.on('requestUpdate', (data) => {
      io.emit('requestUpdated', data);
    });

    // Emergency broadcast
    socket.on('emergencyBroadcast', (request) => {
      // Broadcast to all users in the same city
      const locationRoom = `location_${request.location.city.toLowerCase().replace(/\s/g, '_')}`;
      io.to(locationRoom).emit('emergencyAlert', request);

      // Broadcast to all users with matching blood group
      const bloodGroupRoom = `bloodgroup_${request.bloodGroup}`;
      io.to(bloodGroupRoom).emit('emergencyAlert', request);
    });

    // Typing indicator for admin chat
    socket.on('typing', ({ room, userName }) => {
      socket.to(room).emit('userTyping', { userName });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    io.emit('ping', { timestamp: Date.now() });
  }, 30000); // Every 30 seconds
};
