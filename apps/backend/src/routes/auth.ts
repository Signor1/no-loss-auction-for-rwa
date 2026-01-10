import express from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User'
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generatePasswordResetToken,
  generateEmailVerificationToken
} from '../middleware/auth'
import { sendEmail } from '../services/email'
import { rateLimiter } from '../middleware/rateLimiter'
import { io } from '../app'

const router = express.Router()

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('walletAddress')
    .optional()
    .isEthereumAddress()
    .withMessage('Valid Ethereum address is required')
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
]

// Register new user
router.post('/register', registerValidation, rateLimiter.register, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password, firstName, lastName, walletAddress } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      walletAddress,
      role: 'user',
      isActive: true,
      emailVerified: false,
      twoFactorEnabled: false,
      kycVerified: false
    })

    await user.save()

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(user)

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email address',
        template: 'email-verification',
        data: {
          firstName,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
    }

    // Generate tokens
    const accessToken = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    // Store refresh token
    user.refreshTokens.push(refreshToken)
    await user.save()

    // Emit user registered event
    io.emit('user-registered', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        kycVerified: user.kycVerified,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Login user
router.post('/login', loginValidation, rateLimiter.login, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Generate tokens
    const accessToken = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    // Store refresh token (limit to 5 tokens per user)
    user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken]
    await user.save()

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Emit login event
    io.emit('user-login', {
      userId: user.id,
      timestamp: new Date()
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        kycVerified: user.kycVerified,
        lastLoginAt: user.lastLoginAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      })
    }

    // Generate new access token
    const accessToken = generateToken(user)

    res.json({
      accessToken
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    })
  }
})

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      })
    }

    // Find user and remove refresh token
    const user = await User.findOne({ refreshTokens: refreshToken })
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken)
      await user.save()
    }

    res.json({
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Logout from all devices
router.post('/logout-all', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      })
    }

    // Find user and clear all refresh tokens
    const user = await User.findOne({ refreshTokens: refreshToken })
    if (user) {
      user.refreshTokens = []
      await user.save()
    }

    res.json({
      message: 'Logged out from all devices'
    })
  } catch (error) {
    console.error('Logout all error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Request password reset
router.post('/forgot-password', resetPasswordValidation, rateLimiter.passwordReset, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent'
      })
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user)

    // Store reset token and expiration
    user.passwordResetToken = resetToken
    user.passwordResetExpires = new Date(Date.now() + 3600000) // 1 hour
    await user.save()

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        template: 'password-reset',
        data: {
          firstName: user.firstName,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        }
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
      return res.status(500).json({
        error: 'Failed to send reset email',
        code: 'EMAIL_SEND_FAILED'
      })
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Reset password
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { token, newPassword } = req.body

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password and clear reset token
    user.password = hashedPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.passwordChangedAt = new Date()
    user.refreshTokens = [] // Invalidate all refresh tokens
    await user.save()

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset successful',
        template: 'password-reset-confirmation',
        data: {
          firstName: user.firstName
        }
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    res.json({
      message: 'Password reset successful'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Change password
router.post('/change-password', changePasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { currentPassword, newPassword } = req.body

    // This endpoint should be protected by authentication middleware
    const user = req.user
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    user.password = hashedPassword
    user.passwordChangedAt = new Date()
    user.refreshTokens = [] // Invalidate all refresh tokens
    await user.save()

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password changed successfully',
        template: 'password-change-confirmation',
        data: {
          firstName: user.firstName
        }
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    res.json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Verify email
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { token } = req.body

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      })
    }

    // Verify email
    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Email verified successfully',
        template: 'email-verification-confirmation',
        data: {
          firstName: user.firstName
        }
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    res.json({
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

// Resend verification email
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], rateLimiter.emailVerification, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        message: 'If an account with that email exists, a verification email has been sent'
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email is already verified',
        code: 'EMAIL_ALREADY_VERIFIED'
      })
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(user)

    // Store token and expiration
    user.emailVerificationToken = verificationToken
    user.emailVerificationExpires = new Date(Date.now() + 86400000) // 24 hours
    await user.save()

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email address',
        template: 'email-verification',
        data: {
          firstName: user.firstName,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return res.status(500).json({
        error: 'Failed to send verification email',
        code: 'EMAIL_SEND_FAILED'
      })
    }

    res.json({
      message: 'If an account with that email exists, a verification email has been sent'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
})

export default router
