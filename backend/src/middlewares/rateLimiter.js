const rateLimit = require('express-rate-limit');

// Anti-DDoS rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 reqs per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Traffic limit exceeded. Please wait a moment.'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

module.exports = { apiLimiter };
