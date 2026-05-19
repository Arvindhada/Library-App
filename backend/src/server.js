require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');
const AppError = require('./utils/AppError');

connectDB();

const app = express();

app.use(helmet());

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply strict rate limit only on auth routes (anti brute-force)
app.use('/api/auth', authLimiter);

// General rate limit on all other API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/libraries', require('./routes/library'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/users', require('./routes/user'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), message: 'Server is running.' });
});

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Global error handler
app.use(errorHandler);

// Catch unhandled promise rejections (prevents server crash)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Catch uncaught exceptions (prevents server crash)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} (0.0.0.0)`));
