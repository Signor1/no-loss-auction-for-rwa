import { Request, Response } from 'express';
import { JurisdictionManagementService } from '../kyc/jurisdictionManagement';
import { RegulatoryComplianceTrackingService } from '../kyc/regulatoryComplianceTracking';
import { ComplianceRuleEngine } from '../kyc/complianceRuleEngine';

const jurisdictionService = new JurisdictionManagementService();
const trackingService = new RegulatoryComplianceTrackingService();
const ruleEngine = new ComplianceRuleEngine();

// --- Jurisdictions ---

export const getJurisdictions = async (req: Request, res: Response) => {
    try {
        const jurisdictions = await jurisdictionService.getJurisdictions(req.query);
        res.json(jurisdictions);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const createJurisdiction = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const jurisdiction = await jurisdictionService.createJurisdiction(req.body);
        res.status(201).json(jurisdiction);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Compliance Rules ---

export const getRules = async (req: Request, res: Response) => {
    try {
        const rules = await ruleEngine.getRules(req.query);
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const rule = await ruleEngine.createRule(req.body);
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Reporting ---

export const generateReport = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const report = await trackingService.generateReport({
            ...req.body,
            generatedBy: req.user!.id
        });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const reports = await trackingService.getReports(req.query);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
