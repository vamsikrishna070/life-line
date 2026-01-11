import jwt from 'jsonwebtoken';
import Donor from '../models/Donor.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Handle all user types
      if (decoded.type === 'donor' || decoded.type === 'patient') {
        req.user = await Donor.findById(decoded.id);
        req.userType = decoded.type;
      } else if (decoded.type === 'admin' || decoded.type === 'hospital') {
        req.user = await Admin.findById(decoded.id);
        req.userType = decoded.type;
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.userType !== 'admin' && req.userType !== 'hospital') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Hospital access required.'
    });
  }
  next();
};

export const verifiedDonorOnly = (req, res, next) => {
  if (req.userType !== 'donor' || req.user.status !== 'Verified') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Verified donors only.'
    });
  }
  next();
};
