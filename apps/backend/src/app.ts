import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import hpp from 'hpp'
import mongoSanitize from 'mongo-sanitize'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cookieSession from 'cookie-session'
import csurf from 'csurf'
import dotenv from 'dotenv'
import * as Sentry from "@sentry/node"
import mongoose from 'mongoose'
import logger from './utils/logger'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import assetRoutes from './routes/assets'
import paymentRoutes from './routes/payments'
import financialRoutes from './routes/financial'
import coinbaseWebhookRoutes from './routes/coinbaseWebhook'
import complianceRoutes from './routes/compliance'
import securityRoutes from './routes/security'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { authenticate } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'

// Create Express app
const app: express.Application = express()

// Initialize Sentry after app is created
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
})

const server = createServer(app)

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// General Rate limiting & Slow down
const generalSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: (hits) => hits * 100, // begin adding 100ms of delay per request after 50
})

const generalLimiter = rateLimit({
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

// Sentry RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

// General middleware
app.use(compression())
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) }
}))
app.use(generalSpeedLimiter)
app.use(generalLimiter)
app.use(hpp()) // Prevent HTTP Parameter Pollution
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Session configuration for CSRF
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'secret-key'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax'
}))

// CSRF protection
const csrfProtection = csurf({ cookie: false })
app.use(csrfProtection)

// Provide CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Sanitize NoSQL queries
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body)
  if (req.query) req.query = mongoSanitize(req.query)
  if (req.params) req.params = mongoSanitize(req.params)
  next()
})

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN'

  const status = dbStatus === 'UP' ? 200 : 503

  res.status(status).json({
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbStatus,
    }
  })
})

// API routes
app.use('/api/auth', rateLimiter.login, authRoutes)
app.use('/api/users', authenticate, userRoutes)
app.use('/api/assets', authenticate, assetRoutes)
app.use('/api/payments', authenticate, paymentRoutes)
app.use('/api/financial', authenticate, financialRoutes)
app.use('/api/webhooks/coinbase', coinbaseWebhookRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/security', securityRoutes)


// API documentation endpoint
app.get('/api/docs', (_req, res) => {
  res.json({
    title: 'No-Loss Auction API',
    version: '1.0.0',
    description: 'RESTful API for No-Loss Auction platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      assets: '/api/assets',
      financial: '/api/financial'
    },
    documentation: `${process.env.API_URL || 'http://localhost:5000'}/api/docs/swagger`
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`)

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
    logger.info(`User connected: ${socket.id}`)
  })
})

// Export io for use in other modules
export { io }

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler())

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`API Documentation: http://localhost:${PORT}/api/docs`)
})

export default app
