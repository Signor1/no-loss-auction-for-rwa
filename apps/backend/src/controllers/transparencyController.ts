import { Request, Response } from 'express';
import { TransparencyService } from '../services/TransparencyService';

const transparencyService = new TransparencyService();

export const getPublicLedger = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const logs = await transparencyService.getPublicLedger(limit);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getAssetDisclosure = async (req: Request, res: Response) => {
    try {
        const asset = await transparencyService.getAssetDisclosure(req.params.assetId);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getFeeStructure = async (req: Request, res: Response) => {
    try {
        const fees = await transparencyService.getFeeStructure();
        res.json(fees);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getGovernanceTransparency = async (req: Request, res: Response) => {
    try {
        const data = await transparencyService.getGovernanceTransparency();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
