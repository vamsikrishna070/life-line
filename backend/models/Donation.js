import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  quantity: {
    type: Number,
    required: true,
    default: 450 // in ml
  },
  donationType: {
    type: String,
    enum: ['Emergency', 'Scheduled', 'Campaign', 'Walk-in'],
    default: 'Scheduled'
  },
  hospital: {
    type: String,
    required: true
  },
  location: {
    city: String,
    address: String
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No-show'],
    default: 'Completed'
  },
  notes: {
    type: String
  },
  hemoglobinLevel: {
    type: Number
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  temperature: {
    type: Number
  },
  weight: {
    type: Number
  },
  screening: {
    passed: {
      type: Boolean,
      default: true
    },
    notes: String
  },
  collectedBy: {
    type: String // Staff name or ID
  },
  certificateIssued: {
    type: Boolean,
    default: true
  },
  certificateNumber: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ bloodGroup: 1 });
donationSchema.index({ hospital: 1 });

// Calculate lives impacted (1 donation can help up to 3 people)
donationSchema.virtual('livesImpacted').get(function() {
  return this.status === 'Completed' ? 3 : 0;
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
