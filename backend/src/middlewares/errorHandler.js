const errorHandler = (err, req, res, next) => {
  console.error(`Global Exception: ${err.message}`, err.stack);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
};

module.exports = { errorHandler };
