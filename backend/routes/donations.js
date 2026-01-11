import express from 'express';
import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all donations for logged-in donor
router.get('/my-donations', protect, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('request', 'bloodGroup unitsRequired urgency');

    const stats = {
      totalDonations: donations.filter(d => d.status === 'Completed').length,
      totalQuantity: donations
        .filter(d => d.status === 'Completed')
        .reduce((sum, d) => sum + d.quantity, 0),
      livesImpacted: donations.filter(d => d.status === 'Completed').length * 3,
      thisMonth: donations.filter(d => {
        const donationDate = new Date(d.createdAt);
        const now = new Date();
        return d.status === 'Completed' &&
               donationDate.getMonth() === now.getMonth() &&
               donationDate.getFullYear() === now.getFullYear();
      }).length,
      monthStreak: calculateMonthStreak(donations)
    };

    res.json({
      success: true,
      donations,
      stats
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get donation statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const donations = await Donation.find({ 
      donor: req.user.id,
      status: 'Completed'
    }).sort({ createdAt: -1 });

    const donor = await Donor.findById(req.user.id);

    const thisMonth = donations.filter(d => {
      const donationDate = new Date(d.createdAt);
      const now = new Date();
      return donationDate.getMonth() === now.getMonth() &&
             donationDate.getFullYear() === now.getFullYear();
    }).length;

    const lastDonation = donations[0];
    const monthStreak = calculateMonthStreak(donations);

    // Calculate donor score
    let donorScore = 100; // Base score
    donorScore += donations.length * 50; // 50 points per donation
    if (donor?.status === 'Verified') donorScore += 100;
    if (donor?.isAvailable) donorScore += 50;
    if (monthStreak >= 3) donorScore += 100;
    if (monthStreak >= 6) donorScore += 200;
    donorScore = Math.min(donorScore, 1000); // Cap at 1000

    // Determine ranking percentile
    let percentile = 'Top 50%';
    if (donorScore >= 800) percentile = 'Top 5%';
    else if (donorScore >= 600) percentile = 'Top 10%';
    else if (donorScore >= 400) percentile = 'Top 25%';

    res.json({
      success: true,
      stats: {
        totalDonations: donations.length,
        livesImpacted: donations.length * 3,
        thisMonthDonations: thisMonth,
        donorScore,
        percentile,
        monthStreak,
        lastDonationDate: lastDonation?.createdAt,
        nextEligibleDate: lastDonation ? 
          new Date(new Date(lastDonation.createdAt).getTime() + (90 * 24 * 60 * 60 * 1000)) : 
          new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new donation record
router.post('/', protect, async (req, res) => {
  try {
    const {
      bloodGroup,
      quantity,
      donationType,
      hospital,
      location,
      request,
      notes,
      hemoglobinLevel,
      bloodPressure,
      temperature,
      weight
    } = req.body;

    const donation = await Donation.create({
      donor: req.user.id,
      bloodGroup: bloodGroup || req.user.bloodGroup,
      quantity: quantity || 450,
      donationType: donationType || 'Scheduled',
      hospital,
      location,
      request,
      status: 'Completed',
      notes,
      hemoglobinLevel,
      bloodPressure,
      temperature,
      weight,
      certificateNumber: `CERT-${Date.now()}-${req.user.id.toString().slice(-4)}`
    });

    // Update donor's lastDonation and donationCount
    await Donor.findByIdAndUpdate(req.user.id, {
      lastDonation: new Date(),
      $inc: { donationCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get achievements
router.get('/achievements', protect, async (req, res) => {
  try {
    const donations = await Donation.find({ 
      donor: req.user.id,
      status: 'Completed'
    });

    const totalDonations = donations.length;
    const livesImpacted = totalDonations * 3;

    const achievements = [
      {
        id: 1,
        icon: '🎖️',
        title: 'First Hero',
        description: 'First donation completed',
        unlocked: totalDonations >= 1,
        progress: Math.min(totalDonations, 1),
        required: 1
      },
      {
        id: 2,
        icon: '💪',
        title: 'Life Saver',
        description: '5 successful donations',
        unlocked: totalDonations >= 5,
        progress: Math.min(totalDonations, 5),
        required: 5
      },
      {
        id: 3,
        icon: '👑',
        title: 'Legend',
        description: '10 donations completed',
        unlocked: totalDonations >= 10,
        progress: Math.min(totalDonations, 10),
        required: 10
      },
      {
        id: 4,
        icon: '🌟',
        title: 'Community Hero',
        description: 'Helped 50 people',
        unlocked: livesImpacted >= 50,
        progress: Math.min(livesImpacted, 50),
        required: 50
      },
      {
        id: 5,
        icon: '🏆',
        title: 'Super Donor',
        description: '25 donations completed',
        unlocked: totalDonations >= 25,
        progress: Math.min(totalDonations, 25),
        required: 25
      },
      {
        id: 6,
        icon: '💎',
        title: 'Platinum Donor',
        description: '50 donations completed',
        unlocked: totalDonations >= 50,
        progress: Math.min(totalDonations, 50),
        required: 50
      }
    ];

    res.json({
      success: true,
      achievements,
      unlockedCount: achievements.filter(a => a.unlocked).length,
      totalCount: achievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to calculate month streak
function calculateMonthStreak(donations) {
  if (donations.length === 0) return 0;

  const completedDonations = donations
    .filter(d => d.status === 'Completed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (completedDonations.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  // Check if there's a donation in current month
  const hasCurrentMonth = completedDonations.some(d => {
    const donationDate = new Date(d.createdAt);
    return donationDate.getMonth() === currentMonth && 
           donationDate.getFullYear() === currentYear;
  });

  if (!hasCurrentMonth) {
    // Check previous month
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
  }

  // Count consecutive months with donations
  for (let i = 0; i < 24; i++) { // Check up to 24 months
    const hasDonation = completedDonations.some(d => {
      const donationDate = new Date(d.createdAt);
      return donationDate.getMonth() === currentMonth && 
             donationDate.getFullYear() === currentYear;
    });

    if (hasDonation) {
      streak++;
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    } else {
      break;
    }
  }

  return streak;
}

export default router;
