import express from 'express';
import Donor from '../models/Donor.js';
import { protect, verifiedDonorOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/donors/search
// @desc    Search donors by location and blood group
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng, radius = 50 } = req.query;

    let query = {
      status: 'Verified',
      isAvailable: true
    };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    let donors;

    // Location-based search
    if (lat && lng) {
      donors = await Donor.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      }).select('-password -fcmToken');
    } else {
      donors = await Donor.find(query)
        .select('-password -fcmToken')
        .limit(50);
    }

    res.json({
      success: true,
      count: donors.length,
      donors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/donors/me
// @desc    Get current donor profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const donor = await Donor.findById(req.user._id).select('-password');

    res.json({
      success: true,
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/donors/me
// @desc    Update donor profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const allowedFields = ['name', 'phone', 'city', 'address', 'isAvailable', 'notificationsEnabled', 'emergencyContact'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const donor = await Donor.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/donors/location
// @desc    Update donor location
// @access  Private
router.put('/location', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const donor = await Donor.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/donors/fcm-token
// @desc    Update FCM token for push notifications
// @access  Private
router.put('/fcm-token', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { fcmToken } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      req.user._id,
      { fcmToken },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'FCM token updated',
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
