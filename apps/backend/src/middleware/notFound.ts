import { Request, Response, NextFunction } from 'express'

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`)
    res.status(404)
    next(error)
}
