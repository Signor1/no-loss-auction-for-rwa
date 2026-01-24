import { Request, Response } from 'express';
import { SecurityComplianceService } from '../services/SecurityComplianceService';
import { AccreditationStatus } from '../models/InvestorAccreditation';

const securityService = new SecurityComplianceService();

// --- Investor Accreditation ---

export const getAccreditationStatus = async (req: Request, res: Response) => {
    try {
        const status = await securityService.getAccreditationStatus(req.user!.id);
        if (!status) return res.json({ status: 'unverified' });
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const submitAccreditation = async (req: Request, res: Response) => {
    try {
        const accreditation = await securityService.submitAccreditationRequest(req.user!.id, req.body);
        res.status(201).json(accreditation);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const reviewAccreditation = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { accreditationId, decision, notes } = req.body;
        const result = await securityService.verifyInvestorAccreditation(accreditationId, req.user.id, decision as AccreditationStatus, notes);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Eligibility Checks ---

export const checkEligibility = async (req: Request, res: Response) => {
    try {
        const { assetId } = req.params;
        const eligibility = await securityService.canInvestInAsset(req.user!.id, assetId);
        res.json(eligibility);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Disclosures ---

export const getAssetDisclosures = async (req: Request, res: Response) => {
    try {
        const disclosures = await securityService.getAssetDisclosures(req.params.assetId);
        res.json(disclosures);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const fileDisclosure = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'issuer') {
            return res.status(403).json({ error: 'Issuer or Admin only' });
        }
        const disclosure = await securityService.fileDisclosure(req.body);
        res.status(201).json(disclosure);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
