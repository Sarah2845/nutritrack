const R = require('ramda');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Error:', err.message);
  
  // Create immutable error object
  const error = Object.freeze({
    message: err.message || 'An unexpected error occurred',
    status: err.status || 500,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
  
  // Send error response to client
  res.status(error.status).json({
    error: {
      message: error.message,
      ...(error.stack && { stack: error.stack })
    }
  });
};

// Custom error class for better error handling
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
