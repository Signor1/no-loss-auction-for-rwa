import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public code?: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

// Validation error class
export class ValidationError extends AppError {
  public details: any

  constructor(message: string, details: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ')
    error = new ValidationError(message, err.errors)
  }

  // Mongoose duplicate key error
  if (err instanceof mongoose.Error && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0]
    const value = (err as any).keyValue[field]
    error = new ConflictError(`${field} '${value}' already exists`)
  }

  // Mongoose cast error
  if (err instanceof mongoose.Error.CastError) {
    error = new ValidationError('Invalid data format', {
      field: err.path,
      value: err.value
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token')
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired')
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      error = new ValidationError('File too large', {
        maxSize: '10MB'
      })
    } else if ((err as any).code === 'LIMIT_FILE_COUNT') {
      error = new ValidationError('Too many files', {
        maxFiles: '5'
      })
    } else {
      error = new ValidationError('File upload error', {
        code: (err as any).code
      })
    }
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500
  }

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      error: error.message,
      code: (error as any).code,
      stack: error.stack,
      details: (error as ValidationError).details,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    })
  } else {
    // Production error response
    if (error.isOperational) {
      res.status(error.statusCode).json({
        error: error.message,
        code: (error as any).code,
        timestamp: new Date().toISOString()
      })
    } else {
      // Don't leak error details in production
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

// Error logging utility
export const logError = (error: Error, context: string = '') => {
  const logData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', logData)
  } else {
    // In production, you would send this to a logging service
    console.error('Error:', error.message)
  }
}

// Error response formatter
export const formatErrorResponse = (error: AppError) => {
  const response: any = {
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  }

  if (error instanceof ValidationError) {
    response.details = error.details
  }

  return response
}

// Error types enum
export enum ErrorTypes {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  INTERNAL = 'INTERNAL_ERROR',
  DATABASE = 'DATABASE_ERROR',
  NETWORK = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
  BLOCKCHAIN = 'BLOCKCHAIN_ERROR'
}

// Error messages
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_REQUIRED: 'Access token is required',
  TOKEN_EXPIRED: 'Access token has expired',
  TOKEN_INVALID: 'Invalid access token',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  TWO_FACTOR_REQUIRED: 'Two-factor authentication required',
  EMAIL_VERIFICATION_REQUIRED: 'Email verification required',
  KYC_REQUIRED: 'KYC verification required',

  // Authorization
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RESOURCE_OWNERSHIP_REQUIRED: 'Resource ownership required',

  // Validation
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_ETHEREUM_ADDRESS: 'Invalid Ethereum address',
  INVALID_PHONE_NUMBER: 'Invalid phone number',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File too large',

  // Not found
  USER_NOT_FOUND: 'User not found',
  AUCTION_NOT_FOUND: 'Auction not found',
  BID_NOT_FOUND: 'Bid not found',
  ASSET_NOT_FOUND: 'Asset not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',

  // Conflict
  USER_EXISTS: 'User already exists',
  AUCTION_EXISTS: 'Auction already exists',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  BID_ALREADY_PLACED: 'Bid already placed',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',

  // General
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error',
  NETWORK_ERROR: 'Network error',
  TIMEOUT_ERROR: 'Request timeout',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
}
