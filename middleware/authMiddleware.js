const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if admin still exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin no longer exists'
      });
    }

    // 4. Check if admin is still active
    if (!admin.active) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Middleware to check permissions
exports.authorize = (...permissions) => {
  return (req, res, next) => {
    if (!permissions.some(permission => req.admin.hasPermission(permission))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    next();
  };
};