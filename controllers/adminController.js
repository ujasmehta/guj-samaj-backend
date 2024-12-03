const Admin = require('../models/admin');
const Donation = require('../models/donation');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Authentication
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Dashboard Analytics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total donations
    const totalDonations = await Donation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly donations
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get donations by category
    const donationsByCategory = await Donation.aggregate([
      {
        $group: {
          _id: "$causeCategory",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent donations
    const recentDonations = await Donation.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        totalDonations: totalDonations[0] || { total: 0, count: 0 },
        monthlyDonations: monthlyDonations[0] || { total: 0, count: 0 },
        donationsByCategory,
        recentDonations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange } = req.query;
    let startDate = new Date();

    // Calculate start date based on time range
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to last month
    }

    // Get donation trends
    const trends = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      },
      {
        $project: {
          date: "$_id",
          amount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get category distribution
    const categoryDistribution = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$causeCategory",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment method distribution
    const paymentMethods = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get success rate
    const successRate = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate additional metrics
    const totalStats = await Donation.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        trends,
        categoryDistribution,
        paymentMethods,
        successRate,
        metrics: totalStats[0] || {
          totalAmount: 0,
          avgAmount: 0,
          totalCount: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Email Notifications
exports.sendDonationReceipt = async (donation) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: donation.email,
      subject: 'Thank you for your donation!',
      html: `
        <h1>Donation Receipt</h1>
        <p>Dear ${donation.name},</p>
        <p>Thank you for your generous donation of ₹${donation.amount} to ${donation.causeCategory}.</p>
        <p>Receipt Number: ${donation.receiptNumber}</p>
        <p>Transaction ID: ${donation.transactionId}</p>
        <p>Date: ${new Date(donation.timestamp).toLocaleDateString()}</p>
        <p>Your support makes a difference!</p>
      `
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Export Data
exports.exportDonations = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      query.causeCategory = category;
    }

    const donations = await Donation.find(query)
      .sort({ timestamp: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};