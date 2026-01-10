import express, { Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { Asset } from '../models/Asset'
import { authenticate, authorize, checkOwnership } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { upload } from '../services/upload'
import { io } from '../app'

const router = express.Router()

// Create new asset
router.post('/', [
  authenticate,
  validateRequest,
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .isIn(['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'watches', 'furniture', 'books', 'music', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be no more than 50 characters'),
  body('condition')
    .isIn(['new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('location.country')
    .matches(/^[A-Z]{2}$/)
    .withMessage('Invalid country code'),
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be no more than 200 characters'),
  body('location.coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object'),
  body('valuation.estimatedValue')
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),
  body('valuation.currency')
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'BRL', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'RUB', 'ZAR', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES', 'ETH', 'BTC'])
    .withMessage('Invalid currency'),
  body('metadata.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('metadata.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'unlisted'])
    .withMessage('Invalid visibility'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false')
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const assetData = req.body

  // Set ownership
  assetData.ownership = {
    currentOwner: user.id,
    ownershipHistory: [{
      owner: user.id,
      acquisitionDate: new Date(),
      acquisitionMethod: 'created'
    }]
  }

  // Create asset
  const asset = new Asset(assetData)
  await asset.save()

  // Emit asset created event
  io.emit('asset-created', {
    assetId: asset.id,
    ownerId: user.id,
    title: asset.title,
    category: asset.category,
    timestamp: new Date()
  })

  res.status(201).json({
    message: 'Asset created successfully',
    asset
  })
}))

// Upload asset images
router.post('/:id/images', [
  authenticate,
  upload.array('images', 10),
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check ownership
  if (asset.ownership.currentOwner !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No images uploaded',
      code: 'NO_IMAGES_UPLOADED'
    })
  }

  // Add images to asset
  const newImages = (req.files as Express.Multer.File[]).map((file, index) => ({
    url: file.filename,
    alt: file.originalname,
    order: asset.images.length + index,
    isPrimary: asset.images.length === 0 && index === 0 // First image is primary if no primary exists
  }))

  asset.images.push(...newImages)
  await asset.save()

  res.json({
    message: 'Images uploaded successfully',
    images: newImages
  })
}))

// Upload asset videos
router.post('/:id/videos', [
  authenticate,
  upload.single('video'),
  param('id').isMongoId().withMessage('Invalid asset ID'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!
  const { title, duration } = req.body

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check ownership
  if (asset.ownership.currentOwner !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
  }

  if (!req.file) {
    return res.status(400).json({
      error: 'No video uploaded',
      code: 'NO_VIDEO_UPLOADED'
    })
  }

  // Add video to asset
  const newVideo = {
    url: req.file.filename,
    title,
    duration,
    thumbnail: req.file.filename.replace(/\.[^/.]+$/, '_thumb.jpg')
  }

  asset.videos = asset.videos || []
  asset.videos.push(newVideo)
  await asset.save()

  res.json({
    message: 'Video uploaded successfully',
    video: newVideo
  })
}))

// Upload asset documents
router.post('/:id/documents', [
  authenticate,
  upload.array('documents', 5),
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check ownership
  if (asset.ownership.currentOwner !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No documents uploaded',
      code: 'NO_DOCUMENTS_UPLOADED'
    })
  }

  // Add documents to asset
  const newDocuments = (req.files as Express.Multer.File[]).map((file) => ({
    title: file.originalname,
    url: file.filename,
    type: file.mimetype,
    size: file.size
  }))

  asset.documents = asset.documents || []
  asset.documents.push(...newDocuments)
  await asset.save()

  res.json({
    message: 'Documents uploaded successfully',
    documents: newDocuments
  })
}))

// Get all assets (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'watches', 'furniture', 'books', 'music', 'sports', 'other']).withMessage('Invalid category'),
  query('condition').optional().isIn(['new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'sold', 'withdrawn']).withMessage('Invalid status'),
  query('visibility').optional().isIn(['public', 'private', 'unlisted']).withMessage('Invalid visibility'),
  query('featured').optional().isBoolean().withMessage('Featured must be true or false'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('location').optional().isString().withMessage('Location must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title', 'views', 'likes', 'valuation.estimatedValue']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  // Build query
  const query: any = {
    visibility: 'public',
    status: 'approved'
  }

  // Add filters
  if (req.query.category) {
    query.category = req.query.category
  }

  if (req.query.condition) {
    query.condition = req.query.condition
  }

  if (req.query.featured) {
    query.featured = req.query.featured === 'true'
  }

  if (req.query.location) {
    query['location.country'] = req.query.location
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query['valuation.estimatedValue'] = {}
    if (req.query.minPrice) {
      query['valuation.estimatedValue'].$gte = parseFloat(req.query.minPrice as string)
    }
    if (req.query.maxPrice) {
      query['valuation.estimatedValue'].$lte = parseFloat(req.query.maxPrice as string)
    }
  }

  // Search functionality
  let searchQuery = Asset.find(query)
  if (req.query.search) {
    searchQuery = Asset.searchAssets(req.query.search as string, {
      category: req.query.category,
      condition: req.query.condition,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string
    })
  }

  // Sorting
  const sortBy = req.query.sortBy || 'createdAt'
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1
  const sort: any = { [sortBy]: sortOrder }

  // Execute query
  const assets = await searchQuery
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('ownership.currentOwner', 'firstName lastName email')

  const total = await Asset.countDocuments(query)

  res.json({
    assets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

// Get asset by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const asset = await Asset.findById(id)
    .populate('ownership.currentOwner', 'firstName lastName email')
    .populate('ownership.ownershipHistory.owner', 'firstName lastName email')

  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check visibility
  if (asset.visibility === 'private' && (!req.user || asset.ownership.currentOwner !== req.user.id)) {
    return res.status(403).json({
      error: 'Asset is private',
      code: 'ASSET_PRIVATE'
    })
  }

  // Increment views
  if (asset.visibility === 'public') {
    await asset.incrementViews()
  }

  res.json({
    asset
  })
}))

// Update asset
router.put('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isIn(['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'watches', 'furniture', 'books', 'music', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('valuation.estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),
  body('valuation.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'BRL', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'RUB', 'ZAR', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES', 'ETH', 'BTC'])
    .withMessage('Invalid currency'),
  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'sold', 'withdrawn'])
    .withMessage('Invalid status'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'unlisted'])
    .withMessage('Invalid visibility'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false')
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!
  const updates = req.body

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check ownership or admin
  if (asset.ownership.currentOwner !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
  }

  // Update asset
  Object.keys(updates).forEach(key => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      ;(asset as any)[parent][child] = updates[key]
    } else {
      ;(asset as any)[key] = updates[key]
    }
  })

  await asset.save()

  // Emit asset updated event
  io.emit('asset-updated', {
    assetId: asset.id,
    updates: Object.keys(updates),
    updatedBy: user.id,
    timestamp: new Date()
  })

  res.json({
    message: 'Asset updated successfully',
    asset
  })
}))

// Delete asset
router.delete('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check ownership or admin
  if (asset.ownership.currentOwner !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
  }

  await Asset.findByIdAndDelete(id)

  // Emit asset deleted event
  io.emit('asset-deleted', {
    assetId: id,
    deletedBy: user.id,
    timestamp: new Date()
  })

  res.json({
    message: 'Asset deleted successfully'
  })
}))

// Like/unlike asset
router.post('/:id/like', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check if asset is public
  if (asset.visibility !== 'public') {
    return res.status(403).json({
      error: 'Cannot like private asset',
      code: 'CANNOT_LIKE_PRIVATE'
    })
  }

  await asset.incrementLikes()

  // Emit asset liked event
  io.emit('asset-liked', {
    assetId: asset.id,
    userId: user.id,
    timestamp: new Date()
  })

  res.json({
    message: 'Asset liked successfully',
    likes: asset.likes
  })
}))

// Share asset
router.post('/:id/share', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid asset ID'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  // Check if asset is public
  if (asset.visibility !== 'public') {
    return res.status(403).json({
      error: 'Cannot share private asset',
      code: 'CANNOT_SHARE_PRIVATE'
    })
  }

  await asset.incrementShares()

  // Emit asset shared event
  io.emit('asset-shared', {
    assetId: asset.id,
    userId: user.id,
    timestamp: new Date()
  })

  res.json({
    message: 'Asset shared successfully',
    shares: asset.shares,
    shareUrl: `${process.env.FRONTEND_URL}/assets/${id}`
  })
}))

// Get user's assets
router.get('/my/assets', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'sold', 'withdrawn']).withMessage('Invalid status'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const query: any = {
    'ownership.currentOwner': user.id
  }

  if (req.query.status) {
    query.status = req.query.status
  }

  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await Asset.countDocuments(query)

  res.json({
    assets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

// Admin routes

// Get all assets (admin only)
router.get('/admin/all', [
  authenticate,
  authorize('admin'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'sold', 'withdrawn']).withMessage('Invalid status'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const query: any = {}
  if (req.query.status) {
    query.status = req.query.status
  }

  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('ownership.currentOwner', 'firstName lastName email')

  const total = await Asset.countDocuments(query)

  res.json({
    assets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

// Approve/reject asset (admin only)
router.put('/:id/status', [
  authenticate,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid asset ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  validateRequest
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, reason } = req.body

  const asset = await Asset.findById(id)
  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    })
  }

  asset.status = status
  if (status === 'approved' && !asset.publishedAt) {
    asset.publishedAt = new Date()
  }

  await asset.save()

  // Emit asset status updated event
  io.emit('asset-status-updated', {
    assetId: asset.id,
    status,
    reason,
    updatedBy: req.user!.id,
    timestamp: new Date()
  })

  res.json({
    message: `Asset ${status} successfully`,
    asset
  })
}))

export default router
