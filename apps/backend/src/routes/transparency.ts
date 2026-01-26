import express from 'express';
import * as transparencyController from '../controllers/transparencyController';

const router = express.Router();

// Public Transparency Endpoints
router.get('/ledger', transparencyController.getPublicLedger);
router.get('/assets/:assetId/disclosure', transparencyController.getAssetDisclosure);
router.get('/fees', transparencyController.getFeeStructure);
router.get('/governance', transparencyController.getGovernanceTransparency);

export default router;
