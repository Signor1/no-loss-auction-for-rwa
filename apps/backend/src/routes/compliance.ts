import express from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/upload';
import * as complianceController from '../controllers/complianceController';

const router = express.Router();

// Document Verification
router.post(
    '/documents/upload',
    authenticate,
    upload.single('document'),
    complianceController.uploadDocument
);
router.get('/documents', authenticate, complianceController.getDocuments);
router.get('/documents/:id', authenticate, complianceController.getDocumentById);

// Risk Assessment
router.post('/risk/assess', authenticate, complianceController.triggerRiskAssessment);
router.get('/risk/history', authenticate, complianceController.getRiskAssessments);
router.get('/risk/latest', authenticate, complianceController.getLatestRiskAssessment);

// Watchlist Screening (Admin only is enforced in controller)
router.post('/screenings', authenticate, complianceController.performScreening);
router.get('/screenings', authenticate, complianceController.getScreeningResults);

export default router;
