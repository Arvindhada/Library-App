const Joi = require('joi');

// Schema for sending OTP
const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number.',
      'any.required': 'Phone number is required.',
    }),
});

// Schema for verifying OTP
const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number.',
      'any.required': 'Phone number is required.',
    }),
  otp: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be exactly 4 digits.',
    'string.pattern.base': 'OTP must be numeric.',
    'any.required': 'OTP is required.',
  }),
  role: Joi.string().valid('student', 'owner').default('student'),
});

// Schema for Google login
const googleLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required for Google login.',
  }),
  name: Joi.string().min(2).max(50).optional().allow(''),
  googleId: Joi.string().optional(),
});

// Schema for Register Owner
const registerOwnerSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().allow(''),
  phone: Joi.string()
    .pattern(/^\+?91[6-9]\d{9}$|^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid Indian mobile number.',
      'any.required': 'Phone number is required.',
    }),
  email: Joi.string().email().optional().allow(''),
});

module.exports = { loginSchema, verifyOtpSchema, googleLoginSchema, registerOwnerSchema };
