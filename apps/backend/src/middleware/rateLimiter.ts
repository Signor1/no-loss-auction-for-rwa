import rateLimit from 'express-rate-limit'

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Authentication rate limiters
export const register = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration requests per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
})

export const login = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
})

export const passwordReset = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
})

export const emailVerification = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 email verification requests per hour
  message: {
    error: 'Too many email verification attempts, please try again later.',
    code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
})

// API rate limiters
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 API requests per 15 minutes
  message: {
    error: 'Too many API requests, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 upload requests per hour
  message: {
    error: 'Too many upload attempts, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
})

export const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 bid requests per minute
  message: {
    error: 'Too many bid attempts, please try again later.',
    code: 'BID_RATE_LIMIT_EXCEEDED'
  },
})

export const createAuctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 auction creation requests per hour
  message: {
    error: 'Too many auction creation attempts, please try again later.',
    code: 'CREATE_AUCTION_RATE_LIMIT_EXCEEDED'
  },
})

// Export all limiters
export const rateLimiter = {
  general: generalLimiter,
  register,
  login,
  passwordReset,
  emailVerification,
  api: apiLimiter,
  upload: uploadLimiter,
  bid: bidLimiter,
  createAuction: createAuctionLimiter
}
