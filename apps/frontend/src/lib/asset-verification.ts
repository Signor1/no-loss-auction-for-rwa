'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types for asset verification
export interface VerificationStatus {
  assetId: string;
  assetTitle: string;
  overallStatus: VerificationLevel;
  kycStatus: VerificationLevel;
  amlStatus: VerificationLevel;
  documentStatus: VerificationLevel;
  legalStatus: VerificationLevel;
  lastUpdated: number;
  verifiedBy?: string;
  verificationDate?: number;
  expiresAt?: number;
}

export interface VerificationDocument {
  id: string;
  assetId: string;
  documentType: DocumentType;
  documentName: string;
  documentUrl: string;
  ipfsHash: string;
  uploadDate: number;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verificationDate?: number;
  rejectionReason?: string;
  fileSize: number;
  mimeType: string;
  description: string;
  isRequired: boolean;
  category: DocumentCategory;
}

export interface VerificationRequirement {
  id: string;
  assetId: string;
  requirementType: RequirementType;
  title: string;
  description: string;
  isRequired: boolean;
  status: RequirementStatus;
  dueDate?: number;
  submittedDocuments: string[];
  verifiedDocuments: string[];
  priority: RequirementPriority;
  category: RequirementCategory;
}

export interface ComplianceBadge {
  id: string;
  badgeType: BadgeType;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeColor: string;
  issuedBy: string;
  issuedDate: number;
  expiresAt?: number;
  verificationLevel: VerificationLevel;
  criteria: string[];
  isPublic: boolean;
}

export interface VerificationHistory {
  id: string;
  assetId: string;
  actionType: VerificationAction;
  actionDescription: string;
  performedBy: string;
  performedDate: number;
  previousStatus?: VerificationLevel;
  newStatus: VerificationLevel;
  documents: string[];
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerificationReport {
  id: string;
  assetId: string;
  reportType: ReportType;
  reportTitle: string;
  reportContent: string;
  generatedDate: number;
  generatedBy: string;
  status: ReportStatus;
  shareableLink?: string;
  expiresAt?: number;
  includeSensitive: boolean;
}

export interface KYCRecord {
  id: string;
  assetId: string;
  ownerAddress: string;
  ownerName: string;
  verificationLevel: VerificationLevel;
  documents: string[];
  lastVerified: number;
  expiresAt?: number;
  riskScore: number;
  riskFactors: string[];
  jurisdictions: string[];
  pepStatus: PEPStatus;
  sanctionsCheck: SanctionsStatus;
}

export interface AMLRecord {
  id: string;
  assetId: string;
  screeningDate: number;
  riskRating: AMLRiskRating;
  screeningResults: ScreeningResult[];
  flaggedTransactions: FlaggedTransaction[];
  lastScreening: number;
  nextScreeningDue: number;
  complianceOfficer: string;
  notes: string;
}

// Enums and Types
export type VerificationLevel = 'unverified' | 'pending' | 'basic' | 'standard' | 'enhanced' | 'premium';
export type DocumentVerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'expired';
export type RequirementType = 'identity' | 'ownership' | 'valuation' | 'legal' | 'compliance' | 'financial';
export type RequirementStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequirementCategory = 'legal' | 'financial' | 'operational' | 'regulatory';
export type DocumentType = 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement' | 'property_deed' | 'valuation_report' | 'insurance_policy' | 'certificate' | 'other';
export type DocumentCategory = 'identity' | 'ownership' | 'financial' | 'legal' | 'technical';
export type BadgeType = 'kyc_verified' | 'aml_compliant' | 'verified_owner' | 'premium_asset' | 'compliant_jurisdiction' | 'risk_assessed';
export type VerificationAction = 'document_uploaded' | 'document_verified' | 'document_rejected' | 'status_changed' | 'badge_issued' | 'kyc_completed' | 'aml_screened' | 'requirement_added';
export type ReportType = 'verification_summary' | 'compliance_report' | 'risk_assessment' | 'audit_trail';
export type ReportStatus = 'generating' | 'ready' | 'expired' | 'failed';
export type PEPStatus = 'not_screened' | 'clear' | 'flagged' | 'under_review';
export type SanctionsStatus = 'not_screened' | 'clear' | 'flagged' | 'under_review';
export type AMLRiskRating = 'low' | 'medium' | 'high' | 'very_high';
export type ScreeningResult = {
  provider: string;
  status: 'clear' | 'flagged' | 'error';
  details: string;
  screenedAt: number;
};
export type FlaggedTransaction = {
  transactionId: string;
  amount: number;
  date: number;
  reason: string;
  status: 'under_review' | 'cleared' | 'suspicious';
};

// Mock data
export const MOCK_VERIFICATION_STATUSES: VerificationStatus[] = [
  {
    assetId: 'asset_1',
    assetTitle: 'Luxury Manhattan Apartment',
    overallStatus: 'enhanced',
    kycStatus: 'enhanced',
    amlStatus: 'standard',
    documentStatus: 'enhanced',
    legalStatus: 'standard',
    lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000,
    verifiedBy: '0x1234...5678',
    verificationDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  },
  {
    assetId: 'asset_2',
    assetTitle: 'Contemporary Art Piece',
    overallStatus: 'standard',
    kycStatus: 'standard',
    amlStatus: 'basic',
    documentStatus: 'standard',
    legalStatus: 'basic',
    lastUpdated: Date.now() - 5 * 24 * 60 * 60 * 1000,
    verifiedBy: '0x2345...6789',
    verificationDate: Date.now() - 14 * 24 * 60 * 60 * 1000
  },
  {
    assetId: 'asset_3',
    assetTitle: 'Gold Bullion Collection',
    overallStatus: 'premium',
    kycStatus: 'premium',
    amlStatus: 'enhanced',
    documentStatus: 'premium',
    legalStatus: 'premium',
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000,
    verifiedBy: '0x3456...7890',
    verificationDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000
  }
];

export const MOCK_VERIFICATION_DOCUMENTS: VerificationDocument[] = [
  {
    id: 'doc_1',
    assetId: 'asset_1',
    documentType: 'property_deed',
    documentName: 'Manhattan Property Deed.pdf',
    documentUrl: '/documents/deed.pdf',
    ipfsHash: 'QmDeedHash123',
    uploadDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    verificationStatus: 'verified',
    verifiedBy: '0x1234...5678',
    verificationDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    fileSize: 2048576,
    mimeType: 'application/pdf',
    description: 'Official property deed showing ownership',
    isRequired: true,
    category: 'legal'
  },
  {
    id: 'doc_2',
    assetId: 'asset_1',
    documentType: 'valuation_report',
    documentName: 'Property Valuation Report.pdf',
    documentUrl: '/documents/valuation.pdf',
    ipfsHash: 'QmValuationHash456',
    uploadDate: Date.now() - 8 * 24 * 60 * 60 * 1000,
    verificationStatus: 'verified',
    verifiedBy: '0x1234...5678',
    verificationDate: Date.now() - 6 * 24 * 60 * 60 * 1000,
    fileSize: 1536000,
    mimeType: 'application/pdf',
    description: 'Professional valuation report from certified appraiser',
    isRequired: true,
    category: 'financial'
  },
  {
    id: 'doc_3',
    assetId: 'asset_2',
    documentType: 'certificate',
    documentName: 'Art Authenticity Certificate.pdf',
    documentUrl: '/documents/certificate.pdf',
    ipfsHash: 'QmCertHash789',
    uploadDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    verificationStatus: 'pending',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    description: 'Certificate of authenticity from art expert',
    isRequired: true,
    category: 'technical'
  }
];

export const MOCK_VERIFICATION_REQUIREMENTS: VerificationRequirement[] = [
  {
    id: 'req_1',
    assetId: 'asset_1',
    requirementType: 'ownership',
    title: 'Property Ownership Proof',
    description: 'Submit official property deed or title document',
    isRequired: true,
    status: 'approved',
    submittedDocuments: ['doc_1'],
    verifiedDocuments: ['doc_1'],
    priority: 'critical',
    category: 'legal'
  },
  {
    id: 'req_2',
    assetId: 'asset_1',
    requirementType: 'valuation',
    title: 'Professional Valuation',
    description: 'Provide valuation report from certified appraiser',
    isRequired: true,
    status: 'approved',
    submittedDocuments: ['doc_2'],
    verifiedDocuments: ['doc_2'],
    priority: 'high',
    category: 'financial'
  },
  {
    id: 'req_3',
    assetId: 'asset_2',
    requirementType: 'legal',
    title: 'Provenance Documentation',
    description: 'Document the history and ownership chain of the artwork',
    isRequired: true,
    status: 'under_review',
    submittedDocuments: ['doc_3'],
    verifiedDocuments: [],
    priority: 'medium',
    category: 'legal'
  }
];

export const MOCK_COMPLIANCE_BADGES: ComplianceBadge[] = [
  {
    id: 'badge_1',
    badgeType: 'kyc_verified',
    badgeName: 'KYC Verified',
    badgeDescription: 'Identity verification completed at enhanced level',
    badgeIcon: '✓',
    badgeColor: '#10B981',
    issuedBy: 'Compliance Team',
    issuedDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    verificationLevel: 'enhanced',
    criteria: ['Identity verified', 'Address confirmed', 'Document authenticated'],
    isPublic: true
  },
  {
    id: 'badge_2',
    badgeType: 'aml_compliant',
    badgeName: 'AML Compliant',
    badgeDescription: 'Anti-money laundering screening passed',
    badgeIcon: '🛡',
    badgeColor: '#3B82F6',
    issuedBy: 'AML Department',
    issuedDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    verificationLevel: 'standard',
    criteria: ['Screening completed', 'No flags detected', 'Risk assessed'],
    isPublic: true
  },
  {
    id: 'badge_3',
    badgeType: 'premium_asset',
    badgeName: 'Premium Asset',
    badgeDescription: 'Highest level of verification and compliance',
    badgeIcon: '⭐',
    badgeColor: '#F59E0B',
    issuedBy: 'Verification Committee',
    issuedDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    verificationLevel: 'premium',
    criteria: ['All documents verified', 'KYC enhanced', 'AML cleared', 'Legal compliance'],
    isPublic: true
  }
];

export const MOCK_VERIFICATION_HISTORY: VerificationHistory[] = [
  {
    id: 'hist_1',
    assetId: 'asset_1',
    actionType: 'document_uploaded',
    actionDescription: 'Property deed uploaded for verification',
    performedBy: '0x1234...5678',
    performedDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    newStatus: 'pending',
    documents: ['doc_1']
  },
  {
    id: 'hist_2',
    assetId: 'asset_1',
    actionType: 'document_verified',
    actionDescription: 'Property deed verified and approved',
    performedBy: '0x8765...4321',
    performedDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    previousStatus: 'pending',
    newStatus: 'enhanced',
    documents: ['doc_1']
  },
  {
    id: 'hist_3',
    assetId: 'asset_2',
    actionType: 'document_uploaded',
    actionDescription: 'Art authenticity certificate submitted',
    performedBy: '0x2345...6789',
    performedDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    newStatus: 'pending',
    documents: ['doc_3']
  }
];

// Main hook for asset verification management
export function useAssetVerification() {
  const { address } = useAccount();
  const [verificationStatuses, setVerificationStatuses] = useState<VerificationStatus[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [badges, setBadges] = useState<ComplianceBadge[]>([]);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load verification data
  const loadVerificationData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationStatuses(MOCK_VERIFICATION_STATUSES);
      setDocuments(MOCK_VERIFICATION_DOCUMENTS);
      setRequirements(MOCK_VERIFICATION_REQUIREMENTS);
      setBadges(MOCK_COMPLIANCE_BADGES);
      setHistory(MOCK_VERIFICATION_HISTORY);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get verification status for an asset
  const getVerificationStatus = (assetId: string): VerificationStatus | null => {
    return verificationStatuses.find(status => status.assetId === assetId) || null;
  };

  // Get documents for an asset
  const getAssetDocuments = (assetId: string): VerificationDocument[] => {
    return documents.filter(doc => doc.assetId === assetId);
  };

  // Get requirements for an asset
  const getAssetRequirements = (assetId: string): VerificationRequirement[] => {
    return requirements.filter(req => req.assetId === assetId);
  };

  // Get badges for an asset
  const getAssetBadges = (assetId: string): ComplianceBadge[] => {
    return badges.filter(badge => {
      const status = getVerificationStatus(assetId);
      return status && badge.verificationLevel === status.overallStatus;
    });
  };

  // Get history for an asset
  const getAssetHistory = (assetId: string): VerificationHistory[] => {
    return history.filter(h => h.assetId === assetId).sort((a, b) => b.performedDate - a.performedDate);
  };

  // Upload document
  const uploadDocument = async (assetId: string, file: File, documentType: DocumentType, description: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const newDocument: VerificationDocument = {
        id: `doc_${Date.now()}`,
        assetId,
        documentType,
        documentName: file.name,
        documentUrl: URL.createObjectURL(file),
        ipfsHash: `QmHash${Date.now()}`,
        uploadDate: Date.now(),
        verificationStatus: 'pending',
        fileSize: file.size,
        mimeType: file.type,
        description,
        isRequired: true,
        category: getDocumentCategory(documentType)
      };

      setDocuments(prev => [newDocument, ...prev]);

      // Add to history
      const historyEntry: VerificationHistory = {
        id: `hist_${Date.now()}`,
        assetId,
        actionType: 'document_uploaded',
        actionDescription: `${file.name} uploaded for verification`,
        performedBy: address || '',
        performedDate: Date.now(),
        newStatus: 'pending',
        documents: [newDocument.id]
      };

      setHistory(prev => [historyEntry, ...prev]);

      return newDocument;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Get document category
  const getDocumentCategory = (type: DocumentType): DocumentCategory => {
    const categoryMap: Record<DocumentType, DocumentCategory> = {
      'passport': 'identity',
      'drivers_license': 'identity',
      'national_id': 'identity',
      'utility_bill': 'identity',
      'bank_statement': 'financial',
      'property_deed': 'legal',
      'valuation_report': 'financial',
      'insurance_policy': 'legal',
      'certificate': 'technical',
      'other': 'legal'
    };
    return categoryMap[type] || 'legal';
  };

  // Calculate verification score
  const getVerificationScore = (assetId: string): number => {
    const status = getVerificationStatus(assetId);
    if (!status) return 0;

    const levelScores: Record<VerificationLevel, number> = {
      'unverified': 0,
      'pending': 25,
      'basic': 50,
      'standard': 75,
      'enhanced': 90,
      'premium': 100
    };

    return levelScores[status.overallStatus] || 0;
  };

  // Get verification level color
  const getVerificationLevelColor = (level: VerificationLevel): string => {
    const colorMap: Record<VerificationLevel, string> = {
      'unverified': '#EF4444',
      'pending': '#F59E0B',
      'basic': '#3B82F6',
      'standard': '#10B981',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B'
    };
    return colorMap[level] || '#6B7280';
  };

  // Get verification level label
  const getVerificationLevelLabel = (level: VerificationLevel): string => {
    const labelMap: Record<VerificationLevel, string> = {
      'unverified': 'Unverified',
      'pending': 'Pending',
      'basic': 'Basic',
      'standard': 'Standard',
      'enhanced': 'Enhanced',
      'premium': 'Premium'
    };
    return labelMap[level] || level;
  };

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (address) {
      loadVerificationData();
    }
  }, [address]);

  return {
    // Data
    verificationStatuses,
    documents,
    requirements,
    badges,
    history,
    selectedAsset,
    isLoading,
    isUploading,
    uploadProgress,

    // Actions
    loadVerificationData,
    getVerificationStatus,
    getAssetDocuments,
    getAssetRequirements,
    getAssetBadges,
    getAssetHistory,
    uploadDocument,
    setSelectedAsset,

    // Utilities
    getVerificationScore,
    getVerificationLevelColor,
    getVerificationLevelLabel,
    formatFileSize,
    formatDate,
    formatDateTime
  };
}
