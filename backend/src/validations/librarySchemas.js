const Joi = require('joi');

// Schema for creating/updating a library
const librarySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Library name must be at least 3 characters.',
    'string.max': 'Library name cannot exceed 100 characters.',
    'any.required': 'Library name is required.',
  }),
  address: Joi.string().min(10).max(300).required().messages({
    'string.min': 'Address must be at least 10 characters.',
    'any.required': 'Address is required.',
  }),
  area: Joi.string().min(2).max(100).optional().allow(''),
  city: Joi.string().min(2).max(100).optional().allow(''),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  total_seats: Joi.number().integer().min(1).max(1000).required().messages({
    'number.min': 'Total seats must be at least 1.',
    'number.max': 'Total seats cannot exceed 1000.',
    'any.required': 'Total seats is required.',
  }),
  available_seats: Joi.number().integer().min(0).optional(),
  ac_available: Joi.boolean().optional().default(false),
  wifi_available: Joi.boolean().optional().default(false),
  whatsapp: Joi.string().optional().allow('').messages({
    'string.pattern.base': 'WhatsApp must be a valid 10-digit number.',
  }),
  open_time: Joi.string().optional().allow(''),
  half_time_fee: Joi.number().min(0).optional().default(0),
  full_time_fee: Joi.number().min(0).optional().default(0),
  facilities: Joi.array().items(Joi.string()).optional(),
  photos: Joi.array().items(Joi.string().uri()).optional().messages({
    'string.uri': 'Each photo must be a valid URL.',
  }),
}).unknown();

// Schema for save/unsave library
const saveLibrarySchema = Joi.object({
  userId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'Invalid user ID format.',
    'string.length': 'Invalid user ID format.',
    'any.required': 'User ID is required.',
  }),
  libraryId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid library ID format.',
    'string.length': 'Invalid library ID format.',
    'any.required': 'Library ID is required.',
  }),
});

module.exports = { librarySchema, saveLibrarySchema };
