const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonation,
  getDonationsByCategory,
  getTotalDonations
} = require('../controllers/donationController');

// POST /api/donations - Create a new donation
router.post('/', createDonation);

// GET /api/donations - Get all donations
router.get('/', getDonations);

// GET /api/donations/total - Get total donations amount
router.get('/total', getTotalDonations);

// GET /api/donations/category/:category - Get donations by category
router.get('/category/:category', getDonationsByCategory);

// GET /api/donations/:id - Get single donation
router.get('/:id', getDonation);

module.exports = router;