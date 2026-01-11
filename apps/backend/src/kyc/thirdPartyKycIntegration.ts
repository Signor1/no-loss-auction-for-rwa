import { EventEmitter } from 'events';

// Enums
export enum KYCProvider {
  SUMSUB = 'sumsub',
  ONFIDO = 'onfido',
  JUMIO = 'jumio',
  VERIFF = 'veriff',
  IDMETRIC = 'idmetric',
  TRULIOO = 'trulioo',
  COMPLYADVANTAGE = 'complyadvantage',
  ACCENTURE = 'accenture'
}

export enum VerificationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  ULTIMATE = 'ultimate'
}

export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVING_LICENSE = 'driving_license',
  RESIDENCE_PERMIT = 'residence_permit',
  VISA = 'visa',
  MILITARY_ID = 'military_id',
  TAX_ID = 'tax_id',
  SOCIAL_SECURITY = 'social_security'
}

export enum VerificationStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

// Interfaces
export interface KYCProviderConfig {
  provider: KYCProvider;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  webhookUrl: string;
  enabled: boolean;
  sandbox: boolean;
  supportedDocuments: DocumentType[];
  supportedLevels: VerificationLevel[];
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
  timeout: number; // seconds
  retryAttempts: number;
}

export interface KYCApplicant {
  id: string;
  userId: string;
  provider: KYCProvider;
  externalId: string; // Provider's applicant ID
  verificationLevel: VerificationLevel;
  status: VerificationStatus;
  
  // Personal information
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  nationality: string;
  countryOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  
  // Contact information
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Verification details
  documents: KYCDocument[];
  biometrics?: KYCBiometric;
  
  // Provider-specific data
  providerData: Record<string, any>;
  rawResponse?: any;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface KYCDocument {
  id: string;
  type: DocumentType;
  country: string;
  number: string;
  issueDate: Date;
  expiryDate?: Date;
  
  // File information
  frontImage?: string; // URL or file reference
  backImage?: string; // URL or file reference
  selfie?: string; // URL or file reference
  
  // Verification results
  verificationStatus: VerificationStatus;
  extractedData?: Record<string, any>;
  authenticityScore?: number;
  faceMatchScore?: number;
  
  // Issues found
  issues: string[];
  warnings: string[];
  
  // Provider data
  providerData: Record<string, any>;
  
  // Timestamps
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface KYCBiometric {
  id: string;
  type: 'face' | 'fingerprint' | 'voice' | 'iris';
  template: string; // Biometric template
  confidence: number; // Match confidence
  livenessScore: number; // Liveness detection score
  
  // Images
  images: string[]; // URLs or file references
  
  // Provider data
  providerData: Record<string, any>;
  
  // Timestamps
  capturedAt: Date;
  verifiedAt?: Date;
}

export interface KYCVerificationRequest {
  id: string;
  userId: string;
  provider: KYCProvider;
  verificationLevel: VerificationLevel;
  
  // Required documents
  requiredDocuments: {
    type: DocumentType;
    required: boolean;
    description: string;
  }[];
  
  // Applicant data
  applicantData: Partial<KYCApplicant>;
  
  // Status
  status: VerificationStatus;
  
  // Provider data
  providerData: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface KYCIntegrationConfig {
  defaultProvider: KYCProvider;
  fallbackProviders: KYCProvider[];
  enableAutoRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number; // seconds
  enableWebhooks: boolean;
  webhookTimeout: number; // seconds
  enableDataRetention: boolean;
  retentionPeriod: number; // days
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface KYCAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  pendingVerifications: number;
  
  // Provider metrics
  verificationsByProvider: Record<KYCProvider, number>;
  successRateByProvider: Record<KYCProvider, number>;
  averageProcessingTimeByProvider: Record<KYCProvider, number>;
  
  // Document metrics
  documentsByType: Record<DocumentType, number>;
  documentVerificationRates: Record<DocumentType, number>;
  averageAuthenticityScores: Record<DocumentType, number>;
  
  // Level metrics
  verificationsByLevel: Record<VerificationLevel, number>;
  levelSuccessRates: Record<VerificationLevel, number>;
  
  // Error metrics
  errorsByProvider: Record<KYCProvider, number>;
  errorsByType: Record<string, number>;
  
  // Geographic metrics
  verificationsByCountry: Record<string, number>;
  verificationRatesByCountry: Record<string, number>;
  
  // Trends
  dailyVerifications: {
    date: Date;
    count: number;
    successRate: number;
  }[];
}

// Main Third-Party KYC Integration Service
export class ThirdPartyKycIntegrationService extends EventEmitter {
  private providers: Map<KYCProvider, KYCProviderConfig> = new Map();
  private applicants: Map<string, KYCApplicant> = new Map();
  private userApplicants: Map<string, string[]> = new Map();
  private requests: Map<string, KYCVerificationRequest> = new Map();
  private config: KYCIntegrationConfig;
  private rateLimitTracker: Map<KYCProvider, { count: number; windowStart: Date }> = new Map();

  constructor(config?: Partial<KYCIntegrationConfig>) {
    super();
    this.config = {
      defaultProvider: KYCProvider.SUMSUB,
      fallbackProviders: [KYCProvider.ONFIDO, KYCProvider.VERIFF],
      enableAutoRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 60,
      enableWebhooks: true,
      webhookTimeout: 30,
      enableDataRetention: true,
      retentionPeriod: 2555, // 7 years
      enableAuditLogging: true,
      enableEncryption: true,
      ...config
    };
  }

  // Provider Management
  async configureProvider(config: KYCProviderConfig): Promise<void> {
    this.providers.set(config.provider, config);
    this.emit('providerConfigured', { provider: config.provider, config });
  }

  async getProviderConfig(provider: KYCProvider): Promise<KYCProviderConfig | null> {
    return this.providers.get(provider) || null;
  }

  async getEnabledProviders(): Promise<KYCProvider[]> {
    return Array.from(this.providers.values())
      .filter(config => config.enabled)
      .map(config => config.provider);
  }

  // Applicant Management
  async createApplicant(
    userId: string,
    provider: KYCProvider,
    applicantData: Partial<KYCApplicant>,
    verificationLevel: VerificationLevel = VerificationLevel.STANDARD
  ): Promise<KYCApplicant> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig || !providerConfig.enabled) {
      throw new Error(`KYC provider ${provider} is not configured or enabled`);
    }

    // Check rate limiting
    await this.checkRateLimit(provider);

    const applicantId = this.generateId();
    const now = new Date();

    const applicant: KYCApplicant = {
      id: applicantId,
      userId,
      provider,
      externalId: '',
      verificationLevel,
      status: VerificationStatus.PENDING,
      firstName: applicantData.firstName || '',
      lastName: applicantData.lastName || '',
      middleName: applicantData.middleName,
      dateOfBirth: applicantData.dateOfBirth || new Date(),
      nationality: applicantData.nationality || '',
      countryOfBirth: applicantData.countryOfBirth || '',
      gender: applicantData.gender,
      email: applicantData.email || '',
      phone: applicantData.phone,
      address: applicantData.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      documents: [],
      biometrics: applicantData.biometrics,
      providerData: {},
      createdAt: now,
      updatedAt: now,
      metadata: applicantData.metadata || {}
    };

    // Create applicant with provider
    try {
      const externalApplicant = await this.createProviderApplicant(provider, applicant);
      applicant.externalId = externalApplicant.id;
      applicant.providerData = externalApplicant;
      applicant.status = VerificationStatus.INITIATED;
    } catch (error) {
      applicant.status = VerificationStatus.ERROR;
      applicant.providerData = { error: error.message };
      this.emit('applicantCreationError', { applicant, error });
    }

    // Store applicant
    this.applicants.set(applicantId, applicant);
    
    // Update user applicants index
    const userApplicantIds = this.userApplicants.get(userId) || [];
    userApplicantIds.push(applicantId);
    this.userApplicants.set(userId, userApplicantIds);

    this.emit('applicantCreated', applicant);
    return applicant;
  }

  async updateApplicant(
    applicantId: string,
    updates: Partial<KYCApplicant>
  ): Promise<KYCApplicant> {
    const applicant = this.applicants.get(applicantId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    Object.assign(applicant, updates);
    applicant.updatedAt = new Date();

    this.emit('applicantUpdated', applicant);
    return applicant;
  }

  async getApplicant(applicantId: string): Promise<KYCApplicant | null> {
    return this.applicants.get(applicantId) || null;
  }

  async getUserApplicants(userId: string): Promise<KYCApplicant[]> {
    const applicantIds = this.userApplicants.get(userId) || [];
    return applicantIds
      .map(id => this.applicants.get(id))
      .filter((a): a is KYCApplicant => a !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Verification Process
  async initiateVerification(
    userId: string,
    provider: KYCProvider,
    verificationLevel: VerificationLevel,
    applicantData: Partial<KYCApplicant>
  ): Promise<KYCVerificationRequest> {
    const requestId = this.generateId();
    const now = new Date();

    const request: KYCVerificationRequest = {
      id: requestId,
      userId,
      provider,
      verificationLevel,
      requiredDocuments: this.getRequiredDocuments(provider, verificationLevel),
      applicantData,
      status: VerificationStatus.PENDING,
      providerData: {},
      createdAt: now,
      metadata: {}
    };

    this.requests.set(requestId, request);

    // Create applicant
    const applicant = await this.createApplicant(userId, provider, applicantData, verificationLevel);
    request.applicantData = applicant;

    this.emit('verificationInitiated', { request, applicant });
    return request;
  }

  async submitDocuments(
    applicantId: string,
    documents: Array<{
      type: DocumentType;
      country: string;
      frontImage: string;
      backImage?: string;
      selfie?: string;
    }>
  ): Promise<KYCApplicant> {
    const applicant = this.applicants.get(applicantId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    const providerConfig = this.providers.get(applicant.provider);
    if (!providerConfig) {
      throw new Error('Provider configuration not found');
    }

    // Upload documents to provider
    const uploadedDocuments: KYCDocument[] = [];
    
    for (const docData of documents) {
      const documentId = this.generateId();
      const now = new Date();

      const document: KYCDocument = {
        id: documentId,
        type: docData.type,
        country: docData.country,
        number: '',
        issueDate: new Date(),
        verificationStatus: VerificationStatus.PENDING,
        issues: [],
        warnings: [],
        providerData: {},
        uploadedAt: now
      };

      try {
        // Upload to provider
        const providerDoc = await this.uploadDocumentToProvider(
          applicant.provider,
          applicant.externalId,
          docData
        );
        
        document.providerData = providerDoc;
        document.verificationStatus = VerificationStatus.IN_PROGRESS;
        
        // Extract data if available
        if (providerDoc.extractedData) {
          document.extractedData = providerDoc.extractedData;
          document.number = providerDoc.extractedData.number || '';
          document.issueDate = new Date(providerDoc.extractedData.issueDate) || new Date();
          if (providerDoc.extractedData.expiryDate) {
            document.expiryDate = new Date(providerDoc.extractedData.expiryDate);
          }
        }
      } catch (error) {
        document.verificationStatus = VerificationStatus.ERROR;
        document.issues.push(`Upload failed: ${error.message}`);
      }

      uploadedDocuments.push(document);
    }

    // Update applicant
    applicant.documents = [...applicant.documents, ...uploadedDocuments];
    applicant.updatedAt = new Date();
    applicant.status = VerificationStatus.IN_PROGRESS;

    this.emit('documentsSubmitted', { applicant, documents: uploadedDocuments });
    return applicant;
  }

  async submitBiometrics(
    applicantId: string,
    biometricData: {
      type: 'face' | 'fingerprint' | 'voice' | 'iris';
      images: string[];
      template?: string;
    }
  ): Promise<KYCApplicant> {
    const applicant = this.applicants.get(applicantId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    const biometricId = this.generateId();
    const now = new Date();

    const biometric: KYCBiometric = {
      id: biometricId,
      type: biometricData.type,
      template: biometricData.template || '',
      confidence: 0,
      livenessScore: 0,
      images: biometricData.images,
      providerData: {},
      capturedAt: now
    };

    try {
      // Submit biometrics to provider
      const providerBiometric = await this.submitBiometricsToProvider(
        applicant.provider,
        applicant.externalId,
        biometricData
      );
      
      biometric.providerData = providerBiometric;
      biometric.confidence = providerBiometric.confidence || 0;
      biometric.livenessScore = providerBiometric.livenessScore || 0;
      biometric.verifiedAt = now;
    } catch (error) {
      biometric.providerData = { error: error.message };
    }

    applicant.biometrics = biometric;
    applicant.updatedAt = new Date();

    this.emit('biometricsSubmitted', { applicant, biometric });
    return applicant;
  }

  async completeVerification(applicantId: string): Promise<KYCApplicant> {
    const applicant = this.applicants.get(applicantId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    try {
      // Submit verification to provider
      const verificationResult = await this.submitVerificationToProvider(
        applicant.provider,
        applicant.externalId
      );

      // Update applicant with results
      applicant.status = this.mapProviderStatus(verificationResult.status);
      applicant.rawResponse = verificationResult;
      applicant.reviewedAt = new Date();

      // Update document statuses
      if (verificationResult.documents) {
        for (const docResult of verificationResult.documents) {
          const document = applicant.documents.find(d => d.id === docResult.id);
          if (document) {
            document.verificationStatus = this.mapProviderStatus(docResult.status);
            document.authenticityScore = docResult.authenticityScore;
            document.faceMatchScore = docResult.faceMatchScore;
            document.issues = docResult.issues || [];
            document.warnings = docResult.warnings || [];
            document.verifiedAt = new Date();
          }
        }
      }

      this.emit('verificationCompleted', { applicant, result: verificationResult });
    } catch (error) {
      applicant.status = VerificationStatus.ERROR;
      applicant.providerData = { error: error.message };
      this.emit('verificationError', { applicant, error });
    }

    return applicant;
  }

  async getApplicantStatus(applicantId: string): Promise<KYCApplicant> {
    const applicant = this.applicants.get(applicantId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    // Check status with provider
    try {
      const providerStatus = await this.getApplicantStatusFromProvider(
        applicant.provider,
        applicant.externalId
      );

      // Update local status if different
      if (providerStatus.status !== applicant.status) {
        applicant.status = this.mapProviderStatus(providerStatus.status);
        applicant.providerData = { ...applicant.providerData, ...providerStatus };
        applicant.updatedAt = new Date();
      }
    } catch (error) {
      // Don't update status on error, just log it
      this.emit('statusCheckError', { applicant, error });
    }

    return applicant;
  }

  // Private Methods
  private async createProviderApplicant(
    provider: KYCProvider,
    applicant: KYCApplicant
  ): Promise<{ id: string; [key: string]: any }> {
    // Placeholder for provider-specific applicant creation
    // In a real implementation, you would make HTTP requests to the provider's API
    const mockResponse = {
      id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'created',
      createdAt: new Date()
    };

    this.emit('providerApplicantCreated', { provider, applicant, response: mockResponse });
    return mockResponse;
  }

  private async uploadDocumentToProvider(
    provider: KYCProvider,
    applicantId: string,
    documentData: any
  ): Promise<any> {
    // Placeholder for document upload
    const mockResponse = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'uploaded',
      extractedData: {
        number: '123456789',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      }
    };

    this.emit('documentUploaded', { provider, applicantId, documentData, response: mockResponse });
    return mockResponse;
  }

  private async submitBiometricsToProvider(
    provider: KYCProvider,
    applicantId: string,
    biometricData: any
  ): Promise<any> {
    // Placeholder for biometric submission
    const mockResponse = {
      id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence: 0.95,
      livenessScore: 0.98,
      status: 'verified'
    };

    this.emit('biometricsSubmittedToProvider', { provider, applicantId, biometricData, response: mockResponse });
    return mockResponse;
  }

  private async submitVerificationToProvider(
    provider: KYCProvider,
    applicantId: string
  ): Promise<any> {
    // Placeholder for verification submission
    const mockResponse = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'approved',
      documents: [
        {
          id: 'doc1',
          status: 'approved',
          authenticityScore: 0.92,
          faceMatchScore: 0.88,
          issues: [],
          warnings: []
        }
      ]
    };

    this.emit('verificationSubmittedToProvider', { provider, applicantId, response: mockResponse });
    return mockResponse;
  }

  private async getApplicantStatusFromProvider(
    provider: KYCProvider,
    applicantId: string
  ): Promise<any> {
    // Placeholder for status check
    const mockResponse = {
      id: applicantId,
      status: 'approved',
      updatedAt: new Date()
    };

    this.emit('statusCheckedFromProvider', { provider, applicantId, response: mockResponse });
    return mockResponse;
  }

  private getRequiredDocuments(
    provider: KYCProvider,
    level: VerificationLevel
  ): KYCVerificationRequest['requiredDocuments'] {
    const baseDocuments = [
      {
        type: DocumentType.PASSPORT,
        required: true,
        description: 'Valid passport'
      }
    ];

    switch (level) {
      case VerificationLevel.BASIC:
        return baseDocuments;
      
      case VerificationLevel.STANDARD:
        return [
          ...baseDocuments,
          {
            type: DocumentType.NATIONAL_ID,
            required: false,
            description: 'National ID card (optional)'
          }
        ];
      
      case VerificationLevel.ENHANCED:
        return [
          ...baseDocuments,
          {
            type: DocumentType.NATIONAL_ID,
            required: true,
            description: 'National ID card'
          },
          {
            type: DocumentType.DRIVING_LICENSE,
            required: false,
            description: 'Driving license (optional)'
          }
        ];
      
      case VerificationLevel.ULTIMATE:
        return [
          ...baseDocuments,
          {
            type: DocumentType.NATIONAL_ID,
            required: true,
            description: 'National ID card'
          },
          {
            type: DocumentType.DRIVING_LICENSE,
            required: true,
            description: 'Driving license'
          },
          {
            type: DocumentType.RESIDENCE_PERMIT,
            required: false,
            description: 'Residence permit (optional)'
          }
        ];
      
      default:
        return baseDocuments;
    }
  }

  private mapProviderStatus(providerStatus: string): VerificationStatus {
    const statusMap: Record<string, VerificationStatus> = {
      'pending': VerificationStatus.PENDING,
      'initiated': VerificationStatus.INITIATED,
      'in_progress': VerificationStatus.IN_PROGRESS,
      'completed': VerificationStatus.COMPLETED,
      'approved': VerificationStatus.APPROVED,
      'rejected': VerificationStatus.REJECTED,
      'expired': VerificationStatus.EXPIRED,
      'cancelled': VerificationStatus.CANCELLED,
      'error': VerificationStatus.ERROR
    };

    return statusMap[providerStatus.toLowerCase()] || VerificationStatus.PENDING;
  }

  private async checkRateLimit(provider: KYCProvider): Promise<void> {
    const config = this.providers.get(provider);
    if (!config) return;

    const now = new Date();
    const windowStart = new Date(now.getTime() - 1000); // 1 second window
    
    const tracker = this.rateLimitTracker.get(provider);
    
    if (!tracker || tracker.windowStart < windowStart) {
      this.rateLimitTracker.set(provider, {
        count: 1,
        windowStart: now
      });
    } else {
      tracker.count++;
      
      if (tracker.count > config.rateLimit.requestsPerSecond) {
        this.emit('rateLimitExceeded', { provider, count: tracker.count });
        throw new Error('Rate limit exceeded');
      }
    }
  }

  private generateId(): string {
    return `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getKYCAnalytics(
    period: { start: Date; end: Date }
  ): Promise<KYCAnalytics> {
    const applicants = Array.from(this.applicants.values())
      .filter(a => a.createdAt >= period.start && a.createdAt <= period.end);

    const totalVerifications = applicants.length;
    const successfulVerifications = applicants.filter(a => a.status === VerificationStatus.APPROVED).length;
    const failedVerifications = applicants.filter(a => a.status === VerificationStatus.REJECTED).length;
    const pendingVerifications = applicants.filter(a => 
      [VerificationStatus.PENDING, VerificationStatus.INITIATED, VerificationStatus.IN_PROGRESS].includes(a.status)
    ).length;

    // Provider metrics
    const verificationsByProvider: Record<KYCProvider, number> = {
      [KYCProvider.SUMSUB]: 0,
      [KYCProvider.ONFIDO]: 0,
      [KYCProvider.JUMIO]: 0,
      [KYCProvider.VERIFF]: 0,
      [KYCProvider.IDMETRIC]: 0,
      [KYCProvider.TRULIOO]: 0,
      [KYCProvider.COMPLYADVANTAGE]: 0,
      [KYCProvider.ACCENTURE]: 0
    };

    for (const applicant of applicants) {
      verificationsByProvider[applicant.provider]++;
    }

    const successRateByProvider: Record<KYCProvider, number> = {} as Record<KYCProvider, number>;
    for (const provider of Object.keys(verificationsByProvider) as KYCProvider[]) {
      const providerApplicants = applicants.filter(a => a.provider === provider);
      const providerSuccesses = providerApplicants.filter(a => a.status === VerificationStatus.APPROVED).length;
      successRateByProvider[provider] = providerApplicants.length > 0 ? providerSuccesses / providerApplicants.length : 0;
    }

    // Document metrics
    const allDocuments = applicants.flatMap(a => a.documents);
    const documentsByType: Record<DocumentType, number> = {
      [DocumentType.PASSPORT]: 0,
      [DocumentType.NATIONAL_ID]: 0,
      [DocumentType.DRIVING_LICENSE]: 0,
      [DocumentType.RESIDENCE_PERMIT]: 0,
      [DocumentType.VISA]: 0,
      [DocumentType.MILITARY_ID]: 0,
      [DocumentType.TAX_ID]: 0,
      [DocumentType.SOCIAL_SECURITY]: 0
    };

    for (const document of allDocuments) {
      documentsByType[document.type]++;
    }

    const documentVerificationRates: Record<DocumentType, number> = {} as Record<DocumentType, number>;
    for (const docType of Object.keys(documentsByType) as DocumentType[]) {
      const typeDocuments = allDocuments.filter(d => d.type === docType);
      const typeVerified = typeDocuments.filter(d => d.verificationStatus === VerificationStatus.APPROVED).length;
      documentVerificationRates[docType] = typeDocuments.length > 0 ? typeVerified / typeDocuments.length : 0;
    }

    // Level metrics
    const verificationsByLevel: Record<VerificationLevel, number> = {
      [VerificationLevel.BASIC]: 0,
      [VerificationLevel.STANDARD]: 0,
      [VerificationLevel.ENHANCED]: 0,
      [VerificationLevel.ULTIMATE]: 0
    };

    for (const applicant of applicants) {
      verificationsByLevel[applicant.verificationLevel]++;
    }

    const levelSuccessRates: Record<VerificationLevel, number> = {} as Record<VerificationLevel, number>;
    for (const level of Object.keys(verificationsByLevel) as VerificationLevel[]) {
      const levelApplicants = applicants.filter(a => a.verificationLevel === level);
      const levelSuccesses = levelApplicants.filter(a => a.status === VerificationStatus.APPROVED).length;
      levelSuccessRates[level] = levelApplicants.length > 0 ? levelSuccesses / levelApplicants.length : 0;
    }

    return {
      period,
      totalVerifications,
      successfulVerifications,
      failedVerifications,
      pendingVerifications,
      verificationsByProvider,
      successRateByProvider,
      averageProcessingTimeByProvider: {} as Record<KYCProvider, number>, // Would calculate from timestamps
      documentsByType,
      documentVerificationRates,
      averageAuthenticityScores: {} as Record<DocumentType, number>, // Would calculate from document scores
      verificationsByLevel,
      levelSuccessRates,
      errorsByProvider: {} as Record<KYCProvider, number>,
      errorsByType: {},
      verificationsByCountry: {}, // Would extract from applicant data
      verificationRatesByCountry: {},
      dailyVerifications: [] // Would aggregate by date
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredData(), 60 * 60 * 1000); // Every hour
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up expired applicants
    for (const [applicantId, applicant] of this.applicants.entries()) {
      if (applicant.expiresAt && now > applicant.expiresAt.getTime()) {
        applicant.status = VerificationStatus.EXPIRED;
        cleanedCount++;
      }
    }

    this.emit('dataCleanedUp', { count: cleanedCount });
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalApplicants: this.applicants.size,
        pendingVerifications: Array.from(this.applicants.values())
          .filter(a => [VerificationStatus.PENDING, VerificationStatus.IN_PROGRESS].includes(a.status)).length,
        configuredProviders: this.providers.size,
        enabledProviders: Array.from(this.providers.values()).filter(p => p.enabled).length,
        defaultProvider: this.config.defaultProvider
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        applicants: Array.from(this.applicants.values()),
        requests: Array.from(this.requests.values()),
        providers: Array.from(this.providers.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'Applicant ID', 'User ID', 'Provider', 'Status', 'Verification Level',
        'First Name', 'Last Name', 'Country', 'Created At', 'Reviewed At'
      ];
      const rows = Array.from(this.applicants.values()).map(a => [
        a.id,
        a.userId,
        a.provider,
        a.status,
        a.verificationLevel,
        a.firstName,
        a.lastName,
        a.address.country,
        a.createdAt.toISOString(),
        a.reviewedAt?.toISOString() || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
