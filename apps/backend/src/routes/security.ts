import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as securityController from '../controllers/securityController';

const router = express.Router();

// Contract Registry
router.get('/contracts', securityController.getContracts);
router.post('/contracts', authenticate, authorize('admin'), securityController.registerContract);
router.post('/contracts/pause', authenticate, authorize('admin'), securityController.togglePause);

// Audits
router.get('/contracts/:contractId/audits', securityController.getAudits);

// Bug Bounty
router.post('/bounty/report', authenticate, securityController.submitVulnerability);
router.get('/bounty/reports', authenticate, authorize('admin'), securityController.getBountyReports);

export default router;
