import express, { Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { User } from '../models/User'
import { authenticate, authorize, checkOwnership } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { upload } from '../services/upload'
import { io } from '../app'
import * as userSecurityController from '../controllers/userSecurityController'

const router = express.Router()

// User Security
router.post('/security/2fa/setup', authenticate, userSecurityController.setup2FA)
router.post('/security/2fa/verify', authenticate, userSecurityController.verify2FA)
router.get('/security/recovery-codes', authenticate, userSecurityController.getRecoveryCodes)
router.get('/security/check-url', authenticate, userSecurityController.checkUrl)

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      walletAddress: user.walletAddress,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      kycVerified: user.kycVerified,
      profile: user.profile,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLoginAt: user.security.lastLoginAt
    }
  })
}))

// Update user profile
router.put('/profile', [
  authenticate,
  validateRequest,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be no more than 500 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('country')
    .optional()
    .matches(/^[A-Z]{2}$/)
    .withMessage('Invalid country code'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('preferences.language')
    .optional()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language code'),
  body('preferences.timezone')
    .optional()
    .isString()
    .withMessage('Invalid timezone'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false'),
  body('preferences.privacy.showProfile')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false'),
  body('preferences.privacy.showActivity')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false'),
  body('preferences.privacy.allowMessages')
    .optional()
    .isBoolean()
    .withMessage('Must be true or false')
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const updates = req.body

  // Update user profile
  Object.keys(updates).forEach(key => {
    if (key.startsWith('profile.')) {
      const profileKey = key.substring(8)
      user.profile[profileKey as keyof typeof user.profile] = updates[key]
    } else if (key.startsWith('preferences.')) {
      const prefKey = key.substring(12)
      if (prefKey.includes('.')) {
        const [category, setting] = prefKey.split('.')
        user.preferences[category as keyof typeof user.preferences][setting as keyof typeof user.preferences.notifications] = updates[key]
      } else {
        user.preferences[prefKey as keyof typeof user.preferences] = updates[key]
      }
    } else if (['firstName', 'lastName'].includes(key)) {
      user[key] = updates[key]
    }
  })

  await user.save()

  // Emit profile update event
  io.emit('user-profile-updated', {
    userId: user.id,
    updates: Object.keys(updates),
    timestamp: new Date()
  })

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      walletAddress: user.walletAddress,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      kycVerified: user.kycVerified,
      profile: user.profile,
      preferences: user.preferences,
      updatedAt: user.updatedAt
    }
  })
}))

// Upload profile picture
router.post('/profile/picture', [
  authenticate,
  upload.single('avatar'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!

  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE_UPLOADED'
    })
  }

  // Update user avatar
  user.profile.avatar = req.file.filename
  await user.save()

  res.json({
    message: 'Profile picture uploaded successfully',
    avatar: req.file.filename
  })
}))

// Get user by ID (public profile)
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const user = await User.findById(id).select('-password -refreshTokens -emailVerificationToken -passwordResetToken -twoFactorSecret')

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    })
  }

  // Check privacy settings
  const showProfile = user.preferences.privacy.showProfile
  const isOwner = req.user?.id === user.id
  const isAdmin = req.user?.role === 'admin'

  if (!showProfile && !isOwner && !isAdmin) {
    return res.status(403).json({
      error: 'Profile is private',
      code: 'PROFILE_PRIVATE'
    })
  }

  // Return public profile information
  const publicProfile = {
    id: user.id,
    fullName: user.fullName,
    profile: {
      avatar: user.profile.avatar,
      bio: user.preferences.privacy.showProfile ? user.profile.bio : undefined,
      country: user.preferences.privacy.showProfile ? user.profile.country : undefined
    },
    role: user.role,
    emailVerified: user.emailVerified,
    kycVerified: user.kycVerified,
    createdAt: user.createdAt
  }

  // Add additional info for owner or admin
  if (isOwner || isAdmin) {
    Object.assign(publicProfile, {
      email: user.email,
      walletAddress: user.walletAddress,
      twoFactorEnabled: user.twoFactorEnabled,
      preferences: user.preferences,
      security: {
        lastLoginAt: user.security.lastLoginAt,
        loginAttempts: user.security.loginAttempts
      }
    })
  }

  res.json({
    user: publicProfile
  })
}))

// Update user wallet address
router.put('/wallet', [
  authenticate,
  validateRequest,
  body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address')
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const { walletAddress } = req.body

  // Check if wallet address is already in use
  const existingUser = await User.findOne({
    walletAddress: walletAddress.toLowerCase(),
    _id: { $ne: user.id }
  })

  if (existingUser) {
    return res.status(409).json({
      error: 'Wallet address is already in use',
      code: 'WALLET_ADDRESS_IN_USE'
    })
  }

  // Update user wallet address
  user.walletAddress = walletAddress.toLowerCase()
  await user.save()

  // Emit wallet update event
  io.emit('user-wallet-updated', {
    userId: user.id,
    walletAddress: user.walletAddress,
    timestamp: new Date()
  })

  res.json({
    message: 'Wallet address updated successfully',
    walletAddress: user.walletAddress
  })
}))

// Get user statistics
router.get('/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!

  // Get user statistics (placeholder - would be calculated from actual data)
  const stats = {
    auctions: {
      created: 0,
      participated: 0,
      won: 0,
      active: 0
    },
    bids: {
      total: 0,
      totalAmount: 0,
      averageAmount: 0,
      successRate: 0
    },
    transactions: {
      total: 0,
      totalVolume: 0,
      successful: 0,
      failed: 0
    },
    portfolio: {
      totalValue: 0,
      assets: 0,
      categories: []
    },
    activity: {
      lastLogin: user.security.lastLoginAt,
      totalLogins: 0,
      avgSessionDuration: 0
    }
  }

  res.json({
    stats
  })
}))

// Get user activity
router.get('/activity', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['auction', 'bid', 'transaction', 'profile']).withMessage('Invalid activity type'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const type = req.query.type as string

  // Get user activity (placeholder - would fetch from actual activity logs)
  const activities = {
    items: [],
    pagination: {
      page,
      limit,
      total: 0,
      pages: 0
    }
  }

  res.json({
    activities
  })
}))

// Delete user account
router.delete('/account', [
  authenticate,
  validateRequest,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('confirmation')
    .equals('DELETE')
    .withMessage('Confirmation must be "DELETE"')
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const { password } = req.body

  // Verify password
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    return res.status(400).json({
      error: 'Invalid password',
      code: 'INVALID_PASSWORD'
    })
  }

  // Soft delete user (deactivate account)
  user.isActive = false
  user.email = `deleted_${user.id}_${Date.now()}@deleted.com`
  user.walletAddress = undefined
  user.refreshTokens = []
  await user.save()

  // Emit account deletion event
  io.emit('user-account-deleted', {
    userId: user.id,
    timestamp: new Date()
  })

  res.json({
    message: 'Account deleted successfully'
  })
}))

// Admin routes

// Get all users (admin only)
router.get('/', [
  authenticate,
  authorize('admin'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'active']).withMessage('Invalid status'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string
  const role = req.query.role as string
  const status = req.query.status as string

  // Build query
  const query: any = {}

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  if (role) {
    query.role = role
  }

  if (status) {
    query.isActive = status === 'active'
  }

  // Get users
  const users = await User.find(query)
    .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -twoFactorSecret')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  const total = await User.countDocuments(query)

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

// Update user role (admin only)
router.put('/:id/role', [
  authenticate,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { role } = req.body

  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    })
  }

  // Prevent admin from changing their own role
  if (user.id === req.user!.id) {
    return res.status(400).json({
      error: 'Cannot change your own role',
      code: 'CANNOT_CHANGE_OWN_ROLE'
    })
  }

  user.role = role
  await user.save()

  // Emit role update event
  io.emit('user-role-updated', {
    userId: user.id,
    role: user.role,
    updatedBy: req.user!.id,
    timestamp: new Date()
  })

  res.json({
    message: 'User role updated successfully',
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  })
}))

// Deactivate/activate user (admin only)
router.put('/:id/status', [
  authenticate,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be true or false'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { isActive } = req.body

  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    })
  }

  // Prevent admin from deactivating themselves
  if (user.id === req.user!.id) {
    return res.status(400).json({
      error: 'Cannot change your own status',
      code: 'CANNOT_CHANGE_OWN_STATUS'
    })
  }

  user.isActive = isActive
  await user.save()

  // Clear refresh tokens if deactivating
  if (!isActive) {
    user.refreshTokens = []
    await user.save()
  }

  // Emit status update event
  io.emit('user-status-updated', {
    userId: user.id,
    isActive: user.isActive,
    updatedBy: req.user!.id,
    timestamp: new Date()
  })

  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive
    }
  })
}))

export default router
