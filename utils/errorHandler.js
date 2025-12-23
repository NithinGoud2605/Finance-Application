class AppError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    // Keep status as descriptive string for API responses, but ensure statusCode is always numeric for HTTP
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleSequelizeError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    return new AppError(
      error.errors.map(e => e.message).join(', '),
      'VALIDATION_ERROR',
      400
    );
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return new AppError(
      'A record with this information already exists',
      'DUPLICATE_ENTRY',
      409
    );
  }
  return error;
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production mode
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        code: err.code
      });
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

module.exports = {
  AppError,
  handleSequelizeError,
  errorHandler
}; 