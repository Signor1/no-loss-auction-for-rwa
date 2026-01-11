import { EventEmitter } from 'events';
import { IPFSIntegrationService } from './ipfsIntegration';

// Enums
export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum VerificationType {
  HASH = 'hash',
  SIGNATURE = 'signature',
  TIMESTAMP = 'timestamp',
  BLOCKCHAIN = 'blockchain',
  MULTI_FACTOR = 'multi_factor'
}

export enum VerificationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  ENTERPRISE = 'enterprise'
}

// Interfaces
export interface VerificationRequest {
  id: string;
  documentId: string;
  documentHash: string;
  verificationType: VerificationType;
  verificationLevel: VerificationLevel;
  requestedBy: string;
  status: VerificationStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  result?: VerificationResult;
  error?: string;
  metadata: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number; // 0-100
  verificationType: VerificationType;
  verifiedAt: Date;
  verifiedBy: string;
  details: {
    hashMatch?: boolean;
    signatureValid?: boolean;
    timestampValid?: boolean;
    blockchainVerified?: boolean;
    factorsVerified?: string[];
  };
  evidence: VerificationEvidence[];
  score: number; // 0-100
  recommendations: string[];
  warnings: string[];
}

export interface VerificationEvidence {
  type: 'hash' | 'signature' | 'timestamp' | 'blockchain' | 'certificate' | 'audit_log';
  value: string;
  timestamp: Date;
  source: string;
  verified: boolean;
  details?: Record<string, any>;
}

export interface VerificationPolicy {
  id: string;
  name: string;
  description: string;
  verificationTypes: VerificationType[];
  verificationLevel: VerificationLevel;
  requiredConfidence: number;
  expirationPeriod: number; // in hours
  autoVerify: boolean;
  conditions: VerificationCondition[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface VerificationCondition {
  type: 'document_type' | 'file_size' | 'content_type' | 'user_role' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  description?: string;
}

export interface VerificationCertificate {
  id: string;
  documentId: string;
  verificationId: string;
  certificateHash: string;
  issuedAt: Date;
  expiresAt: Date;
  issuedBy: string;
  verificationType: VerificationType;
  verificationLevel: VerificationLevel;
  score: number;
  metadata: Record<string, any>;
  signature?: string;
  blockchainTxHash?: string;
}

export interface VerificationStats {
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  pendingVerifications: number;
  expiredVerifications: number;
  averageScore: number;
  verificationsByType: Record<VerificationType, number>;
  verificationsByLevel: Record<VerificationLevel, number>;
  recentActivity: {
    date: Date;
    documentId: string;
    status: VerificationStatus;
    score: number;
  }[];
  topVerifiedDocuments: {
    documentId: string;
    verificationCount: number;
    averageScore: number;
  }[];
}

// Main Document Verification Service
export class DocumentVerificationService extends EventEmitter {
  private ipfsService: IPFSIntegrationService;
  private requests: Map<string, VerificationRequest> = new Map();
  private policies: Map<string, VerificationPolicy> = new Map();
  private certificates: Map<string, VerificationCertificate> = new Map();
  private documentVerifications: Map<string, string[]> = new Map(); // documentId -> verificationIds

  constructor(ipfsService: IPFSIntegrationService) {
    super();
    this.ipfsService = ipfsService;
    this.initializeDefaultPolicies();
  }

  // Verification Request Management
  async createVerificationRequest(
    documentId: string,
    documentHash: string,
    verificationType: VerificationType,
    verificationLevel: VerificationLevel,
    requestedBy: string,
    options: {
      expiresAt?: Date;
      metadata?: Record<string, any>;
      policyId?: string;
    } = {}
  ): Promise<VerificationRequest> {
    // Check if policy applies
    let policy: VerificationPolicy | undefined;
    if (options.policyId) {
      policy = this.policies.get(options.policyId);
    } else {
      policy = await this.getApplicablePolicy(documentId, verificationType, verificationLevel);
    }

    const requestId = this.generateId();
    const request: VerificationRequest = {
      id: requestId,
      documentId,
      documentHash,
      verificationType,
      verificationLevel,
      requestedBy,
      status: VerificationStatus.PENDING,
      createdAt: new Date(),
      expiresAt: options.expiresAt || (policy ? 
        new Date(Date.now() + policy.expirationPeriod * 60 * 60 * 1000) : 
        new Date(Date.now() + 24 * 60 * 60 * 1000)), // Default 24 hours
      metadata: options.metadata || {}
    };

    this.requests.set(requestId, request);

    // Track document verifications
    const verifications = this.documentVerifications.get(documentId) || [];
    verifications.push(requestId);
    this.documentVerifications.set(documentId, verifications);

    // Auto-verify if policy allows
    if (policy?.autoVerify) {
      await this.processVerification(requestId);
    }

    this.emit('verificationRequested', request);
    return request;
  }

  async getVerificationRequest(requestId: string): Promise<VerificationRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async getDocumentVerifications(documentId: string): Promise<VerificationRequest[]> {
    const verificationIds = this.documentVerifications.get(documentId) || [];
    return verificationIds
      .map(id => this.requests.get(id))
      .filter((v): v is VerificationRequest => v !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateVerificationStatus(
    requestId: string,
    status: VerificationStatus,
    updatedBy: string
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

    const oldStatus = request.status;
    request.status = status;

    if (status === VerificationStatus.IN_PROGRESS) {
      request.startedAt = new Date();
    } else if (status === VerificationStatus.VERIFIED || status === VerificationStatus.FAILED) {
      request.completedAt = new Date();
    }

    this.emit('verificationStatusUpdated', {
      requestId,
      oldStatus,
      newStatus: status,
      updatedBy
    });

    return true;
  }

  // Verification Processing
  async processVerification(requestId: string): Promise<VerificationResult> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Verification request not found');
    }

    if (request.status !== VerificationStatus.PENDING) {
      throw new Error('Verification request is not in pending status');
    }

    await this.updateVerificationStatus(requestId, VerificationStatus.IN_PROGRESS, 'system');

    try {
      const result = await this.performVerification(request);
      
      request.result = result;
      request.status = VerificationStatus.VERIFIED;
      request.completedAt = new Date();

      // Generate certificate if verification is successful
      if (result.isValid) {
        await this.generateCertificate(requestId, result);
      }

      this.emit('verificationCompleted', { requestId, result });
      return result;
    } catch (error) {
      request.status = VerificationStatus.FAILED;
      request.error = error instanceof Error ? error.message : 'Unknown error';
      request.completedAt = new Date();

      this.emit('verificationFailed', { requestId, error });
      throw error;
    }
  }

  private async performVerification(request: VerificationRequest): Promise<VerificationResult> {
    const evidence: VerificationEvidence[] = [];
    let score = 0;
    const maxScore = 100;

    // Hash verification
    if (request.verificationType === VerificationType.HASH || 
        request.verificationType === VerificationType.MULTI_FACTOR) {
      const hashEvidence = await this.verifyHash(request);
      evidence.push(hashEvidence);
      if (hashEvidence.verified) score += 25;
    }

    // Signature verification
    if (request.verificationType === VerificationType.SIGNATURE || 
        request.verificationType === VerificationType.MULTI_FACTOR) {
      const signatureEvidence = await this.verifySignature(request);
      evidence.push(signatureEvidence);
      if (signatureEvidence.verified) score += 25;
    }

    // Timestamp verification
    if (request.verificationType === VerificationType.TIMESTAMP || 
        request.verificationType === VerificationType.MULTI_FACTOR) {
      const timestampEvidence = await this.verifyTimestamp(request);
      evidence.push(timestampEvidence);
      if (timestampEvidence.verified) score += 25;
    }

    // Blockchain verification
    if (request.verificationType === VerificationType.BLOCKCHAIN || 
        request.verificationType === VerificationType.MULTI_FACTOR) {
      const blockchainEvidence = await this.verifyBlockchain(request);
      evidence.push(blockchainEvidence);
      if (blockchainEvidence.verified) score += 25;
    }

    const confidence = score;
    const isValid = score >= (this.getRequiredConfidence(request.verificationLevel));

    const result: VerificationResult = {
      isValid,
      confidence,
      verificationType: request.verificationType,
      verifiedAt: new Date(),
      verifiedBy: 'system',
      details: {
        hashMatch: evidence.find(e => e.type === 'hash')?.verified,
        signatureValid: evidence.find(e => e.type === 'signature')?.verified,
        timestampValid: evidence.find(e => e.type === 'timestamp')?.verified,
        blockchainVerified: evidence.find(e => e.type === 'blockchain')?.verified,
        factorsVerified: evidence.filter(e => e.verified).map(e => e.type)
      },
      evidence,
      score,
      recommendations: this.generateRecommendations(isValid, score, evidence),
      warnings: this.generateWarnings(score, evidence)
    };

    return result;
  }

  private async verifyHash(request: VerificationRequest): Promise<VerificationEvidence> {
    // Download document from IPFS
    const documentResult = await this.ipfsService.downloadFile(request.documentHash);
    
    if (!documentResult.success) {
      return {
        type: 'hash',
        value: request.documentHash,
        timestamp: new Date(),
        source: 'ipfs',
        verified: false,
        details: { error: 'Failed to download document from IPFS' }
      };
    }

    // Calculate hash of downloaded content
    const calculatedHash = this.calculateHash(documentResult.data);
    const hashMatch = calculatedHash === request.documentHash;

    return {
      type: 'hash',
      value: calculatedHash,
      timestamp: new Date(),
      source: 'ipfs',
      verified: hashMatch,
      details: {
        expectedHash: request.documentHash,
        calculatedHash,
        match: hashMatch
      }
    };
  }

  private async verifySignature(request: VerificationRequest): Promise<VerificationEvidence> {
    // Placeholder for signature verification
    // In a real implementation, you would:
    // - Extract signature from document metadata
    // - Verify signature using public key
    // - Check certificate chain
    
    return {
      type: 'signature',
      value: 'placeholder_signature',
      timestamp: new Date(),
      source: 'system',
      verified: true, // Placeholder
      details: {
        algorithm: 'RSA-SHA256',
        keyId: 'placeholder_key_id'
      }
    };
  }

  private async verifyTimestamp(request: VerificationRequest): Promise<VerificationEvidence> {
    // Placeholder for timestamp verification
    // In a real implementation, you would:
    // - Extract timestamp from document
    // - Verify with timestamp authority
    // - Check timestamp format and validity
    
    return {
      type: 'timestamp',
      value: request.createdAt.toISOString(),
      timestamp: new Date(),
      source: 'system',
      verified: true, // Placeholder
      details: {
        timestamp: request.createdAt,
        authority: 'placeholder_tsa'
      }
    };
  }

  private async verifyBlockchain(request: VerificationRequest): Promise<VerificationEvidence> {
    // Placeholder for blockchain verification
    // In a real implementation, you would:
    // - Check if document hash is recorded on blockchain
    // - Verify transaction details
    // - Check block confirmations
    
    return {
      type: 'blockchain',
      value: 'placeholder_tx_hash',
      timestamp: new Date(),
      source: 'blockchain',
      verified: true, // Placeholder
      details: {
        transactionHash: 'placeholder_tx_hash',
        blockNumber: 12345,
        confirmations: 100
      }
    };
  }

  // Certificate Management
  async generateCertificate(
    requestId: string,
    result: VerificationResult
  ): Promise<VerificationCertificate> {
    const request = this.requests.get(requestId);
    if (!request || !result.isValid) {
      throw new Error('Invalid request or verification result');
    }

    const certificateId = this.generateId();
    const certificateHash = this.calculateCertificateHash(requestId, result);

    const certificate: VerificationCertificate = {
      id: certificateId,
      documentId: request.documentId,
      verificationId: requestId,
      certificateHash,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      issuedBy: 'system',
      verificationType: request.verificationType,
      verificationLevel: request.verificationLevel,
      score: result.score,
      metadata: {
        evidence: result.evidence,
        recommendations: result.recommendations,
        warnings: result.warnings
      }
    };

    // Store certificate on IPFS
    const certificateData = Buffer.from(JSON.stringify(certificate));
    const ipfsResult = await this.ipfsService.uploadFile(
      certificateData,
      `certificate_${certificateId}.json`
    );

    if (ipfsResult.success) {
      certificate.blockchainTxHash = await this.recordCertificateOnBlockchain(certificateHash);
    }

    this.certificates.set(certificateId, certificate);
    this.emit('certificateGenerated', certificate);
    return certificate;
  }

  async getCertificate(certificateId: string): Promise<VerificationCertificate | null> {
    return this.certificates.get(certificateId) || null;
  }

  async getDocumentCertificates(documentId: string): Promise<VerificationCertificate[]> {
    return Array.from(this.certificates.values())
      .filter(cert => cert.documentId === documentId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  async verifyCertificate(certificateId: string): Promise<boolean> {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) return false;

    // Check if certificate is expired
    if (certificate.expiresAt < new Date()) {
      return false;
    }

    // Verify certificate hash
    const expectedHash = certificate.certificateHash;
    const calculatedHash = this.calculateCertificateHash(certificate.verificationId, {
      isValid: true,
      confidence: 100,
      verificationType: certificate.verificationType,
      verifiedAt: certificate.issuedAt,
      verifiedBy: certificate.issuedBy,
      details: {},
      evidence: certificate.metadata.evidence || [],
      score: certificate.score,
      recommendations: certificate.metadata.recommendations || [],
      warnings: certificate.metadata.warnings || []
    });

    return expectedHash === calculatedHash;
  }

  // Policy Management
  async createPolicy(policy: Omit<VerificationPolicy, 'id' | 'createdAt' | 'isActive'>): Promise<VerificationPolicy> {
    const newPolicy: VerificationPolicy = {
      ...policy,
      id: this.generateId(),
      createdAt: new Date(),
      isActive: true
    };

    this.policies.set(newPolicy.id, newPolicy);
    this.emit('policyCreated', newPolicy);
    return newPolicy;
  }

  async getPolicy(policyId: string): Promise<VerificationPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async getPolicies(): Promise<VerificationPolicy[]> {
    return Array.from(this.policies.values()).filter(policy => policy.isActive);
  }

  async updatePolicy(
    policyId: string,
    updates: Partial<Pick<VerificationPolicy, 'name' | 'description' | 'verificationTypes' | 'verificationLevel' | 'requiredConfidence' | 'expirationPeriod' | 'autoVerify' | 'conditions' | 'isActive'>>,
    updatedBy: string
  ): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    Object.assign(policy, updates);
    this.emit('policyUpdated', { policyId, updates, updatedBy });
    return true;
  }

  async deletePolicy(policyId: string, deletedBy: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    policy.isActive = false;
    this.emit('policyDeleted', { policyId, deletedBy });
    return true;
  }

  private async getApplicablePolicy(
    documentId: string,
    verificationType: VerificationType,
    verificationLevel: VerificationLevel
  ): Promise<VerificationPolicy | undefined> {
    const policies = await this.getPolicies();
    
    return policies.find(policy =>
      policy.verificationTypes.includes(verificationType) &&
      policy.verificationLevel === verificationLevel &&
      this.evaluatePolicyConditions(policy.conditions, documentId)
    );
  }

  private evaluatePolicyConditions(
    conditions: VerificationCondition[],
    documentId: string
  ): boolean {
    // Placeholder for condition evaluation
    // In a real implementation, you would:
    // - Get document metadata
    // - Evaluate each condition against the document
    // - Return true only if all conditions are met
    
    return conditions.length === 0; // Default to true if no conditions
  }

  // Statistics and Analytics
  async getStats(): Promise<VerificationStats> {
    const requests = Array.from(this.requests.values());
    const recentActivity: VerificationStats['recentActivity'] = [];

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const request of requests) {
      if (request.createdAt >= sevenDaysAgo) {
        recentActivity.push({
          date: request.createdAt,
          documentId: request.documentId,
          status: request.status,
          score: request.result?.score || 0
        });
      }
    }

    const verificationsByType: Record<VerificationType, number> = {
      [VerificationType.HASH]: 0,
      [VerificationType.SIGNATURE]: 0,
      [VerificationType.TIMESTAMP]: 0,
      [VerificationType.BLOCKCHAIN]: 0,
      [VerificationType.MULTI_FACTOR]: 0
    };

    const verificationsByLevel: Record<VerificationLevel, number> = {
      [VerificationLevel.BASIC]: 0,
      [VerificationLevel.STANDARD]: 0,
      [VerificationLevel.ENHANCED]: 0,
      [VerificationLevel.ENTERPRISE]: 0
    };

    for (const request of requests) {
      verificationsByType[request.verificationType]++;
      verificationsByLevel[request.verificationLevel]++;
    }

    // Calculate top verified documents
    const documentCounts = new Map<string, { count: number; totalScore: number }>();
    for (const request of requests) {
      if (request.result) {
        const current = documentCounts.get(request.documentId) || { count: 0, totalScore: 0 };
        current.count++;
        current.totalScore += request.result.score;
        documentCounts.set(request.documentId, current);
      }
    }

    const topVerifiedDocuments = Array.from(documentCounts.entries())
      .map(([documentId, data]) => ({
        documentId,
        verificationCount: data.count,
        averageScore: data.totalScore / data.count
      }))
      .sort((a, b) => b.verificationCount - a.verificationCount)
      .slice(0, 10);

    const successfulVerifications = requests.filter(r => r.status === VerificationStatus.VERIFIED).length;
    const averageScore = successfulVerifications > 0
      ? requests.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successfulVerifications
      : 0;

    return {
      totalVerifications: requests.length,
      successfulVerifications,
      failedVerifications: requests.filter(r => r.status === VerificationStatus.FAILED).length,
      pendingVerifications: requests.filter(r => r.status === VerificationStatus.PENDING).length,
      expiredVerifications: requests.filter(r => r.status === VerificationStatus.EXPIRED).length,
      averageScore,
      verificationsByType,
      verificationsByLevel,
      recentActivity: recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime()),
      topVerifiedDocuments
    };
  }

  // Utility Methods
  private calculateHash(content: Buffer): string {
    // Simple hash calculation (placeholder for proper hash function)
    return content.toString('base64').substring(0, 32);
  }

  private calculateCertificateHash(verificationId: string, result: VerificationResult): string {
    const data = `${verificationId}${result.verifiedAt.toISOString()}${result.score}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  private async recordCertificateOnBlockchain(certificateHash: string): Promise<string> {
    // Placeholder for blockchain recording
    // In a real implementation, you would:
    // - Create transaction on blockchain
    // - Record certificate hash
    // - Return transaction hash
    
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  private getRequiredConfidence(level: VerificationLevel): number {
    const confidenceMap: Record<VerificationLevel, number> = {
      [VerificationLevel.BASIC]: 50,
      [VerificationLevel.STANDARD]: 70,
      [VerificationLevel.ENHANCED]: 85,
      [VerificationLevel.ENTERPRISE]: 95
    };
    return confidenceMap[level];
  }

  private generateRecommendations(isValid: boolean, score: number, evidence: VerificationEvidence[]): string[] {
    const recommendations: string[] = [];

    if (!isValid) {
      recommendations.push('Document verification failed. Review all evidence.');
    }

    if (score < 70) {
      recommendations.push('Consider additional verification methods for higher confidence.');
    }

    const failedEvidence = evidence.filter(e => !e.verified);
    if (failedEvidence.length > 0) {
      recommendations.push(`Failed verifications: ${failedEvidence.map(e => e.type).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Document successfully verified with high confidence.');
    }

    return recommendations;
  }

  private generateWarnings(score: number, evidence: VerificationEvidence[]): string[] {
    const warnings: string[] = [];

    if (score < 50) {
      warnings.push('Low verification score. Document integrity may be compromised.');
    }

    if (evidence.some(e => e.type === 'signature' && !e.verified)) {
      warnings.push('Digital signature verification failed.');
    }

    if (evidence.some(e => e.type === 'timestamp' && !e.verified)) {
      warnings.push('Timestamp verification failed. Document may be backdated.');
    }

    return warnings;
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: Omit<VerificationPolicy, 'id' | 'createdAt' | 'isActive'>[] = [
      {
        name: 'Basic Document Verification',
        description: 'Basic hash verification for standard documents',
        verificationTypes: [VerificationType.HASH],
        verificationLevel: VerificationLevel.BASIC,
        requiredConfidence: 50,
        expirationPeriod: 24,
        autoVerify: true,
        conditions: [],
        createdBy: 'system'
      },
      {
        name: 'Standard Document Verification',
        description: 'Hash and signature verification for important documents',
        verificationTypes: [VerificationType.HASH, VerificationType.SIGNATURE],
        verificationLevel: VerificationLevel.STANDARD,
        requiredConfidence: 70,
        expirationPeriod: 48,
        autoVerify: true,
        conditions: [],
        createdBy: 'system'
      },
      {
        name: 'Enhanced Document Verification',
        description: 'Multi-factor verification with blockchain recording',
        verificationTypes: [VerificationType.MULTI_FACTOR],
        verificationLevel: VerificationLevel.ENHANCED,
        requiredConfidence: 85,
        expirationPeriod: 72,
        autoVerify: false,
        conditions: [],
        createdBy: 'system'
      }
    ];

    for (const policy of defaultPolicies) {
      const policyEntity: VerificationPolicy = {
        ...policy,
        id: `policy_${policy.name.toLowerCase().replace(/\s+/g, '_')}`,
        createdAt: new Date(),
        isActive: true
      };
      this.policies.set(policyEntity.id, policyEntity);
    }
  }

  private generateId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getStats();
    const successRate = stats.totalVerifications > 0 
      ? stats.successfulVerifications / stats.totalVerifications 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (successRate < 0.5) {
      status = 'unhealthy';
    } else if (successRate < 0.8) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalVerifications: stats.totalVerifications,
        successRate: Math.round(successRate * 100),
        averageScore: Math.round(stats.averageScore),
        pendingVerifications: stats.pendingVerifications,
        activePolicies: this.policies.size,
        certificatesIssued: this.certificates.size
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        requests: Array.from(this.requests.values()),
        policies: Array.from(this.policies.values()),
        certificates: Array.from(this.certificates.values())
      }, null, 2);
    } else {
      // CSV export for verification requests
      const headers = [
        'ID', 'Document ID', 'Document Hash', 'Verification Type', 'Verification Level',
        'Requested By', 'Status', 'Created At', 'Completed At', 'Score'
      ];
      
      const rows = Array.from(this.requests.values()).map(r => [
        r.id,
        r.documentId,
        r.documentHash,
        r.verificationType,
        r.verificationLevel,
        r.requestedBy,
        r.status,
        r.createdAt.toISOString(),
        r.completedAt?.toISOString() || '',
        r.result?.score || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
