import express from 'express';
import Donor from '../models/Donor.js';
import Request from '../models/Request.js';
import Admin from '../models/Admin.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ status: 'Verified' }),
      Donor.countDocuments({ status: 'Pending' }),
      Donor.countDocuments({ isAvailable: true, status: 'Verified' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'Pending' }),
      Request.countDocuments({ status: 'Fulfilled' }),
      Request.countDocuments({ urgency: 'Critical', status: 'Pending' })
    ]);

    // Blood group distribution
    const bloodGroupStats = await Donor.aggregate([
      { $match: { status: 'Verified' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent registrations
    const recentDonors = await Donor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email bloodGroup city status createdAt');

    // Recent requests
    const recentRequests = await Request.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bloodGroup location.city urgency status createdAt');

    res.json({
      success: true,
      stats: {
        totalDonors: stats[0],
        verifiedDonors: stats[1],
        pendingDonors: stats[2],
        availableDonors: stats[3],
        totalRequests: stats[4],
        pendingRequests: stats[5],
        fulfilledRequests: stats[6],
        criticalRequests: stats[7],
        bloodGroupDistribution: bloodGroupStats,
        recentDonors,
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/donors
// @desc    Get all donors with filters
// @access  Private (Admin)
router.get('/donors', async (req, res) => {
  try {
    const { status, bloodGroup, city, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.city = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const donors = await Donor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Donor.countDocuments(query);

    res.json({
      success: true,
      donors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalDonors: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/donors/:id/verify
// @desc    Verify a donor
// @access  Private (Admin)
router.put('/donors/:id/verify', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status: 'Verified' },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Notify donor via Socket.IO
    const io = req.app.get('io');
    io.to(`donor_${donor._id}`).emit('statusUpdate', {
      status: 'Verified',
      message: 'Your account has been verified!'
    });

    res.json({
      success: true,
      message: 'Donor verified successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/donors/:id/reject
// @desc    Reject a donor
// @access  Private (Admin)
router.put('/donors/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Notify donor
    const io = req.app.get('io');
    io.to(`donor_${donor._id}`).emit('statusUpdate', {
      status: 'Rejected',
      message: reason || 'Your application has been rejected.'
    });

    res.json({
      success: true,
      message: 'Donor rejected',
      donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/donors/:id
// @desc    Delete a donor
// @access  Private (Admin)
router.delete('/donors/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all requests
// @access  Private (Admin)
router.get('/requests', async (req, res) => {
  try {
    const { status, urgency, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (urgency) query.urgency = urgency;

    const requests = await Request.find(query)
      .populate('requestedBy', 'name email phone')
      .populate('responses.donor', 'name bloodGroup phone')
      .sort({ urgency: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Request.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRequests: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/create
// @desc    Create new admin (superadmin only)
// @access  Private (Superadmin)
router.post('/create', async (req, res) => {
  try {
    // Check if current user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can create new admins'
      });
    }

    const { name, email, password, role, permissions } = req.body;

    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'admin',
      permissions: permissions || ['verify_donors', 'manage_requests']
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
