import { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { rateLimiter } from '../middleware/rateLimiter'
import { errorHandler } from '../middleware/errorHandler'

// GraphQL context interface
export interface GraphQLContext {
  user?: any
  req: Request
  res: Response
  pubsub: any
  loaders: any
}

// Authentication middleware for GraphQL
export const graphqlAuth = async (req: Request, res: Response, next: any) => {
  try {
    const user = await authenticate(req, res, next)
    req.user = user
    next()
  } catch (error) {
    console.error('GraphQL authentication error:', error)
    next()
  }
}

// Rate limiting middleware for GraphQL
export const graphqlRateLimit = rateLimiter.api

// Query complexity analysis
export const queryComplexity = (maxComplexity: number = 1000) => {
  return (req: Request, res: Response, next: any) => {
    // Store original res.json
    const originalJson = res.json
    
    // Override res.json to analyze response
    res.json = (data: any) => {
      if (data && data.errors) {
        // Analyze query complexity from errors
        const complexityError = data.errors.find((error: any) => 
          error.message && error.message.includes('complexity')
        )
        
        if (complexityError) {
          return res.status(429).json({
            error: 'Query complexity exceeds maximum allowed',
            code: 'QUERY_COMPLEXITY_EXCEEDED',
            maxComplexity,
            timestamp: new Date().toISOString()
          })
        }
      }
      
      return originalJson.call(res, data)
    }
    
    next()
  }
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('GraphQL Request:', logData)
    }
  })
  
  next()
}

// Subscription authentication
export const subscriptionAuth = async (connectionParams: any, websocket: any, context: any) => {
  if (connectionParams && connectionParams.authorization) {
    try {
      const token = connectionParams.authorization.replace('Bearer ', '')
      // Verify JWT token here
      const user = await verifyToken(token)
      return { user }
    } catch (error) {
      console.error('WebSocket authentication error:', error)
      throw new Error('Authentication failed')
    }
  }
  
  return {}
}

// Token verification helper
const verifyToken = async (token: string) => {
  // Implement JWT verification logic
  // This would use the same logic as in auth middleware
  return null // Placeholder
}

// CORS middleware for GraphQL
export const graphqlCors = (req: Request, res: Response, next: any) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Apollo-Tracing')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  
  next()
}

// Request validation middleware
export const requestValidation = (req: Request, res: Response, next: any) => {
  // Validate GraphQL-specific headers
  const contentType = req.get('Content-Type')
  
  if (req.method === 'POST' && !contentType) {
    return res.status(400).json({
      error: 'Content-Type header is required',
      code: 'MISSING_CONTENT_TYPE'
    })
  }
  
  if (req.method === 'POST' && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
    return res.status(400).json({
      error: 'Invalid Content-Type. Must be application/json or multipart/form-data',
      code: 'INVALID_CONTENT_TYPE'
    })
  }
  
  // Validate request size
  const contentLength = req.get('Content-Length')
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      code: 'REQUEST_TOO_LARGE',
      maxSize: `${maxSize / 1024 / 1024}MB`
    })
  }
  
  next()
}

// Response headers middleware
export const responseHeaders = (req: Request, res: Response, next: any) => {
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('X-Frame-Options', 'DENY')
  res.header('X-XSS-Protection', '1; mode=block')
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // GraphQL specific headers
  res.header('X-GraphQL-Enabled', 'true')
  res.header('X-GraphQL-Version', '1.0')
  
  next()
}

// Error handling middleware for GraphQL
export const graphqlErrorHandler = (error: any, req: Request, res: Response, next: any) => {
  console.error('GraphQL Error:', {
    message: error.message,
    stack: error.stack,
    query: req.body?.query,
    variables: req.body?.variables,
    operationName: req.body?.operationName,
    timestamp: new Date().toISOString()
  })
  
  // Format GraphQL errors
  const formattedError = {
    message: error.message,
    code: error.code || 'INTERNAL_ERROR',
    path: error.path,
    locations: error.locations,
    extensions: {
      code: error.code,
      exception: error.extensions?.exception,
      timestamp: new Date().toISOString()
    }
  }
  
  // Send error response
  res.status(500).json({
    errors: [formattedError],
    data: null,
    timestamp: new Date().toISOString()
  })
}

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: any) => {
  const start = process.hrtime.bigint()
  
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1000000 // Convert to milliseconds
    
    // Log performance metrics
    if (duration > 1000) { // Log slow queries
      console.warn('Slow GraphQL query detected:', {
        duration: `${duration}ms`,
        query: req.body?.query,
        variables: req.body?.variables,
        operationName: req.body?.operationName,
        timestamp: new Date().toISOString()
      })
    }
    
    // Add performance header
    res.header('X-Response-Time', `${duration}ms`)
  })
  
  next()
}

// Cache control middleware
export const cacheControl = (req: Request, res: Response, next: any) => {
  // Set cache headers for GraphQL responses
  if (req.method === 'GET') {
    res.header('Cache-Control', 'public, max-age=300') // 5 minutes
  } else {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', '0')
  }
  
  next()
}

// Health check middleware
export const healthCheck = (req: Request, res: Response, next: any) => {
  if (req.path === '/graphql/health') {
    res.status(200).json({
      status: 'ok',
      message: 'GraphQL server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    })
    return
  }
  
  next()
}

// Metrics endpoint middleware
export const metricsEndpoint = (req: Request, res: Response, next: any) => {
  if (req.path === '/graphql/metrics') {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      graphql: {
        // Add GraphQL-specific metrics here
        queries: 0,
        mutations: 0,
        subscriptions: 0,
        errors: 0,
        averageResponseTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    }
    
    res.json(metrics)
    return
  }
  
  next()
}

// Schema introspection middleware
export const schemaIntrospection = (req: Request, res: Response, next: any) => {
  if (req.path === '/graphql/schema') {
    // Return schema in JSON format
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify({
      __schema: {
        // Add schema introspection data here
      }
    }, null, 2))
    return
  }
  
  next()
}

// Combine all GraphQL middleware
export const graphqlMiddleware = [
  healthCheck,
  metricsEndpoint,
  schemaIntrospection,
  graphqlCors,
  requestValidation,
  responseHeaders,
  performanceMonitor,
  cacheControl,
  requestLogger,
  graphqlRateLimit,
  queryComplexity,
  graphqlErrorHandler
]

export default {
  graphqlAuth,
  graphqlRateLimit,
  queryComplexity,
  requestLogger,
  subscriptionAuth,
  graphqlCors,
  requestValidation,
  responseHeaders,
  graphqlErrorHandler,
  performanceMonitor,
  cacheControl,
  healthCheck,
  metricsEndpoint,
  schemaIntrospection,
  graphqlMiddleware
}
