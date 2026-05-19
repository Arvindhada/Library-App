const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Not authorized. Please login first.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Token missing. Please login again.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'librarywala_super_secret_key_2026');
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please login again.', 401));
      }
      return next(new AppError('Invalid token. Please login again.', 401));
    }

    let user;
    if (decoded.role === 'owner') {
      user = await Owner.findById(decoded.id).select('-__v');
    } else {
      user = await Student.findById(decoded.id).select('-__v');
    }

    if (!user) {
      return next(new AppError('Account not found. Please register again.', 401));
    }

    req.user = user;
    req.user.role = decoded.role;
    next();

  } catch (error) {
    next(new AppError('Authentication failed. Please try again.', 500));
  }
};

module.exports = { protect };
