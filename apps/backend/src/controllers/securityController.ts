import { Request, Response } from 'express';
import { ContractSecurityService } from '../services/ContractSecurityService';

const securityService = new ContractSecurityService();

// --- Contract Registry ---

export const getContracts = async (req: Request, res: Response) => {
    try {
        const contracts = await securityService.getContracts(req.query);
        return res.json(contracts);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const registerContract = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin only' });
        }
        const contract = await securityService.registerContract(req.body);
        return res.status(201).json(contract);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const togglePause = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin only' });
        }
        const { contractId, isPaused, reason } = req.body;
        const result = await securityService.toggleEmergencyPause(contractId, req.user.id, isPaused, reason);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Audits ---

export const getAudits = async (req: Request, res: Response) => {
    try {
        const audits = await securityService.getContractAudits(req.params.contractId);
        return res.json(audits);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Bug Bounty ---

export const submitVulnerability = async (req: Request, res: Response) => {
    try {
        const report = await securityService.submitVulnerability({
            ...req.body,
            reporterUserId: req.user?.id
        });
        return res.status(201).json(report);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getBountyReports = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin only' });
        }
        const reports = await securityService.getBountyReports(req.query);
        return res.json(reports);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

