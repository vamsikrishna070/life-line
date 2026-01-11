import express from 'express';
import Request from '../models/Request.js';
import Donor from '../models/Donor.js';
import { protect } from '../middleware/auth.js';
import { sendEmergencyNotification } from '../utils/notifications.js';

const router = express.Router();

// @route   GET /api/requests
// @desc    Get all requests (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, bloodGroup, city, urgency } = req.query;

    let query = {};

    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (urgency) query.urgency = urgency;

    // Default to pending requests
    if (!status) {
      query.status = 'Pending';
    }

    const requests = await Request.find(query)
      .populate('requestedBy', 'name email phone')
      .populate('responses.donor', 'name bloodGroup phone city')
      .sort({ urgency: 1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests
// @desc    Create new blood request
// @access  Public/Private
router.post('/', async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      requestedBy: req.user?._id || null
    };

    const request = await Request.create(requestData);

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Broadcast new request to all connected clients
    io.emit('newRequest', request);

    // Find nearby donors with matching blood group
    const compatibleBloodGroups = getCompatibleBloodGroups(request.bloodGroup);
    
    let nearbyDonors = [];
    
    if (request.location?.coordinates?.coordinates) {
      nearbyDonors = await Donor.find({
        status: 'Verified',
        isAvailable: true,
        bloodGroup: { $in: compatibleBloodGroups },
        notificationsEnabled: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: request.location.coordinates.coordinates
            },
            $maxDistance: 50000 // 50km radius
          }
        }
      }).limit(50);
    } else {
      // If no coordinates, search by city
      nearbyDonors = await Donor.find({
        status: 'Verified',
        isAvailable: true,
        bloodGroup: { $in: compatibleBloodGroups },
        notificationsEnabled: true,
        city: new RegExp(request.location.city, 'i')
      }).limit(50);
    }

    // Send notifications to nearby donors
    if (nearbyDonors.length > 0) {
      await sendEmergencyNotification(nearbyDonors, request);
      
      // Update request with notified donors
      request.notifiedDonors = nearbyDonors.map(d => d._id);
      await request.save();

      // Emit notification event
      nearbyDonors.forEach(donor => {
        io.to(`donor_${donor._id}`).emit('emergencyAlert', request);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request,
      notifiedDonorsCount: nearbyDonors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/requests/:id/respond
// @desc    Respond to a blood request
// @access  Private (Verified Donors)
router.put('/:id/respond', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can respond to requests'
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request is no longer active'
      });
    }

    // Check if donor already responded
    const alreadyResponded = request.responses.some(
      r => r.donor.toString() === req.user._id.toString()
    );

    if (alreadyResponded) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this request'
      });
    }

    // Add response
    request.responses.push({
      donor: req.user._id,
      status: 'Interested'
    });

    await request.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    io.emit('requestUpdated', request);

    res.json({
      success: true,
      message: 'Response recorded successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check authorization
    if (req.userType === 'donor' && request.requestedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    request.status = status;
    await request.save();

    // Broadcast update
    const io = req.app.get('io');
    io.emit('requestUpdated', request);

    res.json({
      success: true,
      message: 'Request status updated',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to get compatible blood groups
function getCompatibleBloodGroups(bloodGroup) {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  return compatibility[bloodGroup] || [bloodGroup];
}

export default router;
