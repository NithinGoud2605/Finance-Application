/**
 * Custom error classes for the application
 */

class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR', status = 400) {
    super(message, code, status);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message, code = 'AUTH_ERROR', status = 401) {
    super(message, code, status);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message, code = 'FORBIDDEN', status = 403) {
    super(message, code, status);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message, code = 'NOT_FOUND', status = 404) {
    super(message, code, status);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT', status = 409) {
    super(message, code, status);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message, code = 'DB_ERROR', status = 500) {
    super(message, code, status);
    this.name = 'DatabaseError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
}; 