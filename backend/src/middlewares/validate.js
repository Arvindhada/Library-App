const AppError = require('../utils/AppError');

/**
 * Validation Middleware Factory
 * Usage: router.post('/route', validate(schema), handler)
 * 
 * It checks req.body against the provided Joi schema.
 * If validation fails, it sends a 400 error with a clear message.
 * If validation passes, it replaces req.body with the cleaned/sanitized value.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,    // Return ALL errors, not just the first one
    stripUnknown: true,   // Silently remove any fields not in the schema (security!)
  });

  if (error) {
    // Collect all validation messages into one clean string
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }

  // Replace req.body with the sanitized/validated value
  req.body = value;
  next();
};

module.exports = validate;
