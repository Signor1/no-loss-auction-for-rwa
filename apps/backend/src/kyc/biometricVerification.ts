import { EventEmitter } from 'events';

// Enums
export enum BiometricType {
  FACE = 'face',
  FINGERPRINT = 'fingerprint',
  VOICE = 'voice',
  IRIS = 'iris',
  PALM = 'palm',
  VEIN = 'vein',
  SIGNATURE = 'signature',
  KEYSTROKE = 'keystroke'
}

export enum VerificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
  EXPIRED = 'expired',
  FAILED = 'failed',
  ERROR = 'error'
}

export enum LivenessTest {
  BLINK = 'blink',
  SMILE = 'smile',
  HEAD_MOVEMENT = 'head_movement',
  VOICE_COMMAND = 'voice_command',
  RANDOM_ACTION = 'random_action'
}

export enum MatchLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

// Interfaces
export interface BiometricTemplate {
  id: string;
  userId: string;
  type: BiometricType;
  template: string; // Encrypted biometric template
  algorithm: string;
  version: string;
  quality: number; // 0-100
  confidence: number; // 0-100
  
  // Template metadata
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    manufacturer: string;
    model: string;
  };
  
  // Capture information
  captureDate: Date;
  captureLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  
  // Security
  isEncrypted: boolean;
  encryptionKeyId?: string;
  checksum: string;
  
  // Status
  isActive: boolean;
  isPrimary: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface BiometricVerification {
  id: string;
  userId: string;
  type: BiometricType;
  templateId?: string; // For verification against existing template
  
  // Input data
  inputData: {
    images?: string[]; // URLs or file references
    audioData?: string; // Audio data URL or reference
    videoData?: string; // Video data URL or reference
    signatureData?: string; // Signature data
    keystrokeData?: string; // Keystroke timing data
  };
  
  // Verification results
  verificationStatus: VerificationStatus;
  matchScore: number; // 0-100
  matchLevel: MatchLevel;
  confidence: number; // 0-100
  
  // Liveness detection
  livenessDetected: boolean;
  livenessScore: number; // 0-100
  livenessTests: LivenessTest[];
  livenessResults: LivenessResult[];
  
  // Anti-spoofing
  antiSpoofingScore: number; // 0-100
  spoofingAttempts: number;
  spoofingDetected: boolean;
  
  // Processing details
  processingSteps: ProcessingStep[];
  processingTime: number; // milliseconds
  
  // Issues and warnings
  issues: BiometricIssue[];
  warnings: BiometricWarning[];
  
  // Review information
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface LivenessResult {
  test: LivenessTest;
  passed: boolean;
  confidence: number;
  duration: number; // milliseconds
  timestamp: Date;
  data?: Record<string, any>;
}

export interface ProcessingStep {
  id: string;
  name: string;
  type: 'preprocessing' | 'feature_extraction' | 'matching' | 'liveness' | 'anti_spoofing';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  confidence?: number;
  duration?: number; // milliseconds
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface BiometricIssue {
  type: 'low_quality' | 'no_face_detected' | 'multiple_faces' | 'poor_lighting' | 'blur' | 'occlusion' | 'spoofing_detected' | 'template_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  autoDetected: boolean;
}

export interface BiometricWarning {
  type: 'atypical_pattern' | 'low_confidence' | 'environmental_factors' | 'device_limitations';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  autoDetected: boolean;
}

export interface BiometricConfig {
  // General settings
  enableLivenessDetection: boolean;
  enableAntiSpoofing: boolean;
  enableTemplateEncryption: boolean;
  enableQualityCheck: boolean;
  
  // Thresholds
  minMatchScore: number;
  minLivenessScore: number;
  minAntiSpoofingScore: number;
  minQualityScore: number;
  
  // Liveness settings
  requiredLivenessTests: LivenessTest[];
  livenessTimeout: number; // seconds
  maxLivenessAttempts: number;
  
  // Anti-spoofing settings
  antiSpoofingModels: string[];
  spoofingDetectionThreshold: number;
  
  // Template settings
  templateRetentionPeriod: number; // days
  maxTemplatesPerUser: number;
  primaryTemplateSelection: 'highest_quality' | 'most_recent' | 'manual';
  
  // Processing settings
  enableBatchProcessing: boolean;
  batchSize: number;
  processingTimeout: number; // seconds
  retryAttempts: number;
  
  // Security settings
  enableDataRetention: boolean;
  retentionPeriod: number; // days
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface BiometricAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalVerifications: number;
  verificationsByType: Record<BiometricType, number>;
  templatesCreated: number;
  templatesByType: Record<BiometricType, number>;
  
  // Success metrics
  successfulVerifications: number;
  successRateByType: Record<BiometricType, number>;
  averageMatchScores: Record<BiometricType, number>;
  
  // Quality metrics
  averageQualityScores: Record<BiometricType, number>;
  qualityDistribution: Record<string, number>;
  
  // Liveness metrics
  livenessDetectionRate: number;
  averageLivenessScores: Record<BiometricType, number>;
  livenessTestResults: Record<LivenessTest, { passed: number; failed: number }>;
  
  // Anti-spoofing metrics
  spoofingAttempts: number;
  spoofingDetectionRate: number;
  averageAntiSpoofingScores: Record<BiometricType, number>;
  
  // Performance metrics
  averageProcessingTime: number;
  processingTimeByType: Record<BiometricType, number>;
  
  // Error metrics
  errorsByType: Record<BiometricType, number>;
  errorsByCategory: Record<string, number>;
  
  // Trends
  dailyVerifications: {
    date: Date;
    verifications: number;
    successRate: number;
  }[];
}

// Main Biometric Verification Service
export class BiometricVerificationService extends EventEmitter {
  private templates: Map<string, BiometricTemplate> = new Map();
  private userTemplates: Map<string, string[]> = new Map();
  private verifications: Map<string, BiometricVerification> = new Map();
  private config: BiometricConfig;
  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor(config?: Partial<BiometricConfig>) {
    super();
    this.config = {
      enableLivenessDetection: true,
      enableAntiSpoofing: true,
      enableTemplateEncryption: true,
      enableQualityCheck: true,
      minMatchScore: 80,
      minLivenessScore: 70,
      minAntiSpoofingScore: 75,
      minQualityScore: 70,
      requiredLivenessTests: [LivenessTest.BLINK, LivenessTest.SMILE],
      livenessTimeout: 30,
      maxLivenessAttempts: 3,
      antiSpoofingModels: ['face_anti_spoof_v2', 'depth_analysis_v1'],
      spoofingDetectionThreshold: 0.5,
      templateRetentionPeriod: 365 * 2, // 2 years
      maxTemplatesPerUser: 3,
      primaryTemplateSelection: 'highest_quality',
      enableBatchProcessing: true,
      batchSize: 10,
      processingTimeout: 60,
      retryAttempts: 3,
      enableDataRetention: true,
      retentionPeriod: 2555, // 7 years
      enableAuditLogging: true,
      enableEncryption: true,
      ...config
    };
  }

  // Template Management
  async createTemplate(
    userId: string,
    type: BiometricType,
    inputData: {
      images?: string[];
      audioData?: string;
      videoData?: string;
      signatureData?: string;
      keystrokeData?: string;
    },
    deviceInfo: {
      deviceId: string;
      deviceType: string;
      manufacturer: string;
      model: string;
    },
    options: {
      isPrimary?: boolean;
      captureLocation?: {
        latitude: number;
        longitude: number;
        accuracy: number;
      };
    } = {}
  ): Promise<BiometricTemplate> {
    // Check template limit
    const userTemplates = await this.getUserTemplates(userId);
    const activeTemplates = userTemplates.filter(t => t.isActive);
    
    if (activeTemplates.length >= this.config.maxTemplatesPerUser) {
      throw new Error(`Maximum templates per user (${this.config.maxTemplatesPerUser}) exceeded`);
    }

    const templateId = this.generateId();
    const now = new Date();

    // Process input data and create template
    const templateData = await this.processTemplateData(type, inputData);
    
    const template: BiometricTemplate = {
      id: templateId,
      userId,
      type,
      template: templateData.template,
      algorithm: templateData.algorithm,
      version: templateData.version,
      quality: templateData.quality,
      confidence: templateData.confidence,
      deviceInfo,
      captureDate: now,
      captureLocation: options.captureLocation,
      isEncrypted: this.config.enableTemplateEncryption,
      encryptionKeyId: this.config.enableEncryption ? 'default_key' : undefined,
      checksum: this.calculateChecksum(templateData.template),
      isActive: true,
      isPrimary: options.isPrimary || activeTemplates.length === 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.config.templateRetentionPeriod * 24 * 60 * 60 * 1000),
      metadata: {}
    };

    // Handle primary template selection
    if (template.isPrimary) {
      // Unset other primary templates
      for (const otherTemplate of activeTemplates) {
        if (otherTemplate.isPrimary) {
          otherTemplate.isPrimary = false;
          otherTemplate.updatedAt = now;
        }
      }
    }

    // Store template
    this.templates.set(templateId, template);
    
    // Update user templates index
    const userTemplateIds = this.userTemplates.get(userId) || [];
    userTemplateIds.push(templateId);
    this.userTemplates.set(userId, userTemplateIds);

    this.emit('templateCreated', template);
    return template;
  }

  async updateTemplate(
    templateId: string,
    updates: {
      isActive?: boolean;
      isPrimary?: boolean;
      expiresAt?: Date;
    }
  ): Promise<BiometricTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Handle primary template selection
    if (updates.isPrimary && !template.isPrimary) {
      const userTemplates = await this.getUserTemplates(template.userId);
      for (const otherTemplate of userTemplates) {
        if (otherTemplate.isPrimary) {
          otherTemplate.isPrimary = false;
          otherTemplate.updatedAt = new Date();
        }
      }
    }

    Object.assign(template, updates);
    template.updatedAt = new Date();

    this.emit('templateUpdated', template);
    return template;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    template.isActive = false;
    template.updatedAt = new Date();

    this.emit('templateDeleted', { templateId, template });
    return true;
  }

  async getTemplate(templateId: string): Promise<BiometricTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getUserTemplates(userId: string, type?: BiometricType): Promise<BiometricTemplate[]> {
    const templateIds = this.userTemplates.get(userId) || [];
    const templates = templateIds
      .map(id => this.templates.get(id))
      .filter((t): t is BiometricTemplate => t !== undefined && t.isActive);

    if (type) {
      return templates.filter(t => t.type === type);
    }

    return templates.sort((a, b) => {
      // Primary template first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Then by quality
      return b.quality - a.quality;
    });
  }

  async getPrimaryTemplate(userId: string, type: BiometricType): Promise<BiometricTemplate | null> {
    const templates = await this.getUserTemplates(userId, type);
    return templates.find(t => t.isPrimary) || null;
  }

  // Verification
  async verifyBiometric(
    userId: string,
    type: BiometricType,
    inputData: {
      images?: string[];
      audioData?: string;
      videoData?: string;
      signatureData?: string;
      keystrokeData?: string;
    },
    options: {
      templateId?: string;
      requireLiveness?: boolean;
      requireAntiSpoofing?: boolean;
      deviceId?: string;
    } = {}
  ): Promise<BiometricVerification> {
    const verificationId = this.generateId();
    const now = new Date();

    const verification: BiometricVerification = {
      id: verificationId,
      userId,
      type,
      templateId: options.templateId,
      inputData,
      verificationStatus: VerificationStatus.PENDING,
      matchScore: 0,
      matchLevel: MatchLevel.VERY_LOW,
      confidence: 0,
      livenessDetected: false,
      livenessScore: 0,
      livenessTests: this.config.enableLivenessDetection ? this.config.requiredLivenessTests : [],
      livenessResults: [],
      antiSpoofingScore: 0,
      spoofingAttempts: 0,
      spoofingDetected: false,
      processingSteps: [],
      processingTime: 0,
      issues: [],
      warnings: [],
      createdAt: now,
      metadata: {}
    };

    this.verifications.set(verificationId, verification);
    
    // Add to processing queue
    this.processingQueue.push(verificationId);

    this.emit('verificationInitiated', verification);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return verification;
  }

  async verifyAgainstTemplate(
    templateId: string,
    inputData: BiometricVerification['inputData']
  ): Promise<BiometricVerification> {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) {
      throw new Error('Template not found or inactive');
    }

    return await this.verifyBiometric(
      template.userId,
      template.type,
      inputData,
      { templateId }
    );
  }

  // Verification Processing
  private async processVerification(verificationId: string): Promise<BiometricVerification> {
    const verification = this.verifications.get(verificationId);
    if (!verification) {
      throw new Error('Verification not found');
    }

    verification.verificationStatus = VerificationStatus.PROCESSING;
    const startTime = Date.now();

    try {
      // Step 1: Quality Check
      if (this.config.enableQualityCheck) {
        await this.performQualityCheck(verification);
      }

      // Step 2: Feature Extraction
      await this.performFeatureExtraction(verification);

      // Step 3: Template Matching
      await this.performTemplateMatching(verification);

      // Step 4: Liveness Detection
      if (this.config.enableLivenessDetection && verification.type === BiometricType.FACE) {
        await this.performLivenessDetection(verification);
      }

      // Step 5: Anti-Spoofing
      if (this.config.enableAntiSpoofing) {
        await this.performAntiSpoofing(verification);
      }

      // Calculate final results
      await this.calculateFinalResults(verification);

      verification.processedAt = new Date();
      verification.processingTime = Date.now() - startTime;

      this.emit('verificationCompleted', verification);
      return verification;

    } catch (error) {
      verification.verificationStatus = VerificationStatus.ERROR;
      verification.processingTime = Date.now() - startTime;
      this.emit('verificationError', { verification, error });
      throw error;
    }
  }

  // Private Processing Methods
  private async processTemplateData(
    type: BiometricType,
    inputData: any
  ): Promise<{ template: string; algorithm: string; version: string; quality: number; confidence: number }> {
    // Placeholder for template processing
    // In a real implementation, you would use biometric SDKs like:
    // - Face: FaceNet, ArcFace, DeepFace
    // - Fingerprint: Neurotechnology, SecuGen
    // - Voice: Mozilla Voice, Google Speech-to-Text
    // - Iris: Iritech, IrisGuard
    
    return {
      template: `template_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
      algorithm: 'neural_net_v3',
      version: '3.2.1',
      quality: 85,
      confidence: 92
    };
  }

  private async performQualityCheck(verification: BiometricVerification): Promise<void> {
    const stepId = this.generateId();
    const step: ProcessingStep = {
      id: stepId,
      name: 'Quality Check',
      type: 'preprocessing',
      status: 'in_progress',
      startedAt: new Date()
    };

    verification.processingSteps.push(step);

    try {
      // Placeholder for quality assessment
      const qualityScore = 88; // Mock score
      
      if (qualityScore < this.config.minQualityScore) {
        verification.issues.push({
          type: 'low_quality',
          severity: 'medium',
          description: 'Biometric sample quality is below minimum threshold',
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

  private async performFeatureExtraction(verification: BiometricVerification): Promise<void> {
    const stepId = this.generateId();
    const step: ProcessingStep = {
      id: stepId,
      name: 'Feature Extraction',
      type: 'feature_extraction',
      status: 'in_progress',
      startedAt: new Date()
    };

    verification.processingSteps.push(step);

    try {
      // Placeholder for feature extraction
      const extractedFeatures = `features_${Date.now()}`;
      
      // Store extracted features in metadata
      verification.metadata.extractedFeatures = extractedFeatures;

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = 90;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performTemplateMatching(verification: BiometricVerification): Promise<void> {
    const stepId = this.generateId();
    const step: ProcessingStep = {
      id: stepId,
      name: 'Template Matching',
      type: 'matching',
      status: 'in_progress',
      startedAt: new Date()
    };

    verification.processingSteps.push(step);

    try {
      let matchScore = 0;
      
      if (verification.templateId) {
        // Match against specific template
        const template = this.templates.get(verification.templateId);
        if (template) {
          matchScore = await this.calculateMatchScore(
            verification.metadata.extractedFeatures,
            template.template
          );
        }
      } else {
        // Match against user's templates
        const userTemplates = await this.getUserTemplates(verification.userId, verification.type);
        const primaryTemplate = userTemplates.find(t => t.isPrimary) || userTemplates[0];
        
        if (primaryTemplate) {
          matchScore = await this.calculateMatchScore(
            verification.metadata.extractedFeatures,
            primaryTemplate.template
          );
          verification.templateId = primaryTemplate.id;
        }
      }

      verification.matchScore = matchScore;
      verification.matchLevel = this.mapMatchScore(matchScore);

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = matchScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performLivenessDetection(verification: BiometricVerification): Promise<void> {
    const stepId = this.generateId();
    const step: ProcessingStep = {
      id: stepId,
      name: 'Liveness Detection',
      type: 'liveness',
      status: 'in_progress',
      startedAt: new Date()
    };

    verification.processingSteps.push(step);

    try {
      const livenessResults: LivenessResult[] = [];
      let totalScore = 0;

      for (const test of verification.livenessTests) {
        const result = await this.performLivenessTest(test, verification.inputData);
        livenessResults.push(result);
        totalScore += result.confidence;
      }

      verification.livenessResults = livenessResults;
      verification.livenessScore = livenessResults.length > 0 ? totalScore / livenessResults.length : 0;
      verification.livenessDetected = verification.livenessScore >= this.config.minLivenessScore;

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = verification.livenessScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async performAntiSpoofing(verification: BiometricVerification): Promise<void> {
    const stepId = this.generateId();
    const step: ProcessingStep = {
      id: stepId,
      name: 'Anti-Spoofing',
      type: 'anti_spoofing',
      status: 'in_progress',
      startedAt: new Date()
    };

    verification.processingSteps.push(step);

    try {
      // Placeholder for anti-spoofing detection
      const spoofingScore = 85; // Mock score (higher is better)
      
      verification.antiSpoofingScore = spoofingScore;
      verification.spoofingDetected = spoofingScore < (this.config.minAntiSpoofingScore * 100);

      if (verification.spoofingDetected) {
        verification.issues.push({
          type: 'spoofing_detected',
          severity: 'critical',
          description: 'Spoofing attempt detected',
          detectedAt: new Date(),
          autoDetected: true
        });
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.confidence = spoofingScore;

    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      throw error;
    }
  }

  private async calculateFinalResults(verification: BiometricVerification): Promise<void> {
    // Calculate overall confidence
    const completedSteps = verification.processingSteps.filter(s => s.status === 'completed' && s.confidence);
    const averageConfidence = completedSteps.length > 0
      ? completedSteps.reduce((sum, step) => sum + (step.confidence || 0), 0) / completedSteps.length
      : 0;

    verification.confidence = Math.round(averageConfidence);

    // Determine final status
    if (verification.matchScore >= this.config.minMatchScore &&
        verification.confidence >= 70 &&
        (!this.config.enableLivenessDetection || verification.livenessDetected) &&
        (!this.config.enableAntiSpoofing || !verification.spoofingDetected)) {
      verification.verificationStatus = VerificationStatus.APPROVED;
    } else if (verification.matchScore < 50 || verification.issues.some(i => i.severity === 'critical')) {
      verification.verificationStatus = VerificationStatus.REJECTED;
    } else {
      verification.verificationStatus = VerificationStatus.NEEDS_REVIEW;
    }
  }

  // Helper Methods
  private async calculateMatchScore(features1: string, features2: string): Promise<number> {
    // Placeholder for biometric matching algorithm
    // In a real implementation, you would use:
    // - Cosine similarity for face embeddings
    // - Minutiae matching for fingerprints
    // - DTW for voice patterns
    // - Hamming distance for iris codes
    
    return Math.random() * 30 + 70; // Random score between 70-100
  }

  private async performLivenessTest(test: LivenessTest, inputData: any): Promise<LivenessResult> {
    // Placeholder for liveness test execution
    const startTime = Date.now();
    
    // Mock liveness test results
    const result: LivenessResult = {
      test,
      passed: Math.random() > 0.2, // 80% pass rate
      confidence: Math.random() * 30 + 70, // 70-100 confidence
      duration: Date.now() - startTime,
      timestamp: new Date()
    };

    return result;
  }

  private mapMatchScore(score: number): MatchLevel {
    if (score >= 95) return MatchLevel.VERY_HIGH;
    if (score >= 85) return MatchLevel.HIGH;
    if (score >= 70) return MatchLevel.MEDIUM;
    if (score >= 50) return MatchLevel.LOW;
    return MatchLevel.VERY_LOW;
  }

  private calculateChecksum(data: string): string {
    // Simple checksum calculation
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i);
    }
    return sum.toString(16);
  }

  private generateId(): string {
    return `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue Processing
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const batch = this.processingQueue.splice(0, this.config.batchSize);
      
      for (const verificationId of batch) {
        try {
          await this.processVerification(verificationId);
        } catch (error) {
          this.emit('queueProcessingError', { verificationId, error });
        }
      }
    }

    this.isProcessing = false;
  }

  // Retrieval Methods
  async getVerification(verificationId: string): Promise<BiometricVerification | null> {
    return this.verifications.get(verificationId) || null;
  }

  async getUserVerifications(
    userId: string,
    type?: BiometricType,
    status?: VerificationStatus
  ): Promise<BiometricVerification[]> {
    return Array.from(this.verifications.values())
      .filter(v => v.userId === userId)
      .filter(v => !type || v.type === type)
      .filter(v => !status || v.verificationStatus === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Manual Review
  async reviewVerification(
    verificationId: string,
    reviewerId: string,
    action: 'approve' | 'reject' | 'request_resubmit',
    notes?: string
  ): Promise<BiometricVerification> {
    const verification = this.verifications.get(verificationId);
    if (!verification) {
      throw new Error('Verification not found');
    }

    verification.reviewedBy = reviewerId;
    verification.reviewedAt = new Date();
    verification.reviewNotes = notes;

    switch (action) {
      case 'approve':
        verification.verificationStatus = VerificationStatus.APPROVED;
        break;
      case 'reject':
        verification.verificationStatus = VerificationStatus.REJECTED;
        break;
      case 'request_resubmit':
        verification.verificationStatus = VerificationStatus.NEEDS_REVIEW;
        break;
    }

    this.emit('verificationReviewed', { verification, reviewerId, action, notes });
    return verification;
  }

  // Analytics
  async getBiometricAnalytics(
    period: { start: Date; end: Date }
  ): Promise<BiometricAnalytics> {
    const verifications = Array.from(this.verifications.values())
      .filter(v => v.createdAt >= period.start && v.createdAt <= period.end);
    
    const templates = Array.from(this.templates.values())
      .filter(t => t.createdAt >= period.start && t.createdAt <= period.end);

    const totalVerifications = verifications.length;
    const successfulVerifications = verifications.filter(v => v.verificationStatus === VerificationStatus.APPROVED).length;

    // Type distribution
    const verificationsByType: Record<BiometricType, number> = {
      [BiometricType.FACE]: 0,
      [BiometricType.FINGERPRINT]: 0,
      [BiometricType.VOICE]: 0,
      [BiometricType.IRIS]: 0,
      [BiometricType.PALM]: 0,
      [BiometricType.VEIN]: 0,
      [BiometricType.SIGNATURE]: 0,
      [BiometricType.KEYSTROKE]: 0
    };

    for (const verification of verifications) {
      verificationsByType[verification.type]++;
    }

    const successRateByType: Record<BiometricType, number> = {} as Record<BiometricType, number>;
    for (const type of Object.keys(verificationsByType) as BiometricType[]) {
      const typeVerifications = verifications.filter(v => v.type === type);
      const typeSuccesses = typeVerifications.filter(v => v.verificationStatus === VerificationStatus.APPROVED).length;
      successRateByType[type] = typeVerifications.length > 0 ? typeSuccesses / typeVerifications.length : 0;
    }

    const averageMatchScores: Record<BiometricType, number> = {} as Record<BiometricType, number>;
    for (const type of Object.keys(verificationsByType) as BiometricType[]) {
      const typeVerifications = verifications.filter(v => v.type === type);
      const totalScore = typeVerifications.reduce((sum, v) => sum + v.matchScore, 0);
      averageMatchScores[type] = typeVerifications.length > 0 ? totalScore / typeVerifications.length : 0;
    }

    // Template metrics
    const templatesByType: Record<BiometricType, number> = {
      [BiometricType.FACE]: 0,
      [BiometricType.FINGERPRINT]: 0,
      [BiometricType.VOICE]: 0,
      [BiometricType.IRIS]: 0,
      [BiometricType.PALM]: 0,
      [BiometricType.VEIN]: 0,
      [BiometricType.SIGNATURE]: 0,
      [BiometricType.KEYSTROKE]: 0
    };

    for (const template of templates) {
      templatesByType[template.type]++;
    }

    // Liveness metrics
    const livenessDetectionRate = verifications.length > 0
      ? verifications.filter(v => v.livenessDetected).length / verifications.length
      : 0;

    const averageLivenessScores: Record<BiometricType, number> = {} as Record<BiometricType, number>;
    for (const type of Object.keys(verificationsByType) as BiometricType[]) {
      const typeVerifications = verifications.filter(v => v.type === type);
      const totalScore = typeVerifications.reduce((sum, v) => sum + v.livenessScore, 0);
      averageLivenessScores[type] = typeVerifications.length > 0 ? totalScore / typeVerifications.length : 0;
    }

    const livenessTestResults: Record<LivenessTest, { passed: number; failed: number }> = {
      [LivenessTest.BLINK]: { passed: 0, failed: 0 },
      [LivenessTest.SMILE]: { passed: 0, failed: 0 },
      [LivenessTest.HEAD_MOVEMENT]: { passed: 0, failed: 0 },
      [LivenessTest.VOICE_COMMAND]: { passed: 0, failed: 0 },
      [LivenessTest.RANDOM_ACTION]: { passed: 0, failed: 0 }
    };

    for (const verification of verifications) {
      for (const result of verification.livenessResults) {
        if (result.passed) {
          livenessTestResults[result.test].passed++;
        } else {
          livenessTestResults[result.test].failed++;
        }
      }
    }

    // Anti-spoofing metrics
    const spoofingAttempts = verifications.filter(v => v.spoofingDetected).length;
    const spoofingDetectionRate = verifications.length > 0 ? spoofingAttempts / verifications.length : 0;

    const averageAntiSpoofingScores: Record<BiometricType, number> = {} as Record<BiometricType, number>;
    for (const type of Object.keys(verificationsByType) as BiometricType[]) {
      const typeVerifications = verifications.filter(v => v.type === type);
      const totalScore = typeVerifications.reduce((sum, v) => sum + v.antiSpoofingScore, 0);
      averageAntiSpoofingScores[type] = typeVerifications.length > 0 ? totalScore / typeVerifications.length : 0;
    }

    return {
      period,
      totalVerifications,
      verificationsByType,
      templatesCreated: templates.length,
      templatesByType,
      successfulVerifications,
      successRateByType,
      averageMatchScores,
      averageQualityScores: {} as Record<BiometricType, number>, // Would calculate from template qualities
      qualityDistribution: {},
      livenessDetectionRate,
      averageLivenessScores,
      livenessTestResults,
      spoofingAttempts,
      spoofingDetectionRate,
      averageAntiSpoofingScores,
      averageProcessingTime: 0, // Would calculate from processing times
      processingTimeByType: {} as Record<BiometricType, number>,
      errorsByType: {} as Record<BiometricType, number>,
      errorsByCategory: {},
      dailyVerifications: [] // Would aggregate by date
    };
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
        totalTemplates: this.templates.size,
        totalVerifications: this.verifications.size,
        pendingProcessing: this.processingQueue.length,
        isProcessing: this.isProcessing,
        livenessDetectionEnabled: this.config.enableLivenessDetection,
        antiSpoofingEnabled: this.config.enableAntiSpoofing,
        templateEncryptionEnabled: this.config.enableTemplateEncryption
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        templates: Array.from(this.templates.values()),
        verifications: Array.from(this.verifications.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'Template ID', 'User ID', 'Type', 'Quality', 'Is Active', 'Is Primary',
        'Created At', 'Expires At'
      ];
      const rows = Array.from(this.templates.values()).map(t => [
        t.id,
        t.userId,
        t.type,
        t.quality,
        t.isActive,
        t.isPrimary,
        t.createdAt.toISOString(),
        t.expiresAt?.toISOString() || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
