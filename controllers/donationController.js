const Donation = require('../models/donation');

// Create a new donation
exports.createDonation = async (req, res) => {
  try {
    const donation = new Donation(req.body);
    await donation.save();
    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all donations
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ timestamp: -1 });
    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single donation by ID
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get donations by category
exports.getDonationsByCategory = async (req, res) => {
  try {
    const donations = await Donation.find({ 
      causeCategory: req.params.category 
    }).sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get total donations amount
exports.getTotalDonations = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalAmount: result[0]?.totalAmount || 0,
        count: result[0]?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};