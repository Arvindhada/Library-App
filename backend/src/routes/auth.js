const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const validate = require('../middlewares/validate');
const { loginSchema, verifyOtpSchema, googleLoginSchema, registerOwnerSchema } = require('../validations/authSchemas');
const router = express.Router();

// Helper to generate JWT (Our app's internal token)
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not defined in .env. Using insecure fallback.');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_secret_key', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/login
// @desc    Send OTP to phone number
// @access  Public
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { phone } = req.body;
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register user
// @access  Public
router.post('/verify-otp', validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;

    if (otp !== '1234') {
      const AppError = require('../utils/AppError');
      return next(new AppError('Invalid OTP', 401));
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    let user;
    const requestedRole = role || 'student';

    // Step 3: Find or Create User based on Role
    if (requestedRole === 'owner') {
      user = await Owner.findOne({ phone: normalizedPhone });
      if (!user) {
        user = await Owner.create({ phone: normalizedPhone, role: 'owner' });
      }
    } else {
      user = await Student.findOne({ phone: normalizedPhone });
      if (!user) {
        user = await Student.create({ phone: normalizedPhone, role: 'student' });
      }
    }

    const token = generateToken(user._id, user.role);
    res.json({
      success: true,
      token,
      role: user.role,
      user,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/google
// @desc    Google Sign-In (Assuming Owner app uses this)
// @access  Public
router.post('/google', validate(googleLoginSchema), async (req, res, next) => {
  try {
    const { email, name, googleId } = req.body;

    let user = await Owner.findOne({ email });
    if (!user) {
      user = await Owner.create({ email, name, googleId, role: 'owner', authProvider: 'google' });
    } else if (!user.googleId && googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (!user.name && name) user.name = name;
      await user.save();
    }

    const token = generateToken(user._id, 'owner');
    res.json({ success: true, token, role: user.role, message: 'Google login successful' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/register-owner
// @desc    Register a new owner account
// @access  Public
router.post('/register-owner', validate(registerOwnerSchema), async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const AppError = require('../utils/AppError');

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const existingUser = await Owner.findOne({ phone: normalizedPhone });
    if (existingUser) {
      return next(new AppError('An owner already exists with this phone number. Please login instead.', 400));
    }

    const user = await Owner.create({ name, phone: normalizedPhone, email, role: 'owner' });
    const token = generateToken(user._id, 'owner');
    res.status(201).json({ success: true, token, role: user.role, message: 'Owner registered successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
