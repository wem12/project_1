const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error(err.stack);
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized: Invalid or expired token';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden: Insufficient permissions';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message || 'Resource not found';
  }
  
  // Don't expose stack traces in production
  const error = {
    message,
    status: statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };
  
  // Send error response
  res.status(statusCode).json({ error });
};

module.exports = errorHandler; 