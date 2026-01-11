import express from 'express';
import jwt from 'jsonwebtoken';
import Donor from '../models/Donor.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/login
// @desc    Universal login endpoint
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType = 'donor' } = req.body;

    let user, token, userResponse;

    // Admin and Hospital login
    if (userType === 'admin' || userType === 'hospital') {
      const admin = await Admin.findOne({ email }).select('+password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if admin is active
      if (admin.isActive !== undefined && !admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      token = generateToken(admin._id, userType);
      userResponse = {
        id: admin._id,
        name: admin.name || admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };

      return res.json({
        success: true,
        token,
        [userType === 'hospital' ? 'hospital' : 'admin']: userResponse
      });
    }

    // Donor and Patient login
    if (userType === 'donor' || userType === 'patient') {
      const donor = await Donor.findOne({ email }).select('+password');
      
      if (!donor) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isMatch = await donor.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      token = generateToken(donor._id, userType);
      userResponse = {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        status: donor.status,
        city: donor.city
      };

      return res.json({
        success: true,
        token,
        donor: userResponse
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid user type'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/donor/register
// @desc    Register new donor
// @access  Public
router.post('/donor/register', async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, city, address } = req.body;

    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create donor
    const donor = await Donor.create({
      name,
      email,
      password,
      phone,
      bloodGroup,
      city,
      address
    });

    const token = generateToken(donor._id, 'donor');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending verification.',
      token,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        status: donor.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/donor/login
// @desc    Login donor
// @access  Public
router.post('/donor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for donor
    const donor = await Donor.findOne({ email }).select('+password');
    
    if (!donor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await donor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(donor._id, 'donor');

    res.json({
      success: true,
      token,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        status: donor.status,
        city: donor.city
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Login admin
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active (only if isActive field exists)
    if (admin.isActive !== undefined && !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name || admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
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
