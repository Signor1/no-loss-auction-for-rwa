import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import {
  KYCDocument,
  IKYCDocument,
  DocumentType,
  VerificationStatus,
  DocumentQuality,
  FraudRisk
} from '../models/KYCDocument';

// Re-export enums for compatibility
export { DocumentType, VerificationStatus, DocumentQuality, FraudRisk };

export interface DocumentVerificationConfig {
  enableOCR: boolean;
  enableAuthenticityCheck: boolean;
  enableFraudDetection: boolean;
  enableFaceMatching: boolean;
  enableDataValidation: boolean;
  enableManualReview: boolean;

  // Quality thresholds
  minQualityScore: number;
  minAuthenticityScore: number;
  maxFraudRiskScore: number;

  // File constraints
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  maxDocumentAge: number; // days

  // Processing settings
  enableBatchProcessing: boolean;
  batchSize: number;
  processingTimeout: number; // seconds
  retryAttempts: number;

  // Security settings
  enableEncryption: boolean;
  encryptionKey?: string;
  enableDataRetention: boolean;
  retentionPeriod: number; // days

  // Review settings
  autoApproveThreshold: number;
  autoRejectThreshold: number;
  requireManualReviewThreshold: number;
}

export interface DocumentAnalytics {
  period: { start: Date; end: Date };
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<VerificationStatus, number>;
  averageProcessingTime: number;
  approvalRate: number;
  rejectionRate: number;
}

// Main Document Verification Service
export class DocumentVerificationService extends EventEmitter {
  private config: DocumentVerificationConfig;
  private isProcessing = false;

  constructor(config?: Partial<DocumentVerificationConfig>) {
    super();
    this.config = {
      enableOCR: true,
      enableAuthenticityCheck: true,
      enableFraudDetection: true,
      enableFaceMatching: true,
      enableDataValidation: true,
      enableManualReview: true,
      minQualityScore: 70,
      minAuthenticityScore: 80,
      maxFraudRiskScore: 30,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'image/heic',
        'image/webp'
      ],
      maxDocumentAge: 365 * 10, // 10 years
      enableBatchProcessing: true,
      batchSize: 10,
      processingTimeout: 300, // 5 minutes
      retryAttempts: 3,
      enableEncryption: true,
      enableDataRetention: true,
      retentionPeriod: 2555, // 7 years
      autoApproveThreshold: 90,
      autoRejectThreshold: 40,
      requireManualReviewThreshold: 70,
      ...config
    };
  }

  // Document Upload
  async uploadDocument(
    userId: string,
    type: DocumentType,
    category: string,
    fileData: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      frontImage: string; // Base64 or URL
      backImage?: string;
      selfie?: string;
    },
    metadata: {
      country: string;
      issuingAuthority: string;
      documentNumber: string;
      issueDate: Date;
      expiryDate?: Date;
    }
  ): Promise<IKYCDocument> {
    // Validate file
    await this.validateFile(fileData);

    const document = new KYCDocument({
      userId,
      type,
      category,
      country: metadata.country,
      issuingAuthority: metadata.issuingAuthority,
      documentNumber: metadata.documentNumber,
      issueDate: metadata.issueDate,
      expiryDate: metadata.expiryDate,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      fileHash: this.calculateFileHash(fileData.frontImage),
      frontImage: fileData.frontImage, // In real app, upload to S3/Cloudinary and store URL
      backImage: fileData.backImage,
      selfie: fileData.selfie,
      extractedData: {
        documentNumber: metadata.documentNumber, // Initial population
        issuingCountry: metadata.country,
        issueDate: metadata.issueDate,
        expiryDate: metadata.expiryDate,
        additionalFields: {},
        fieldConfidence: {}
      },
      verificationStatus: VerificationStatus.PENDING,
      quality: DocumentQuality.GOOD,
      issues: [],
      warnings: [],
      verificationSteps: [],
      metadata: {}
    });

    await document.save();

    this.emit('documentUploaded', document);

    // Start processing if not already running
    // In a real microservice architecture, this would be handled by a queue worker
    this.processDocument(document.id).catch(err => {
      console.error(`Error processing document ${document.id}:`, err);
    });

    return document;
  }

  // Document Processing
  async processDocument(documentId: string): Promise<IKYCDocument> {
    const document = await KYCDocument.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.verificationStatus = VerificationStatus.PROCESSING;
    await document.save();

    try {
      // Step 1: Quality Assessment
      if (this.config.enableOCR) {
        await this.performQualityAssessment(document);
      }

      // Step 2: OCR Processing
      if (this.config.enableOCR) {
        await this.performOCR(document);
      }

      // Step 3: Authenticity Check
      if (this.config.enableAuthenticityCheck) {
        await this.performAuthenticityCheck(document);
      }

      // Step 4: Fraud Detection
      if (this.config.enableFraudDetection) {
        await this.performFraudDetection(document);
      }

      // Step 5: Face Matching (if selfie provided)
      if (this.config.enableFaceMatching && document.selfie) {
        await this.performFaceMatching(document);
      }

      // Step 6: Data Validation
      if (this.config.enableDataValidation) {
        await this.performDataValidation(document);
      }

      // Calculate overall scores
      await this.calculateOverallScores(document);

      // Determine final status
      await this.determineFinalStatus(document);

      document.processedAt = new Date();
      await document.save();

      this.emit('documentProcessed', document);
      return document;

    } catch (error) {
      document.verificationStatus = VerificationStatus.ERROR;
      await document.save();
      this.emit('documentProcessingError', { document, error });
      throw error;
    }
  }

  // Document Retrieval
  async getDocument(documentId: string): Promise<IKYCDocument | null> {
    return KYCDocument.findById(documentId);
  }

  async getUserDocuments(
    userId: string,
    type?: DocumentType,
    status?: VerificationStatus
  ): Promise<IKYCDocument[]> {
    const query: any = { userId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.verificationStatus = status;
    }

    return KYCDocument.find(query).sort({ uploadedAt: -1 });
  }

  // Manual Review
  async reviewDocument(
    documentId: string,
    reviewerId: string,
    action: 'approve' | 'reject' | 'request_changes',
    notes?: string
  ): Promise<IKYCDocument> {
    const document = await KYCDocument.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.reviewedBy = reviewerId;
    document.reviewedAt = new Date();
    document.reviewNotes = notes;

    switch (action) {
      case 'approve':
        document.verificationStatus = VerificationStatus.APPROVED;
        break;
      case 'reject':
        document.verificationStatus = VerificationStatus.REJECTED;
        break;
      case 'request_changes':
        document.verificationStatus = VerificationStatus.NEEDS_REVIEW;
        break;
    }

    await document.save();
    this.emit('documentReviewed', { document, reviewerId, action, notes });
    return document;
  }

  // Batch Operations
  async processBatch(documentIds: string[]): Promise<IKYCDocument[]> {
    const results: IKYCDocument[] = [];

    for (const docId of documentIds) {
      try {
        const document = await this.processDocument(docId);
        results.push(document);
      } catch (error) {
        this.emit('batchProcessingError', { documentId: docId, error });
      }
    }

    this.emit('batchProcessingCompleted', { results, totalProcessed: documentIds.length });
    return results;
  }

  // Private Methods
  private async validateFile(fileData: any): Promise<void> {
    if (fileData.fileSize > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    if (!this.config.allowedMimeTypes.includes(fileData.mimeType)) {
      throw new Error(`File type ${fileData.mimeType} is not allowed`);
    }
  }

  private calculateFileHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock implementations for processing steps - in production these would call external APIs
  private async performQualityAssessment(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const qualityScore = 85;

    document.quality = this.mapQualityScore(qualityScore);

    if (qualityScore < this.config.minQualityScore) {
      document.warnings.push({
        type: 'low_quality',
        severity: 'medium',
        description: 'Document quality is below minimum threshold',
        detectedAt: new Date(),
        autoDetected: true
      });
    }

    document.verificationSteps.push({
      id: this.generateId(),
      name: 'Quality Assessment',
      type: 'quality',
      status: 'completed',
      confidence: qualityScore,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async performOCR(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock extraction - updating fields that were not in initial metadata
    document.extractedData.firstName = 'John';
    document.extractedData.lastName = 'Doe';

    document.verificationSteps.push({
      id: this.generateId(),
      name: 'OCR Processing',
      type: 'ocr',
      status: 'completed',
      confidence: 95,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async performAuthenticityCheck(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 600));

    const authenticityScore = 90;
    document.authenticityScore = authenticityScore;

    document.verificationSteps.push({
      id: this.generateId(),
      name: 'Authenticity Check',
      type: 'authenticity',
      status: 'completed',
      confidence: authenticityScore,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async performFraudDetection(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 400));

    const fraudScore = 10; // Low risk
    document.fraudRisk = FraudRisk.LOW;

    document.verificationSteps.push({
      id: this.generateId(),
      name: 'Fraud Detection',
      type: 'fraud',
      status: 'completed',
      confidence: 100 - fraudScore,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async performFaceMatching(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 700));

    // Mock match
    document.verificationSteps.push({
      id: this.generateId(),
      name: 'Face Matching',
      type: 'face_match',
      status: 'completed',
      confidence: 98,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async performDataValidation(document: IKYCDocument): Promise<void> {
    const startTime = Date.now();
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 200));

    document.verificationSteps.push({
      id: this.generateId(),
      name: 'Data Validation',
      type: 'validation',
      status: 'completed',
      confidence: 100,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date()
    });
  }

  private async calculateOverallScores(document: IKYCDocument): Promise<void> {
    // Simple average of available scores
    document.confidence = (document.authenticityScore + (100 - (document.fraudRisk === FraudRisk.LOW ? 10 : 90))) / 2;
  }

  private async determineFinalStatus(document: IKYCDocument): Promise<void> {
    // If we have critical issues, auto-reject
    const hasCriticalIssues = document.issues.some(i => i.severity === 'critical');
    if (hasCriticalIssues) {
      document.verificationStatus = VerificationStatus.REJECTED;
      return;
    }

    if (document.confidence >= this.config.autoApproveThreshold) {
      document.verificationStatus = VerificationStatus.APPROVED;
    } else if (document.confidence <= this.config.autoRejectThreshold) {
      document.verificationStatus = VerificationStatus.REJECTED;
    } else {
      document.verificationStatus = VerificationStatus.NEEDS_REVIEW;
    }
  }

  private mapQualityScore(score: number): DocumentQuality {
    if (score >= 90) return DocumentQuality.EXCELLENT;
    if (score >= 70) return DocumentQuality.GOOD;
    if (score >= 50) return DocumentQuality.FAIR;
    if (score >= 30) return DocumentQuality.POOR;
    return DocumentQuality.UNREADABLE;
  }
}
