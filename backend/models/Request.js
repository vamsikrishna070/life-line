import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsNeeded: {
    type: Number,
    default: 1,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['Critical', 'Urgent', 'Normal'],
    default: 'Urgent'
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  location: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Fulfilled', 'Cancelled', 'Expired'],
    default: 'Pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  responses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Interested', 'Confirmed', 'Completed'],
      default: 'Interested'
    }
  }],
  notifiedDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  }]
}, {
  timestamps: true
});

// Index for location-based queries
requestSchema.index({ 'location.coordinates': '2dsphere' });
requestSchema.index({ status: 1, urgency: 1, createdAt: -1 });

// Auto-expire old requests
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Request = mongoose.model('Request', requestSchema);

export default Request;
