import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const donorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonation: {
    type: Date,
    default: null
  },
  donationCount: {
    type: Number,
    default: 0
  },
  fcmToken: {
    type: String,
    default: null
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    name: String,
    phone: String
  }
}, {
  timestamps: true
});

// Index for geospatial queries
donorSchema.index({ location: '2dsphere' });
donorSchema.index({ bloodGroup: 1, status: 1, isAvailable: 1 });

// Hash password before saving
donorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
donorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if donor is eligible to donate (90 days since last donation)
donorSchema.methods.isEligibleToDonate = function() {
  if (!this.lastDonation) return true;
  
  const daysSinceLastDonation = Math.floor((Date.now() - this.lastDonation.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceLastDonation >= 90;
};

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
