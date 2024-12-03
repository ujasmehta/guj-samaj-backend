const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonation,
  updateDonationStatus
} = require('../controllers/donationController');

// Public routes
router.post('/', createDonation);
router.get('/:id', getDonation);

// Protected routes (only accessible by admin)
router.get('/', getDonations);
router.patch('/:id/status', updateDonationStatus);

module.exports = router;