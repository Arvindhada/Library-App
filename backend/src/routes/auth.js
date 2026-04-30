const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const mockOTPStore = {};

const admin = require('../config/firebase-admin');

// Helper to generate JWT (Our app's internal token)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'librarywala_super_secret_key_2026', {
    expiresIn: '30d',
  });
};

// Reverting to Mock OTP (1234) as requested for now
router.post('/login', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      res.status(400);
      throw new Error("Invalid phone number");
    }
    res.json({ success: true, message: `OTP sent to ${phone} (Use 1234 for testing)` });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;

    // Mock verification
    if (otp !== '1234') {
      res.status(401);
      throw new Error("Invalid OTP. Use 1234 for testing.");
    }

    let user = await User.findOne({ phone: phone.includes('+91') ? phone : `+91${phone}` });
    if (!user) {
      user = await User.create({ 
        phone: phone.includes('+91') ? phone : `+91${phone}`, 
        role: role || 'owner' 
      }); 
    }
    
    const token = generateToken(user._id);
    res.json({ 
      success: true, 
      token, 
      role: user.role,
      message: "Login successful" 
    });
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email) {
      res.status(400);
      throw new Error("Email is required for Google login");
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      // NEW User via Google: Register them as 'owner' by default 
      // (or change to 'student' based on your preference)
      user = await User.create({ email, name, googleId, role: 'owner' });
    } else if (!user.googleId && googleId) {
      // Link Google account if not linked
      user.googleId = googleId;
      if (!user.name && name) user.name = name;
      await user.save();
    }
    
    const token = generateToken(user._id);
    res.json({ success: true, token, role: user.role, message: "Google login successful" });
  } catch (error) {
    next(error);
  }
});

router.post('/register-owner', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    if (!phone) {
      res.status(400);
      throw new Error("Phone number is required");
    }
    
    let user = await User.findOne({ phone });
    if (user) {
      res.status(400);
      throw new Error("User already exists with this phone number");
    }
    
    // Create a new user with 'owner' role explicitly
    user = await User.create({ name, phone, email, role: 'owner' });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, role: user.role, message: "Owner registered successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
