import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import assetRoutes from './routes/assets'
import paymentRoutes from './routes/payments'
import financialRoutes from './routes/financial'

import auctionRoutes from './routes/auctions'
import bidRoutes from './routes/bids'
import transactionRoutes from './routes/transactions'
import analyticsRoutes from './routes/analytics'
import uploadRoutes from './routes/upload'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { authenticate } from './middleware/auth'
import { validateRequest } from './middleware/validation'
import { rateLimiter } from './middleware/rateLimiter'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = createServer(app)

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// General middleware
app.use(compression())
app.use(morgan('combined'))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authenticate, userRoutes)
app.use('/api/assets', authenticate, assetRoutes)
app.use('/api/payments', authenticate, paymentRoutes)
app.use('/api/financial', authenticate, financialRoutes)


// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'No-Loss Auction API',
    version: '1.0.0',
    description: 'RESTful API for No-Loss Auction platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      assets: '/api/assets',
      auctions: '/api/auctions',
      bids: '/api/bids',
      transactions: '/api/transactions',
      analytics: '/api/analytics',
      upload: '/api/upload',
      financial: '/api/financial'
    },
    documentation: `${process.env.API_URL || 'http://localhost:5000'}/api/docs/swagger`
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`)
  })

  // Handle auction updates
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`)
  })

  // Handle bid updates
  socket.on('join-bid-room', (bidId) => {
    socket.join(`bid-${bidId}`)
  })

  // Handle real-time notifications
  socket.on('join-notifications', (userId) => {
    socket.join(`notifications-${userId}`)
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Export io for use in other modules
export { io }

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`API Documentation: http://localhost:${PORT}/api/docs`)
})

export default app
