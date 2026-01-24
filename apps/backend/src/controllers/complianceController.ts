import { Request, Response } from 'express';
import { DocumentVerificationService, DocumentType } from '../kyc/documentVerification';
import { RiskAssessmentService } from '../kyc/riskAssessment';
import { WatchlistScreeningService } from '../kyc/watchlistScreening';

// Instantiate services
// TODO: Use dependency injection
const documentVerificationService = new DocumentVerificationService();
const riskAssessmentService = new RiskAssessmentService();
const watchlistScreeningService = new WatchlistScreeningService();

// Interface for Request with file (Multer)
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// --- Document Verification ---

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const { type, category, metadata } = req.body;

        // Cast req to MulterRequest to access file
        const file = (req as MulterRequest).file;
        const fileData = {
            fileName: file ? file.originalname : req.body.fileName,
            fileSize: file ? file.size : req.body.fileSize,
            mimeType: file ? file.mimetype : req.body.mimeType,
            frontImage: file ? file.path : req.body.frontImage,
            backImage: req.body.backImage,
            selfie: req.body.selfie
        };

        if (!fileData.frontImage) {
            return res.status(400).json({ error: 'Front image is required' });
        }

        const document = await documentVerificationService.uploadDocument(
            req.user!.id,
            type as DocumentType,
            category,
            fileData,
            JSON.parse(metadata || '{}')
        );

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const documents = await documentVerificationService.getUserDocuments(req.user!.id);
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getDocumentById = async (req: Request, res: Response) => {
    try {
        const document = await documentVerificationService.getDocument(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        // Check ownership
        // @ts-ignore - req.user is populated by auth middleware
        if (document.userId !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// --- Risk Assessment ---

export const triggerRiskAssessment = async (req: Request, res: Response) => {
    try {
        const assessment = await riskAssessmentService.assessRisk(
            // @ts-ignore
            req.user!.id,
            'event_driven',
            req.body.data || {}
        );
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getRiskAssessments = async (req: Request, res: Response) => {
    try {
        // Only admins explicitly checking other users, or user checking themselves
        // @ts-ignore
        const targetUserId = req.query.userId as string || req.user!.id;
        // @ts-ignore
        if (targetUserId !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const assessments = await riskAssessmentService.getUserAssessments(targetUserId);
        res.json(assessments);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getLatestRiskAssessment = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const assessment = await riskAssessmentService.getLatestAssessment(req.user!.id);
        if (!assessment) {
            return res.status(404).json({ message: 'No assessment found' });
        }
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

// --- Watchlist Screening ---

export const performScreening = async (req: Request, res: Response) => {
    try {
        // Only admins or automated systems for now
        // @ts-ignore
        if (req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const screening = await watchlistScreeningService.createScreeningRequest({
            userId: req.body.userId,
            name: req.body.name,
            // ... mapped fields
            ...req.body
        });

        res.json(screening);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getScreeningResults = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        if (req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        // This functionality needs to be added to service if passing filters
        // For now preventing error
        res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
