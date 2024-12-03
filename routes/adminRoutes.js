const express = require('express');
const router = express.Router();
const {
  login,
  getDashboardStats,
  exportDonations,
  getAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);

// Protected routes
router.use(protect); // Apply protection to all routes below

// Dashboard routes
router.get('/dashboard', authorize('view_analytics'), getDashboardStats);

// Analytics routes
router.get('/analytics', authorize('view_analytics'), getAnalytics);

// Export routes
router.get('/export', authorize('export_data'), exportDonations);

module.exports = router;