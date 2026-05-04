const Joi = require('joi');

// Schema for creating a booking
const createBookingSchema = Joi.object({
  libraryId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid library ID format.',
    'string.length': 'Invalid library ID format.',
    'any.required': 'Library ID is required.',
  }),
  seat: Joi.string().max(10).optional().allow(''),
  startDate: Joi.date().iso().min('now').required().messages({
    'date.min': 'Start date cannot be in the past.',
    'any.required': 'Start date is required.',
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.greater': 'End date must be after the start date.',
    'any.required': 'End date is required.',
  }),
  shift: Joi.string().valid('Morning', 'Evening', 'Full Day').required().messages({
    'any.only': 'Shift must be one of: Morning, Evening, Full Day.',
    'any.required': 'Shift is required.',
  }),
});

// Schema for updating booking status (by owner)
const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid('Active', 'Rejected', 'Expired').required().messages({
    'any.only': 'Status must be one of: Active, Rejected, Expired.',
    'any.required': 'Status is required.',
  }),
});

module.exports = { createBookingSchema, updateBookingStatusSchema };
