exports.createDonation = async (req, res) => {
  try {
    const donationData = {
      donor: {
        name: req.body.donor.name,
        email: req.body.donor.email,
        phone: req.body.donor.phone,
        address: req.body.donor.address
      },
      amount: Number(req.body.amount),
      purpose: req.body.purpose,
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes
    };

    // Validate amount
    if (isNaN(donationData.amount) || donationData.amount <= 0) {
      throw new Error('Please provide a valid donation amount');
    }

    const donation = await Donation.create(donationData);
    
    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation submitted successfully'
    });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create donation'
    });
  }
};
const Donation = require('../models/donation');

// Create new donation
exports.createDonation = async (req, res) => {
  try {
    const donationData = {
      donor: {
        name: req.body.donor.name,
        email: req.body.donor.email,
        phone: req.body.donor.phone,
        address: req.body.donor.address
      },
      amount: Number(req.body.amount),
      purpose: req.body.purpose,
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes
    };

    // Validate amount
    if (isNaN(donationData.amount) || donationData.amount <= 0) {
      throw new Error('Please provide a valid donation amount');
    }

    const donation = await Donation.create(donationData);
    
    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation submitted successfully'
    });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create donation'
    });
  }
};

// Get all donations
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .select('-__v');

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

// Get single donation
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

// Update donation status
exports.updateDonationStatus = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

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