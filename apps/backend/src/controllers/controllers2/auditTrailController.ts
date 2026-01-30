import { Request, Response } from 'express';
import { AuditLoggingService } from '../kyc/auditLogging';
import { FinancialAudit } from '../models/FinancialAudit';
import { ComplianceAudit } from '../models/ComplianceAudit';

const auditService = new AuditLoggingService();

export const verifyAuditIntegrity = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const result = await auditService.verifyIntegrity();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const csv = await auditService.generateCSV(req.query);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        return res.send(csv);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getFinancialAudits = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const audits = await FinancialAudit.find().sort({ auditDate: -1 });
        return res.json(audits);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getComplianceAudits = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const audits = await ComplianceAudit.find().sort({ createdAt: -1 });
        return res.json(audits);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const createFinancialAudit = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const audit = new FinancialAudit({
            ...req.body,
            auditorId: req.user.id
        });
        await audit.save();

        // Log the manual audit creation
        await auditService.log({
            eventType: 'DATA_MODIFICATION' as any,
            severity: 'MEDIUM' as any,
            userId: req.user.id,
            resource: 'financial_audit',
            action: 'CREATE',
            details: { auditId: audit.id }
        });

        return res.status(201).json(audit);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
