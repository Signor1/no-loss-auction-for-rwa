import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

    // Find user in database
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      })
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return res.status(401).json({
        error: 'Token is invalid due to password change',
        code: 'TOKEN_INVALID'
      })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      })
    }

    console.error('Authentication error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

// Authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      })
    }

    next()
  }
}

// Optional authentication middleware
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)
    
    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    
    if (user && user.isActive) {
      req.user = user
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.debug('Optional authentication failed:', error)
  }
  
  next()
}

// Resource ownership middleware
export const checkOwnership = (resourceField = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      })
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceField] || req.body[resourceField]
    
    if (resourceUserId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied - resource ownership required',
        code: 'ACCESS_DENIED'
      })
    }

    next()
  }
}

// API key authentication middleware
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key is required',
        code: 'API_KEY_REQUIRED'
      })
    }

    // Find API key in database (assuming you have an ApiKey model)
    const keyRecord = await User.findOne({ 
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true 
    })

    if (!keyRecord) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      })
    }

    // Update last used timestamp
    await User.updateOne(
      { 'apiKeys.key': apiKey },
      { 'apiKeys.$.lastUsed': new Date() }
    )

    // Attach user to request
    req.user = keyRecord
    next()
  } catch (error) {
    console.error('API key authentication error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

// Rate limiting middleware for authenticated users
export const authRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()
    const userRequests = requests.get(userId)

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      })
    }

    userRequests.count++
    next()
  }
}

// Two-factor authentication middleware
export const require2FA = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    })
  }

  if (req.user.twoFactorEnabled && !req.session?.twoFactorVerified) {
    return res.status(403).json({
      error: 'Two-factor authentication required',
      code: 'TWO_FACTOR_REQUIRED'
    })
  }

  next()
}

// Email verification middleware
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    })
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    })
  }

  next()
}

// KYC verification middleware
export const requireKYC = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    })
  }

  if (!req.user.kycVerified) {
    return res.status(403).json({
      error: 'KYC verification required',
      code: 'KYC_REQUIRED'
    })
  }

  next()
}

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'no-loss-auction',
    audience: process.env.JWT_AUDIENCE || 'no-loss-auction-users'
  })
}

// Generate refresh token
export const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  }

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  })
}

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload
}

// Generate password reset token
export const generatePasswordResetToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'password-reset'
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h'
  })
}

// Generate email verification token
export const generateEmailVerificationToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'email-verification'
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  })
}

// Generate API key
export const generateApiKey = (): string => {
  const bytes = require('crypto').randomBytes(32)
  return bytes.toString('hex')
}
