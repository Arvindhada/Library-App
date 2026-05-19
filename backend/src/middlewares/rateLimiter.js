const rateLimit = require('express-rate-limit');

// Global API limiter — prevents DDoS
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after a minute.',
    });
  },
});

// Stricter limiter for auth routes — prevents OTP brute force
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window (reduced for testing)
  max: 100, // increased for testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 1 minute.',
    });
  },
});

module.exports = { apiLimiter, authLimiter };
