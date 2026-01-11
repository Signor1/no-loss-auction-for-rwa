import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// Enums
export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'passport',
  DRIVING_LICENSE = 'driving_license',
  RESIDENCE_PERMIT = 'residence_permit',
  VISA = 'visa',
  MILITARY_ID = 'military_id',
  TAX_ID = 'tax_id',
  SOCIAL_SECURITY = 'social_security',
  BIRTH_CERTIFICATE = 'birth_certificate',
  MARRIAGE_CERTIFICATE = 'marriage_certificate',
  DIVORCE_DECREE = 'divorce_decree',
  ADOPTION_PAPERS = 'adoption_papers',
  COURT_ORDER = 'court_order',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  RENTAL_AGREEMENT = 'rental_agreement',
  EMPLOYMENT_VERIFICATION = 'employment_verification',
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  OTHER = 'other'
}

export enum VerificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export enum DocumentQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNREADABLE = 'unreadable'
}

export enum FraudRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces
export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  category: 'identity' | 'address' | 'financial' | 'legal' | 'other';
  
  // Document metadata
  country: string;
  issuingAuthority: string;
  documentNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  
  // File information
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  
  // Images
  frontImage?: string; // URL or file reference
  backImage?: string; // URL or file reference
  selfie?: string; // URL or file reference
  
  // Extracted data
  extractedData: DocumentExtractedData;
  
  // Verification results
  verificationStatus: VerificationStatus;
  quality: DocumentQuality;
  authenticityScore: number; // 0-100
  fraudRisk: FraudRisk;
  confidence: number; // 0-100
  
  // Issues and warnings
  issues: DocumentIssue[];
  warnings: DocumentWarning[];
  
  // Verification steps
  verificationSteps: VerificationStep[];
  
  // Review information
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Timestamps
  uploadedAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface DocumentExtractedData {
  // Personal information
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  
  // Document information
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  issuingCountry?: string;
  
  // Address information
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Physical characteristics
  height?: string;
  weight?: string;
  eyeColor?: string;
  hairColor?: string;
  distinguishingMarks?: string;
  
  // Machine readable data
  mrz?: string; // Machine Readable Zone
  barcode?: string;
  qrCode?: string;
  
  // Additional fields
  additionalFields: Record<string, any>;
  
  // Confidence scores
  fieldConfidence: Record<string, number>;
}

export interface DocumentIssue {
  type: 'missing_field' | 'invalid_format' | 'expired' | 'damaged' | 'tampered' | 'forgery' | 'inconsistent_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  description: string;
  detectedAt: Date;
  autoDetected: boolean;
}

export interface DocumentWarning {
  type: 'low_quality' | 'glare' | 'blur' | 'partial_visibility' | 'unusual_format' | 'data_mismatch';
  severity: 'low' | 'medium' | 'high';
  field?: string;
  description: string;
  detectedAt: Date;
  autoDetected: boolean;
}

export interface VerificationStep {
  id: string;
  name: string;
  type: 'ocr' | 'authenticity' | 'fraud_detection' | 'data_validation' | 'face_match' | 'manual_review';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  result?: any;
  confidence?: number;
  duration?: number; // milliseconds
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

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
  
  // Volume metrics
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByCategory: Record<string, number>;
  documentsByCountry: Record<string, number>;
  
  // Processing metrics
  averageProcessingTime: number;
  processingSuccessRate: number;
  documentsByStatus: Record<VerificationStatus, number>;
  
  // Quality metrics
  averageQualityScore: number;
  averageAuthenticityScore: number;
  documentsByQuality: Record<DocumentQuality, number>;
  
  // Fraud metrics
  fraudRiskDistribution: Record<FraudRisk, number>;
  highRiskDocuments: number;
  fraudDetectionRate: number;
  
  // Review metrics
  manualReviewRate: number;
  averageReviewTime: number;
  approvalRate: number;
  rejectionRate: number;
  
  // Error metrics
  errorsByType: Record<string, number>;
  processingErrors: number;
  
  // Trends
  dailySubmissions: {
    date: Date;
    submissions: number;
    approvals: number;
    rejections: number;
  }[];
}

// Main Document Verification Service
export class DocumentVerificationService extends EventEmitter {
  private documents: Map<string, Document> = new Map();
  private userDocuments: Map<string, string[]> = new Map();
  private config: DocumentVerificationConfig;
  private processingQueue: string[] = [];
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
    category: Document['category'],
    fileData: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      frontImage: string;
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
  ): Promise<Document> {
    // Validate file
    await this.validateFile(fileData);

    const documentId = this.generateId();
    const now = new Date();

    const document: Document = {
      id: documentId,
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
      frontImage: fileData.frontImage,
      backImage: fileData.backImage,
      selfie: fileData.selfie,
      extractedData: {
        additionalFields: {},
        fieldConfidence: {}
      },
      verificationStatus: VerificationStatus.PENDING,
      quality: DocumentQuality.GOOD,
      authenticityScore: 0,
      fraudRisk: FraudRisk.LOW,
      confidence: 0,
      issues: [],
      warnings: [],
      verificationSteps: [],
      uploadedAt: now,
      metadata: {}
    };

    // Store document
    this.documents.set(documentId, document);
    
    // Update user documents index
    const userDocIds = this.userDocuments.get(userId) || [];
    userDocIds.push(documentId);
    this.userDocuments.set(userId, userDocIds);

    // Add to processing queue
    this.processingQueue.push(documentId);

    this.emit('documentUploaded', document);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return document;
  }

  // Document Processing
  async processDocument(documentId: string): Promise<Document> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.verificationStatus = VerificationStatus.PROCESSING;

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

      this.emit('documentProcessed', document);
      return document;

    } catch (error) {
      document.verificationStatus = VerificationStatus.ERROR;
      this.emit('documentProcessingError', { document, error });
      throw error;
    }
  }

  // Document Retrieval
  async getDocument(documentId: string): Promise<Document | null> {
    return this.documents.get(documentId) || null;
  }

  async getUserDocuments(
    userId: string,
    type?: DocumentType,
    status?: VerificationStatus
  ): Promise<Document[]> {
    const docIds = this.userDocuments.get(userId) || [];
    const documents = docIds
      .map(id => this.documents.get(id))
      .filter((d): d is Document => d !== undefined);

    let filteredDocs = documents;
    
    if (type) {
      filteredDocs = filteredDocs.filter(d => d.type === type);
    }
    
    if (status) {
      filteredDocs = filteredDocs.filter(d => d.verificationStatus === status);
    }

    return filteredDocs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  // Manual Review
  async reviewDocument(
    documentId: string,
    reviewerId: string,
    action: 'approve' | 'reject' | 'request_changes',
    notes?: string
  ): Promise<Document> {
    const document = this.documents.get(documentId);
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

    this.emit('documentReviewed', { document, reviewerId, action, notes });
    return document;
  }

  // Batch Operations
  async processBatch(documentIds: string[]): Promise<Document[]> {
    const results: Document[] = [];
    
    for (const docId of documentIds) {
      try {
        const document = await this.processDocument(docId);
        results.push(document);
      } catch (error) {
        this.emit('batchProcessingError', { documentId, error });
      }
    }

    this.emit('batchProcessingCompleted', { results, totalProcessed: documentIds.length });
    return results;
  }

  // Private Methods
  private async validateFile(fileData: any): Promise<void> {
    // Check file size
    if (fileData.fileSize > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(fileData.mimeType)) {
      throw new Error(`File type ${fileData.mimeType} is not allowed`);
    }
  }

  private async performQualityAssessment(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'Quality Assessment',
      type: 'ocr',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Placeholder for quality assessment
      // In a real implementation, you would analyze image quality:
      // - Resolution
      // - Lighting
      // - Glare
      // - Blur
      // - Completeness
      
      const qualityScore = 85; // Mock score
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

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = qualityScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performOCR(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'OCR Processing',
      type: 'ocr',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Placeholder for OCR processing
      // In a real implementation, you would use OCR services like:
      // - Tesseract
      // - Google Cloud Vision API
      // - Amazon Textract
      // - Azure Computer Vision
      
      const extractedData: DocumentExtractedData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        documentNumber: document.documentNumber,
        issueDate: document.issueDate,
        expiryDate: document.expiryDate,
        issuingCountry: document.country,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        },
        additionalFields: {},
        fieldConfidence: {
          firstName: 95,
          lastName: 95,
          dateOfBirth: 90,
          documentNumber: 98
        }
      };

      document.extractedData = extractedData;

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = 92;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performAuthenticityCheck(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'Authenticity Check',
      type: 'authenticity',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Placeholder for authenticity check
      // In a real implementation, you would check:
      // - Security features (holograms, watermarks)
      // - Font consistency
      // - Layout verification
      // - UV features
      // - Microprinting
      
      const authenticityScore = 88; // Mock score
      document.authenticityScore = authenticityScore;

      if (authenticityScore < this.config.minAuthenticityScore) {
        document.issues.push({
          type: 'tampered',
          severity: 'high',
          description: 'Document appears to be tampered with',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = authenticityScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performFraudDetection(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'Fraud Detection',
      type: 'fraud_detection',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Placeholder for fraud detection
      // In a real implementation, you would check:
      // - Known fraudulent patterns
      // - Digital manipulation
      // - Template matching
      // - Statistical anomalies
      // - Database checks against known frauds
      
      const fraudScore = 15; // Mock score (lower is better)
      document.fraudRisk = this.mapFraudScore(fraudScore);

      if (fraudScore > this.config.maxFraudRiskScore) {
        document.issues.push({
          type: 'forgery',
          severity: 'critical',
          description: 'High fraud risk detected',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = 85 - fraudScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performFaceMatching(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'Face Matching',
      type: 'face_match',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Placeholder for face matching
      // In a real implementation, you would:
      // - Extract face from document
      // - Extract face from selfie
      // - Compare facial features
      // - Calculate match score
      
      const matchScore = 92; // Mock score
      
      if (matchScore < 80) {
        document.warnings.push({
          type: 'data_mismatch',
          severity: 'medium',
          field: 'face_match',
          description: 'Face match score is low',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = matchScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performDataValidation(document: Document): Promise<void> {
    const stepId = this.generateId();
    const step: VerificationStep = {
      id: stepId,
      name: 'Data Validation',
      type: 'data_validation',
      status: 'in_progress',
      startedAt: new Date()
    };

    document.verificationSteps.push(step);

    try {
      // Validate extracted data against known formats and rules
      const issues: DocumentIssue[] = [];
      const warnings: DocumentWarning[] = [];

      // Check document number format
      if (!this.validateDocumentNumber(document.type, document.extractedData.documentNumber || '')) {
        issues.push({
          type: 'invalid_format',
          severity: 'medium',
          field: 'documentNumber',
          description: 'Document number format is invalid',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      // Check expiry date
      if (document.expiryDate && document.expiryDate < new Date()) {
        issues.push({
          type: 'expired',
          severity: 'high',
          field: 'expiryDate',
          description: 'Document has expired',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      // Check date of birth (reasonable range)
      if (document.extractedData.dateOfBirth) {
        const age = this.calculateAge(document.extractedData.dateOfBirth);
        if (age < 0 || age > 120) {
          issues.push({
            type: 'invalid_format',
            severity: 'high',
            field: 'dateOfBirth',
            description: 'Invalid date of birth',
            detectedAt: new Date(),
            autoDetected: true
          });
        }
      }

      document.issues.push(...issues);
      document.warnings.push(...warnings);

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = issues.length === 0 ? 95 : 80;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async calculateOverallScores(document: Document): Promise<void> {
    // Calculate overall confidence based on step confidences
    const completedSteps = document.verificationSteps.filter(s => s.status === 'completed' && s.confidence);
    const averageConfidence = completedSteps.length > 0
      ? completedSteps.reduce((sum, step) => sum + (step.confidence || 0), 0) / completedSteps.length
      : 0;

    document.confidence = Math.round(averageConfidence);
  }

  private async determineFinalStatus(document: Document): Promise<void> {
    // Auto-approve if confidence is high and no critical issues
    if (document.confidence >= this.config.autoApproveThreshold && 
        !document.issues.some(i => i.severity === 'critical')) {
      document.verificationStatus = VerificationStatus.APPROVED;
      return;
    }

    // Auto-reject if confidence is low or has critical issues
    if (document.confidence < this.config.autoRejectThreshold || 
        document.issues.some(i => i.severity === 'critical')) {
      document.verificationStatus = VerificationStatus.REJECTED;
      return;
    }

    // Require manual review for borderline cases
    if (document.confidence < this.config.requireManualReviewThreshold || 
        document.issues.length > 0 || 
        document.warnings.length > 2) {
      document.verificationStatus = VerificationStatus.NEEDS_REVIEW;
      return;
    }

    // Default to approved if no issues
    document.verificationStatus = VerificationStatus.APPROVED;
  }

  // Helper Methods
  private mapQualityScore(score: number): DocumentQuality {
    if (score >= 90) return DocumentQuality.EXCELLENT;
    if (score >= 75) return DocumentQuality.GOOD;
    if (score >= 60) return DocumentQuality.FAIR;
    if (score >= 40) return DocumentQuality.POOR;
    return DocumentQuality.UNREADABLE;
  }

  private mapFraudScore(score: number): FraudRisk {
    if (score <= 20) return FraudRisk.LOW;
    if (score <= 40) return FraudRisk.MEDIUM;
    if (score <= 60) return FraudRisk.HIGH;
    return FraudRisk.CRITICAL;
  }

  private validateDocumentNumber(type: DocumentType, number: string): boolean {
    // Placeholder for document number validation
    // In a real implementation, you would have specific validation rules for each document type
    return number.length >= 6;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateFileHash(imageData: string): string {
    return createHash('sha256').update(imageData).digest('hex');
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue Processing
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const batch = this.processingQueue.splice(0, this.config.batchSize);
      
      try {
        await this.processBatch(batch);
      } catch (error) {
        this.emit('queueProcessingError', error);
      }
    }

    this.isProcessing = false;
  }

  // Analytics
  async getDocumentAnalytics(
    period: { start: Date; end: Date }
  ): Promise<DocumentAnalytics> {
    const documents = Array.from(this.documents.values())
      .filter(d => d.uploadedAt >= period.start && d.uploadedAt <= period.end);

    const totalDocuments = documents.length;

    // Type distribution
    const documentsByType: Record<DocumentType, number> = {
      [DocumentType.PASSPORT]: 0,
      [DocumentType.NATIONAL_ID]: 0,
      [DocumentType.DRIVING_LICENSE]: 0,
      [DocumentType.RESIDENCE_PERMIT]: 0,
      [DocumentType.VISA]: 0,
      [DocumentType.MILITARY_ID]: 0,
      [DocumentType.TAX_ID]: 0,
      [DocumentType.SOCIAL_SECURITY]: 0,
      [DocumentType.BIRTH_CERTIFICATE]: 0,
      [DocumentType.MARRIAGE_CERTIFICATE]: 0,
      [DocumentType.DIVORCE_DECREE]: 0,
      [DocumentType.ADOPTION_PAPERS]: 0,
      [DocumentType.COURT_ORDER]: 0,
      [DocumentType.UTILITY_BILL]: 0,
      [DocumentType.BANK_STATEMENT]: 0,
      [DocumentType.RENTAL_AGREEMENT]: 0,
      [DocumentType.EMPLOYMENT_VERIFICATION]: 0,
      [DocumentType.INVOICE]: 0,
      [DocumentType.CONTRACT]: 0,
      [DocumentType.OTHER]: 0
    };

    for (const document of documents) {
      documentsByType[document.type]++;
    }

    // Category distribution
    const documentsByCategory: Record<string, number> = {};
    for (const document of documents) {
      documentsByCategory[document.category] = (documentsByCategory[document.category] || 0) + 1;
    }

    // Country distribution
    const documentsByCountry: Record<string, number> = {};
    for (const document of documents) {
      documentsByCountry[document.country] = (documentsByCountry[document.country] || 0) + 1;
    }

    // Status distribution
    const documentsByStatus: Record<VerificationStatus, number> = {
      [VerificationStatus.PENDING]: 0,
      [VerificationStatus.PROCESSING]: 0,
      [VerificationStatus.COMPLETED]: 0,
      [VerificationStatus.APPROVED]: 0,
      [VerificationStatus.REJECTED]: 0,
      [VerificationStatus.NEEDS_REVIEW]: 0,
      [VerificationStatus.EXPIRED]: 0,
      [VerificationStatus.CANCELLED]: 0,
      [VerificationStatus.ERROR]: 0
    };

    for (const document of documents) {
      documentsByStatus[document.verificationStatus]++;
    }

    // Quality metrics
    const averageQualityScore = documents.length > 0
      ? documents.reduce((sum, d) => sum + (this.getQualityNumericValue(d.quality)), 0) / documents.length
      : 0;

    const averageAuthenticityScore = documents.length > 0
      ? documents.reduce((sum, d) => sum + d.authenticityScore, 0) / documents.length
      : 0;

    const documentsByQuality: Record<DocumentQuality, number> = {
      [DocumentQuality.EXCELLENT]: 0,
      [DocumentQuality.GOOD]: 0,
      [DocumentQuality.FAIR]: 0,
      [DocumentQuality.POOR]: 0,
      [DocumentQuality.UNREADABLE]: 0
    };

    for (const document of documents) {
      documentsByQuality[document.quality]++;
    }

    // Fraud metrics
    const fraudRiskDistribution: Record<FraudRisk, number> = {
      [FraudRisk.LOW]: 0,
      [FraudRisk.MEDIUM]: 0,
      [FraudRisk.HIGH]: 0,
      [FraudRisk.CRITICAL]: 0
    };

    for (const document of documents) {
      fraudRiskDistribution[document.fraudRisk]++;
    }

    const highRiskDocuments = documents.filter(d => d.fraudRisk === FraudRisk.HIGH || d.fraudRisk === FraudRisk.CRITICAL).length;

    // Review metrics
    const manualReviewRate = documents.length > 0
      ? documents.filter(d => d.verificationStatus === VerificationStatus.NEEDS_REVIEW).length / documents.length
      : 0;

    const approvalRate = documents.length > 0
      ? documents.filter(d => d.verificationStatus === VerificationStatus.APPROVED).length / documents.length
      : 0;

    const rejectionRate = documents.length > 0
      ? documents.filter(d => d.verificationStatus === VerificationStatus.REJECTED).length / documents.length
      : 0;

    return {
      period,
      totalDocuments,
      documentsByType,
      documentsByCategory,
      documentsByCountry,
      averageProcessingTime: 0, // Would calculate from processing timestamps
      processingSuccessRate: approvalRate,
      documentsByStatus,
      averageQualityScore,
      averageAuthenticityScore,
      documentsByQuality,
      fraudRiskDistribution,
      highRiskDocuments,
      fraudDetectionRate: 0, // Would calculate from fraud detection results
      manualReviewRate,
      averageReviewTime: 0, // Would calculate from review timestamps
      approvalRate,
      rejectionRate,
      errorsByType: {},
      processingErrors: documents.filter(d => d.verificationStatus === VerificationStatus.ERROR).length,
      dailySubmissions: [] // Would aggregate by date
    };
  }

  private getQualityNumericValue(quality: DocumentQuality): number {
    const qualityMap: Record<DocumentQuality, number> = {
      [DocumentQuality.EXCELLENT]: 95,
      [DocumentQuality.GOOD]: 80,
      [DocumentQuality.FAIR]: 65,
      [DocumentQuality.POOR]: 45,
      [DocumentQuality.UNREADABLE]: 20
    };
    return qualityMap[quality];
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.isProcessing = false;
    this.processingQueue.length = 0;
    this.emit('serviceStopped');
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalDocuments: this.documents.size,
        pendingProcessing: this.processingQueue.length,
        isProcessing: this.isProcessing,
        ocrEnabled: this.config.enableOCR,
        authenticityCheckEnabled: this.config.enableAuthenticityCheck,
        fraudDetectionEnabled: this.config.enableFraudDetection
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        documents: Array.from(this.documents.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'Document ID', 'User ID', 'Type', 'Status', 'Quality', 'Authenticity Score',
        'Fraud Risk', 'Uploaded At', 'Processed At'
      ];
      const rows = Array.from(this.documents.values()).map(d => [
        d.id,
        d.userId,
        d.type,
        d.verificationStatus,
        d.quality,
        d.authenticityScore,
        d.fraudRisk,
        d.uploadedAt.toISOString(),
        d.processedAt?.toISOString() || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
