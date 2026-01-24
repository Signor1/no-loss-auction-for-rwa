import { Request, Response } from 'express';
import { PlatformSecurityService } from '../services/PlatformSecurityService';
import { AuditLoggingService } from '../kyc/auditLogging';
import { ComplianceAlertsService } from '../kyc/complianceAlerts';

const platformService = new PlatformSecurityService();
const auditService = new AuditLoggingService();
const alertService = new ComplianceAlertsService();

export const getSecuritySummary = async (req: Request, res: Response) => {
    try {
        const summary = await platformService.getSecurityHealthSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await auditService.queryLogs(req.query);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getAlerts = async (req: Request, res: Response) => {
    try {
        const alerts = await alertService.getAlerts(req.query);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const resolveAlert = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { alertId, resolution } = req.body;
        const result = await alertService.resolveAlert(alertId, req.user.id, resolution);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getKeys = async (req: Request, res: Response) => {
    try {
        const keys = await platformService.getKeys();
        res.json(keys);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getMultiSigs = async (req: Request, res: Response) => {
    try {
        const wallets = await platformService.getMultiSigWallets();
        res.json(wallets);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
