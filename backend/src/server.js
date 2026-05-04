require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const AppError = require('./utils/AppError');

// Connect Database
connectDB();

const app = express();

// 1. Set security HTTP headers
app.use(helmet());

// 2. Development logging
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// 3. Body parser, reading data from body into req.body
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5. Data sanitization against XSS
app.use(xss());

// 6. Rate Limiter
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/libraries', require('./routes/library'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/users', require('./routes/user'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payments', require('./routes/payment'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Node.js Backend is running smoothly!' });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler must be last!
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
