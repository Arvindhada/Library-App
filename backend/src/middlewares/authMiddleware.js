const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'librarywala_super_secret_key_2026');

      // Fetch user from the correct collection based on role stored in token
      if (decoded.role === 'owner') {
        req.user = await Owner.findById(decoded.id);
      } else {
        req.user = await Student.findById(decoded.id);
      }
      
      if (!req.user) {
        return next(new AppError('Not authorized, user not found in the system', 401));
      }

      // Attach role explicitly just in case (though it's in the model)
      req.user.role = decoded.role;
      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

module.exports = { protect };
