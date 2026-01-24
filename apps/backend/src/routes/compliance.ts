import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../services/upload';
import * as complianceController from '../controllers/complianceController';
import * as jurisdictionController from '../controllers/jurisdictionController';
import * as securitiesController from '../controllers/securitiesController';

const router = express.Router();

// --- Document Verification ---
router.post(
    '/documents/upload',
    authenticate,
    upload.single('document'),
    complianceController.uploadDocument
);
router.get('/documents', authenticate, complianceController.getDocuments);
router.get('/documents/:id', authenticate, complianceController.getDocumentById);

// --- Risk Assessment ---
router.post('/risk/assess', authenticate, complianceController.triggerRiskAssessment);
router.get('/risk/history', authenticate, complianceController.getRiskAssessments);
router.get('/risk/latest', authenticate, complianceController.getLatestRiskAssessment);

// --- Jurisdiction Management ---
router.get('/jurisdictions', authenticate, jurisdictionController.getJurisdictions);
router.post('/jurisdictions', authenticate, authorize('admin'), jurisdictionController.createJurisdiction);

// --- Compliance Rules ---
router.get('/rules', authenticate, jurisdictionController.getRules);
router.post('/rules', authenticate, authorize('admin'), jurisdictionController.createRule);

// --- Reporting ---
router.get('/reports', authenticate, jurisdictionController.getReports);
router.post('/reports/generate', authenticate, authorize('admin'), jurisdictionController.generateReport);

// --- Securities Regulations ---
router.get('/securities/accreditation', authenticate, securitiesController.getAccreditationStatus);
router.post('/securities/accreditation', authenticate, securitiesController.submitAccreditation);
router.post('/securities/accreditation/review', authenticate, authorize('admin'), securitiesController.reviewAccreditation);

router.get('/securities/eligibility/:assetId', authenticate, securitiesController.checkEligibility);
router.get('/securities/disclosures/:assetId', authenticate, securitiesController.getAssetDisclosures);
router.post('/securities/disclosures', authenticate, authorize('admin', 'issuer'), securitiesController.fileDisclosure);

// --- Watchlist Screening ---
router.post('/screenings', authenticate, authorize('admin'), complianceController.performScreening);
router.get('/screenings', authenticate, authorize('admin'), complianceController.getScreeningResults);

export default router;
