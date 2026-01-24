import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as securityController from '../controllers/securityController';
import * as platformController from '../controllers/platformSecurityController';

const router = express.Router();

// --- Smart Contract Registry ---
router.get('/contracts', securityController.getContracts);
router.post('/contracts', authenticate, authorize('admin'), securityController.registerContract);
router.post('/contracts/pause', authenticate, authorize('admin'), securityController.togglePause);

// --- Platform & Infrastructure Security ---
router.get('/platform/summary', authenticate, platformController.getSecuritySummary);
router.get('/platform/keys', authenticate, authorize('admin'), platformController.getKeys);
router.get('/platform/multisigs', authenticate, platformController.getMultiSigs);

// --- Audits & Monitoring ---
router.get('/logs', authenticate, authorize('admin'), platformController.getAuditLogs);
router.get('/alerts', authenticate, authorize('admin'), platformController.getAlerts);
router.post('/alerts/resolve', authenticate, authorize('admin'), platformController.resolveAlert);

// --- Audits (Contract Specific) ---
router.get('/contracts/:contractId/audits', securityController.getAudits);

// --- Bug Bounty ---
router.post('/bounty/report', authenticate, securityController.submitVulnerability);
router.get('/bounty/reports', authenticate, authorize('admin'), securityController.getBountyReports);

export default router;
