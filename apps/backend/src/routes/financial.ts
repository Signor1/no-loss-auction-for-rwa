import { Router, Request, Response } from 'express'
import { financialService } from '../payments/financialService'
import { authenticate, authorize } from '../middleware/auth'

import { validateRequest, validationSchemas } from '../middleware/validation'
import { checkSchema } from 'express-validator'

const router: Router = Router()

/**
 * @route GET /api/financial/summary
 * @desc Get financial summary for a date range (Admin only)
 */
router.get('/summary', [
    authenticate,
    authorize('admin'),
    checkSchema(validationSchemas.financialDateRange),
    validateRequest
], async (req: Request, res: Response) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date()

        const summary = await financialService.getFinancialSummary(startDate, endDate)
        res.json(summary)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' })
    }
})

/**
 * @route GET /api/financial/fees
 * @desc Get fee breakdown (Admin only)
 */
router.get('/fees', [
    authenticate,
    authorize('admin'),
    checkSchema(validationSchemas.financialDateRange),
    validateRequest
], async (req: Request, res: Response) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date()

        const breakdown = await financialService.getFeeBreakdown(startDate, endDate)
        res.json(breakdown)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fee breakdown' })
    }
})

/**
 * @route GET /api/financial/payouts
 * @desc Get payout history (Regular users see their own, admins see all)
 */
router.get('/payouts', [
    authenticate,
    checkSchema(validationSchemas.payoutHistory),
    validateRequest
], async (req: Request, res: Response) => {
    try {
        const userId = req.user?.role === 'admin' ? (req.query.userId as string) : req.user?.id
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0

        const payouts = await financialService.getPayoutHistory(userId, limit, offset)
        res.json(payouts)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payout history' })
    }
})

/**
 * @route GET /api/financial/export
 * @desc Export financial data to CSV (Admin only)
 */
router.get('/export', [
    authenticate,
    authorize('admin'),
    checkSchema(validationSchemas.financialDateRange),
    validateRequest
], async (req: Request, res: Response) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date()

        const csv = await financialService.exportToCSV(startDate, endDate)

        res.header('Content-Type', 'text/csv')
        res.attachment(`financial-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`)
        res.send(csv)
    } catch (error) {
        res.status(500).json({ error: 'Failed to export financial data' })
    }
})

export default router
