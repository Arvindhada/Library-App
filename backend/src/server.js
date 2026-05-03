require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Connect Database
connectDB();

const app = express();

// Anti-crash / Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/libraries', require('./routes/library'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/users', require('./routes/user'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Node.js Backend is running smoothly!' });
});

// Global Error Handler must be last!
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
