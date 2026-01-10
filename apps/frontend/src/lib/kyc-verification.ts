'use client';

import { useState, useEffect } from 'react';

export interface KYCVerification {
  id: string;
  userId: string;
  status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  complianceLevel: 'basic' | 'standard' | 'enhanced' | 'premium';
  submittedAt: number;
  reviewedAt?: number;
  expiresAt?: number;
  documents: KYCDocument[];
  verificationSteps: VerificationStep[];
  personalInfo: PersonalInfo;
  addressInfo: AddressInfo;
  selfieVerification?: SelfieData;
  riskAssessment: RiskAssessment;
  complianceChecks: ComplianceCheck[];
  rejectionReason?: string;
  nextReviewDate?: number;
}

export interface KYCDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  ipfsHash: string;
  uploadedAt: number;
  status: DocumentStatus;
  verifiedAt?: number;
  expiresAt?: number;
  rejectionReason?: string;
  fileSize: number;
  mimeType: string;
  metadata: DocumentMetadata;
}

export interface VerificationStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  required: boolean;
  completedAt?: number;
  documents: string[];
  order: number;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  taxIdNumber?: string;
  occupation?: string;
  sourceOfFunds?: string;
  politicalExposure: 'none' | 'domestic' | 'foreign';
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  proofDocumentId?: string;
  isMailingAddress: boolean;
}

export interface SelfieData {
  url: string;
  ipfsHash: string;
  uploadedAt: number;
  verifiedAt?: number;
  matchScore?: number;
  livenessCheck: boolean;
  status: 'pending' | 'verified' | 'rejected';
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  lastUpdated: number;
}

export interface ComplianceCheck {
  type: string;
  status: 'pending' | 'passed' | 'failed';
  checkedAt: number;
  details?: string;
}

export type DocumentType = 
  | 'government_id'
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'proof_of_address'
  | 'utility_bill'
  | 'bank_statement'
  | 'tax_return'
  | 'selfie'
  | 'liveness_video';

export type DocumentStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface DocumentMetadata {
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  documentType?: string;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
}

export interface VerificationRequirements {
  requiredDocuments: DocumentType[];
  requiredSteps: VerificationStep[];
  complianceLevel: string;
  jurisdiction: string;
  processingTime: string;
  fees: VerificationFees;
}

export interface VerificationFees {
  verification: number;
  expeditedProcessing?: number;
  documentVerification?: number;
  currency: string;
}

export interface ComplianceLevel {
  level: string;
  benefits: string[];
  requirements: string[];
  limits: {
    transactionLimit: number;
    annualLimit: number;
    withdrawalLimit: number;
  };
  features: string[];
}

export const MOCK_KYC_VERIFICATION: KYCVerification = {
  id: 'kyc_1',
  userId: 'user_1',
  status: 'in_review',
  complianceLevel: 'enhanced',
  submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  documents: [
    {
      id: 'doc_1',
      type: 'passport',
      name: 'passport.jpg',
      url: '/documents/passport.jpg',
      ipfsHash: 'QmHash123',
      uploadedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      status: 'verified',
      verifiedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      fileSize: 2048576,
      mimeType: 'image/jpeg',
      metadata: {
        documentNumber: 'A12345678',
        issuingCountry: 'US',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        issuingAuthority: 'Department of State'
      }
    }
  ],
  verificationSteps: [
    {
      id: 'step_1',
      name: 'Personal Information',
      description: 'Provide your personal details',
      status: 'completed',
      required: true,
      completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      documents: [],
      order: 1
    },
    {
      id: 'step_2',
      name: 'Identity Verification',
      description: 'Upload government-issued ID',
      status: 'completed',
      required: true,
      completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      documents: ['doc_1'],
      order: 2
    },
    {
      id: 'step_3',
      name: 'Address Verification',
      description: 'Upload proof of address',
      status: 'in_progress',
      required: true,
      documents: [],
      order: 3
    },
    {
      id: 'step_4',
      name: 'Selfie Verification',
      description: 'Take a selfie for liveness check',
      status: 'not_started',
      required: true,
      documents: [],
      order: 4
    }
  ],
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    nationality: 'US',
    taxIdNumber: '123-45-6789',
    occupation: 'Software Engineer',
    sourceOfFunds: 'Employment',
    politicalExposure: 'none'
  },
  addressInfo: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    isMailingAddress: true
  },
  riskAssessment: {
    score: 25,
    level: 'low',
    factors: [
      {
        type: 'employment_verification',
        severity: 'low',
        description: 'Stable employment verified',
        impact: -10
      }
    ],
    lastUpdated: Date.now() - 1 * 60 * 60 * 1000
  },
  complianceChecks: [
    {
      type: 'sanctions_check',
      status: 'passed',
      checkedAt: Date.now() - 1 * 60 * 60 * 1000
    },
    {
      type: 'pep_check',
      status: 'passed',
      checkedAt: Date.now() - 1 * 60 * 60 * 1000
    }
  ]
};

export function useKYCVerification() {
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadVerification = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerification(MOCK_KYC_VERIFICATION);
    } catch (error) {
      console.error('Error loading verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File, documentType: DocumentType) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const newDocument: KYCDocument = {
        id: `doc_${Date.now()}`,
        type: documentType,
        name: file.name,
        url: URL.createObjectURL(file),
        ipfsHash: `QmHash${Date.now()}`,
        uploadedAt: Date.now(),
        status: 'pending',
        fileSize: file.size,
        mimeType: file.type,
        metadata: {}
      };

      setVerification(prev => prev ? {
        ...prev,
        documents: [...prev.documents, newDocument]
      } : null);

      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const submitVerification = async () => {
    if (!verification) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerification(prev => prev ? {
        ...prev,
        status: 'pending',
        submittedAt: Date.now()
      } : null);
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadVerification();
  }, []);

  return {
    verification,
    isLoading,
    isUploading,
    uploadProgress,
    loadVerification,
    uploadDocument,
    submitVerification
  };
}
