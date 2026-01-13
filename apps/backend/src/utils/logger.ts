import winston from 'winston'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Tell winston about colors
winston.addColors(colors)

// Define formats
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.errors({ stack: true }),
  process.env.NODE_ENV === 'development'
    ? winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    )
    : winston.format.json()
)

// Define transports
const transports = [
  // Always log to console
  new winston.transports.Console(),

  // Log all errors to error.log
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),

  // Log all levels to all.log
  new winston.transports.File({
    filename: path.join('logs', 'all.log')
  }),
]

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false,
})

/**
 * Log an error with context
 */
export const logError = (error: Error | string, context?: any) => {
  if (typeof error === 'string') {
    logger.error(error, { context })
  } else {
    logger.error(error.message, {
      stack: error.stack,
      context,
      ...((error as any).details ? { details: (error as any).details } : {})
    })
  }
}

/**
 * Log an info message
 */
export const logInfo = (message: string, context?: any) => {
  logger.info(message, { context })
}

/**
 * Log a warning
 */
export const logWarn = (message: string, context?: any) => {
  logger.warn(message, { context })
}

/**
 * Log a debug message
 */
export const logDebug = (message: string, context?: any) => {
  logger.debug(message, { context })
}

export default logger
