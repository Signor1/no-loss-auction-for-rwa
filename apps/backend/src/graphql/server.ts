import { ApolloServer } from 'apollo-server-express'
import { createServer } from 'http'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphqlUploadExpress } from 'graphql-upload'
import express from 'express'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import { PubSub } from 'graphql-subscriptions'
import { authenticate } from '../middleware/auth'
import { rateLimiter } from '../middleware/rateLimiter'
import { errorHandler } from '../middleware/errorHandler'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'

// Create executable schema
const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// Create PubSub instance
const pubsub = new PubSub()

// Context creation
const createContext = async ({ req, connection }: any) => {
  if (connection) {
    // WebSocket connection context
    return {
      pubsub,
      user: connection.context.user,
    }
  }

  // HTTP request context
  const user = await authenticate(req, {}, () => {})
  return {
    pubsub,
    user,
    req,
  }
}

// Query complexity analysis
const createComplexityLimit = (maxComplexity: number) => {
  return (type: any, fieldName: string, childComplexity: number) => {
    const complexity = childComplexity + 1
    
    if (complexity > maxComplexity) {
      throw new Error(`Query complexity exceeds maximum allowed complexity of ${maxComplexity}`)
    }
    
    return complexity
  }
}

// Create Apollo Server
const createApolloServer = (httpServer: any) => {
  return new ApolloServer({
    schema: executableSchema,
    context: createContext,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              const complexity = requestContext.request.operationName || 'Unknown'
              console.log(`GraphQL operation: ${complexity}`)
            },
            didEncounterErrors(requestContext) {
              console.error('GraphQL errors:', requestContext.errors)
            },
          }
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    uploads: {
      maxFileSize: 10000000, // 10 MB
      maxFiles: 5,
    },
    validationRules: [
      // Add custom validation rules here
    ],
    formatError: (error) => {
      console.error('GraphQL Error:', error)
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_ERROR',
        path: error.path,
        locations: error.locations,
        extensions: error.extensions,
      }
    },
    formatResponse: (response) => {
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('GraphQL Response:', response)
      }
      return response
    },
  })
}

// Subscription server setup
const createSubscriptionServer = (httpServer: any) => {
  return SubscriptionServer.create(
    {
      schema: executableSchema,
      execute,
      subscribe,
      onConnect: async (connectionParams: any, webSocket: any, context: any) => {
        // Handle WebSocket connection authentication
        if (connectionParams && connectionParams.authorization) {
          try {
            const token = connectionParams.authorization.replace('Bearer ', '')
            const user = await verifyToken(token)
            return { user }
          } catch (error) {
            console.error('WebSocket authentication error:', error)
            throw new Error('Authentication failed')
          }
        }
        return {}
      },
      onDisconnect: (webSocket: any, context: any) => {
        console.log('WebSocket disconnected')
      },
    },
    {
      server: httpServer,
      path: '/graphql',
    }
  )
}

// Token verification for WebSocket
const verifyToken = async (token: string) => {
  // Implement JWT verification here
  // This would use the same logic as in auth middleware
  return null // Placeholder
}

// GraphQL middleware
const graphqlMiddleware = (apolloServer: ApolloServer) => {
  return [
    rateLimiter.api,
    graphqlUploadExpress({
      maxFileSize: 10000000, // 10 MB
      maxFiles: 5,
    }),
    apolloServer.getMiddleware({
      path: '/graphql',
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    }),
  ]
}

// Health check for GraphQL
const graphqlHealthCheck = async (req: express.Request, res: express.Response) => {
  try {
    const result = await apolloServer.executeOperation({
      query: `
        query {
          __typename
        }
      `,
    })
    
    if (result.errors) {
      return res.status(503).json({
        status: 'error',
        message: 'GraphQL health check failed',
        errors: result.errors,
      })
    }
    
    res.status(200).json({
      status: 'ok',
      message: 'GraphQL server is healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GraphQL health check error:', error)
    res.status(503).json({
      status: 'error',
      message: 'GraphQL health check failed',
      error: error.message,
    })
  }
}

// Metrics endpoint
const graphqlMetrics = async (req: express.Request, res: express.Response) => {
  try {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      graphql: {
        // Add GraphQL-specific metrics here
        queries: 0,
        mutations: 0,
        subscriptions: 0,
        errors: 0,
        averageResponseTime: 0,
      },
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('GraphQL metrics error:', error)
    res.status(500).json({
      error: 'Failed to get metrics',
    })
  }
}

// Schema export endpoint
const graphqlSchema = async (req: express.Request, res: express.Response) => {
  try {
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(executableSchema, null, 2))
  } catch (error) {
    console.error('GraphQL schema export error:', error)
    res.status(500).json({
      error: 'Failed to export schema',
    })
  }
}

// Create GraphQL server
export const createGraphQLServer = (app: express.Application) => {
  const httpServer = createServer(app)
  
  const apolloServer = createApolloServer(httpServer)
  const subscriptionServer = createSubscriptionServer(httpServer)
  
  // Apply GraphQL middleware
  app.use('/graphql', ...graphqlMiddleware(apolloServer))
  
  // Health check endpoint
  app.get('/graphql/health', graphqlHealthCheck)
  
  // Metrics endpoint
  app.get('/graphql/metrics', graphqlMetrics)
  
  // Schema export endpoint
  app.get('/graphql/schema', graphqlSchema)
  
  // Error handling
  app.use('/graphql', errorHandler)
  
  return {
    httpServer,
    apolloServer,
    subscriptionServer,
  }
}

// GraphQL configuration
export const graphqlConfig = {
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  uploads: {
    maxFileSize: 10000000, // 10 MB
    maxFiles: 5,
    createUploadDir: (req: any, file: any) => {
      // Create upload directory logic
      return '/tmp/uploads'
    },
  },
  subscriptions: {
    path: '/graphql',
    keepAlive: 1000,
    onConnect: (connectionParams: any, websocket: any, context: any) => {
      console.log('WebSocket client connected')
      return true
    },
    onDisconnect: (websocket: any, context: any) => {
      console.log('WebSocket client disconnected')
    },
  },
  tracing: process.env.NODE_ENV === 'development',
  cacheControl: true,
  engine: {
    apiKey: process.env.APOLLO_ENGINE_KEY,
    schemaTag: 'production',
  },
}

// GraphQL playground configuration
export const playgroundConfig = {
  endpoint: '/graphql',
  subscriptionsEndpoint: 'ws://localhost:5000/graphql',
  settings: {
    'editor.theme': 'dark',
    'editor.fontSize': 14,
    'editor.fontFamily': "'Fira Code', 'monospace'",
    'general.betaUpdates': false,
    'prettier.printWidth': 80,
    'prettier.tabWidth': 2,
    'prettier.useTabs': false,
    'request.credentials': 'include',
    'schema.disableComments': false,
    'tracing.hideTracingResponse': false,
    'queryEditor.hideGraphiQL': false,
    'trace.enabled': false,
  },
  tabs: [
    {
      endpoint: '/graphql',
      name: 'No-Loss Auction API',
      headers: {
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      },
    },
  ],
}

export default {
  createGraphQLServer,
  graphqlConfig,
  playgroundConfig,
}
