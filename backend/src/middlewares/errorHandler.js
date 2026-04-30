const errorHandler = (err, req, res, next) => {
  console.error(`Global Exception: ${err.message}`);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred. Do not worry, our servers are resilient.' : err.message,
  });
};

module.exports = { errorHandler };
