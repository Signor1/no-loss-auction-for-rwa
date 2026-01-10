'use client';

import { useState, useEffect } from 'react';

export interface ComplianceDashboard {
  userId: string;
  overallStatus: 'compliant' | 'non_compliant' | 'pending' | 'restricted';
  complianceLevel: 'basic' | 'standard' | 'enhanced' | 'premium';
  lastUpdated: number;
  nextReviewDate: number;
  requiredActions: ComplianceAction[];
  documents: ComplianceDocument[];
  regulatoryInfo: RegulatoryInfo;
  jurisdictionRequirements: JurisdictionRequirement[];
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: ComplianceAlert[];
  auditTrail: AuditEntry[];
}

export interface ComplianceAction {
  id: string;
  type: 'document_upload' | 'information_update' | 'verification_required' | 'payment_required' | 'review_required' | 'reporting_required';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  category: 'kyc' | 'aml' | 'tax' | 'licensing' | 'reporting';
  estimatedTime: string;
  requiredDocuments?: string[];
  actionUrl?: string;
  completedAt?: number;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  type: ComplianceDocumentType;
  status: DocumentStatus;
  uploadedAt: number;
  expiresAt?: number;
  lastReviewed: number;
  nextReview: number;
  jurisdiction: string;
  complianceCategory: string;
  fileSize: number;
  url: string;
  metadata: DocumentMetadata;
  reviewHistory: DocumentReview[];
}

export interface RegulatoryInfo {
  applicableRegulations: Regulation[];
  licensingRequirements: LicensingRequirement[];
  reportingObligations: ReportingObligation[];
  taxObligations: TaxObligation[];
  amlRequirements: AMLRequirement[];
  dataProtectionRequirements: DataProtectionRequirement[];
}

export interface Regulation {
  id: string;
  name: string;
  jurisdiction: string;
  category: 'kyc' | 'aml' | 'tax' | 'data_protection' | 'securities' | 'banking';
  description: string;
  requirements: string[];
  lastUpdated: number;
  complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface LicensingRequirement {
  id: string;
  licenseType: string;
  jurisdiction: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  issuedDate: number;
  expiryDate: number;
  issuingAuthority: string;
  licenseNumber: string;
  conditions: string[];
  renewalRequired: boolean;
  renewalWindow: number;
}

export interface ReportingObligation {
  id: string;
  type: 'sar' | 'ctr' | 'annual' | 'quarterly' | 'suspicious_activity' | 'large_transaction';
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'event_based';
  dueDate: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  description: string;
  threshold?: number;
  lastSubmitted?: number;
  nextDue: number;
}

export interface TaxObligation {
  id: string;
  taxType: 'income' | 'capital_gains' | 'vat' | 'withholding' | 'property' | 'corporate';
  jurisdiction: string;
  filingFrequency: 'monthly' | 'quarterly' | 'annually';
  nextFilingDate: number;
  lastFilingDate?: number;
  status: 'compliant' | 'pending' | 'overdue';
  estimatedAmount?: number;
  paidAmount?: number;
}

export interface AMLRequirement {
  id: string;
  type: 'customer_due_diligence' | 'enhanced_due_diligence' | 'transaction_monitoring' | 'sanctions_screening' | 'pep_screening';
  description: string;
  frequency: 'continuous' | 'monthly' | 'quarterly' | 'annually';
  lastCompleted: number;
  nextDue: number;
  status: 'compliant' | 'pending' | 'overdue';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DataProtectionRequirement {
  id: string;
  regulation: 'gdpr' | 'ccpa' | 'pdpa' | 'pipeda';
  jurisdiction: string;
  description: string;
  requirements: string[];
  complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
  lastAudit: number;
  nextAudit: number;
}

export interface JurisdictionRequirement {
  jurisdiction: string;
  region: string;
  requirements: JurisdictionSpecificRequirement[];
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: number;
  complianceScore: number;
}

export interface JurisdictionSpecificRequirement {
  type: 'licensing' | 'reporting' | 'tax' | 'data_protection' | 'capital_requirements';
  description: string;
  mandatory: boolean;
  dueDate?: number;
  status: 'compliant' | 'pending' | 'non_compliant';
  details?: string;
}

export interface ComplianceAlert {
  id: string;
  type: 'expiring_document' | 'overdue_action' | 'compliance_breach' | 'regulatory_change' | 'audit_required' | 'reporting_required';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  createdAt: number;
  acknowledged: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  expiresAt?: number;
  category: 'documents' | 'actions' | 'regulatory' | 'system' | 'reporting';
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  category: 'document_upload' | 'verification' | 'compliance_check' | 'reporting' | 'system_access';
  userId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DocumentMetadata {
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  documentType?: string;
  version?: string;
  effectiveDate?: string;
  reviewDate?: string;
  licenseNumber?: string;
  conditions?: string[];
}

export interface DocumentReview {
  reviewedAt: number;
  reviewedBy: string;
  status: 'approved' | 'rejected' | 'requires_action';
  comments: string;
  nextReview: number;
}

export type ComplianceDocumentType = 
  | 'business_license'
  | 'financial_statement'
  | 'tax_return'
  | 'aml_policy'
  | 'kyc_policy'
  | 'privacy_policy'
  | 'terms_of_service'
  | 'risk_assessment'
  | 'audit_report'
  | 'regulatory_filing'
  | 'insurance_certificate'
  | 'capital_proof'
  | 'director_declaration';

export type DocumentStatus = 'active' | 'expired' | 'pending' | 'rejected' | 'requires_review';

export const MOCK_COMPLIANCE_DASHBOARD: ComplianceDashboard = {
  userId: 'user_1',
  overallStatus: 'compliant',
  complianceLevel: 'enhanced',
  lastUpdated: Date.now() - 2 * 60 * 60 * 1000,
  nextReviewDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  complianceScore: 85,
  riskLevel: 'low',
  requiredActions: [
    {
      id: 'action_1',
      type: 'document_upload',
      title: 'Update Business License',
      description: 'Your business license expires in 30 days. Please upload the renewed license.',
      priority: 'high',
      dueDate: Date.now() + 25 * 24 * 60 * 60 * 1000,
      status: 'pending',
      category: 'licensing',
      estimatedTime: '15 minutes',
      requiredDocuments: ['business_license'],
      actionUrl: '/compliance/documents/upload'
    },
    {
      id: 'action_2',
      type: 'information_update',
      title: 'Update Beneficial Ownership',
      description: 'Annual beneficial ownership information update required.',
      priority: 'medium',
      dueDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
      status: 'pending',
      category: 'kyc',
      estimatedTime: '30 minutes',
      actionUrl: '/compliance/beneficial-ownership'
    },
    {
      id: 'action_3',
      type: 'reporting_required',
      title: 'Submit Quarterly AML Report',
      description: 'Quarterly anti-money laundering report due for submission.',
      priority: 'medium',
      dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
      status: 'in_progress',
      category: 'aml',
      estimatedTime: '45 minutes',
      actionUrl: '/compliance/reports/aml'
    }
  ],
  documents: [
    {
      id: 'doc_1',
      name: 'Business License 2024',
      type: 'business_license',
      status: 'active',
      uploadedAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      lastReviewed: Date.now() - 7 * 24 * 60 * 60 * 1000,
      nextReview: Date.now() + 23 * 24 * 60 * 60 * 1000,
      jurisdiction: 'US',
      complianceCategory: 'licensing',
      fileSize: 2048576,
      url: '/documents/business-license.pdf',
      metadata: {
        documentNumber: 'BL-2024-001',
        issuingCountry: 'US',
        issueDate: '2024-01-01',
        expiryDate: '2025-01-01',
        issuingAuthority: 'Department of Business'
      },
      reviewHistory: [
        {
          reviewedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          reviewedBy: 'compliance_officer_1',
          status: 'approved',
          comments: 'License verified and active',
          nextReview: Date.now() + 23 * 24 * 60 * 60 * 1000
        }
      ]
    },
    {
      id: 'doc_2',
      name: 'AML Policy Document',
      type: 'aml_policy',
      status: 'active',
      uploadedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      lastReviewed: Date.now() - 30 * 24 * 60 * 60 * 1000,
      nextReview: Date.now() + 150 * 24 * 60 * 60 * 1000,
      jurisdiction: 'US',
      complianceCategory: 'aml',
      fileSize: 1024576,
      url: '/documents/aml-policy.pdf',
      metadata: {
        version: '2.1',
        effectiveDate: '2024-01-01',
        reviewDate: '2024-12-31'
      },
      reviewHistory: [
        {
          reviewedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          reviewedBy: 'compliance_officer_1',
          status: 'approved',
          comments: 'Policy compliant with current regulations',
          nextReview: Date.now() + 150 * 24 * 60 * 60 * 1000
        }
      ]
    }
  ],
  regulatoryInfo: {
    applicableRegulations: [
      {
        id: 'reg_1',
        name: 'Bank Secrecy Act (BSA)',
        jurisdiction: 'US',
        category: 'aml',
        description: 'Anti-money laundering and counter-terrorism financing regulations',
        requirements: [
          'Customer Identification Program (CIP)',
          'Customer Due Diligence (CDD)',
          'Suspicious Activity Reporting (SAR)',
          'Currency Transaction Reporting (CTR)'
        ],
        lastUpdated: Date.now() - 60 * 24 * 60 * 60 * 1000,
        complianceStatus: 'compliant',
        riskLevel: 'medium'
      },
      {
        id: 'reg_2',
        name: 'General Data Protection Regulation (GDPR)',
        jurisdiction: 'EU',
        category: 'data_protection',
        description: 'Data protection and privacy regulations for EU citizens',
        requirements: [
          'Data processing consent',
          'Data subject rights',
          'Breach notification',
          'Data protection impact assessment'
        ],
        lastUpdated: Date.now() - 30 * 24 * 60 * 60 * 1000,
        complianceStatus: 'compliant',
        riskLevel: 'low'
      }
    ],
    licensingRequirements: [
      {
        id: 'license_1',
        licenseType: 'Money Transmitter License',
        jurisdiction: 'US',
        status: 'active',
        issuedDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
        expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        issuingAuthority: 'FinCEN',
        licenseNumber: 'MTL-2024-001',
        conditions: [
          'Maintain minimum capital requirements',
          'Submit annual reports',
          'Implement AML program',
          'Conduct regular audits'
        ],
        renewalRequired: true,
        renewalWindow: 90
      }
    ],
    reportingObligations: [
      {
        id: 'report_1',
        type: 'sar',
        name: 'Suspicious Activity Report',
        frequency: 'event_based',
        dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
        status: 'pending',
        description: 'Report suspicious transactions to FinCEN',
        threshold: 10000,
        nextDue: Date.now() + 10 * 24 * 60 * 60 * 1000
      },
      {
        id: 'report_2',
        type: 'annual',
        name: 'Annual Compliance Report',
        frequency: 'annually',
        dueDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        status: 'pending',
        description: 'Submit annual compliance and financial reports',
        nextDue: Date.now() + 90 * 24 * 60 * 60 * 1000
      }
    ],
    taxObligations: [
      {
        id: 'tax_1',
        taxType: 'income',
        jurisdiction: 'US',
        filingFrequency: 'annually',
        nextFilingDate: Date.now() + 120 * 24 * 60 * 60 * 1000,
        lastFilingDate: Date.now() - 245 * 24 * 60 * 60 * 1000,
        status: 'compliant',
        estimatedAmount: 50000,
        paidAmount: 45000
      }
    ],
    amlRequirements: [
      {
        id: 'aml_1',
        type: 'customer_due_diligence',
        description: 'Perform customer due diligence for all new customers',
        frequency: 'continuous',
        lastCompleted: Date.now() - 1 * 24 * 60 * 60 * 1000,
        nextDue: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: 'compliant',
        riskLevel: 'medium'
      },
      {
        id: 'aml_2',
        type: 'sanctions_screening',
        description: 'Screen customers against sanctions lists',
        frequency: 'continuous',
        lastCompleted: Date.now() - 12 * 60 * 60 * 1000,
        nextDue: Date.now() + 12 * 60 * 60 * 1000,
        status: 'compliant',
        riskLevel: 'high'
      }
    ],
    dataProtectionRequirements: [
      {
        id: 'dp_1',
        regulation: 'gdpr',
        jurisdiction: 'EU',
        description: 'GDPR compliance for EU user data',
        requirements: [
          'Data processing records',
          'Privacy policy',
          'Cookie consent',
          'Data breach procedures'
        ],
        complianceStatus: 'compliant',
        lastAudit: Date.now() - 90 * 24 * 60 * 60 * 1000,
        nextAudit: Date.now() + 275 * 24 * 60 * 60 * 1000
      }
    ]
  },
  jurisdictionRequirements: [
    {
      jurisdiction: 'US',
      region: 'North America',
      requirements: [
        {
          type: 'licensing',
          description: 'Money Transmitter License required',
          mandatory: true,
          status: 'compliant',
          details: 'Active MTL license with FinCEN'
        },
        {
          type: 'reporting',
          description: 'Annual financial reporting required',
          mandatory: true,
          status: 'compliant',
          details: 'Annual reports submitted on time'
        }
      ],
      riskLevel: 'medium',
      lastUpdated: Date.now() - 30 * 24 * 60 * 60 * 1000,
      complianceScore: 90
    },
    {
      jurisdiction: 'EU',
      region: 'Europe',
      requirements: [
        {
          type: 'data_protection',
          description: 'GDPR compliance required',
          mandatory: true,
          status: 'compliant',
          details: 'Full GDPR compliance implemented'
        }
      ],
      riskLevel: 'low',
      lastUpdated: Date.now() - 60 * 24 * 60 * 60 * 1000,
      complianceScore: 95
    }
  ],
  alerts: [
    {
      id: 'alert_1',
      type: 'expiring_document',
      severity: 'warning',
      title: 'Business License Expiring Soon',
      message: 'Your business license expires in 30 days. Please renew to maintain compliance.',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      acknowledged: false,
      actionRequired: true,
      actionUrl: '/compliance/documents/business-license',
      category: 'documents',
      expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000
    },
    {
      id: 'alert_2',
      type: 'reporting_required',
      severity: 'info',
      title: 'Quarterly Report Due',
      message: 'Quarterly AML report is due for submission.',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      acknowledged: false,
      actionRequired: true,
      actionUrl: '/compliance/reports/quarterly',
      category: 'reporting',
      expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000
    }
  ],
  auditTrail: [
    {
      id: 'audit_1',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      action: 'Document Upload',
      category: 'document_upload',
      userId: 'user_1',
      details: 'Uploaded AML policy document',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      status: 'success',
      riskLevel: 'low'
    },
    {
      id: 'audit_2',
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      action: 'Compliance Check',
      category: 'compliance_check',
      userId: 'system',
      details: 'Automated sanctions screening completed',
      ipAddress: 'system',
      userAgent: 'compliance-bot',
      status: 'success',
      riskLevel: 'medium'
    }
  ]
};

export function useComplianceDashboard() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [documentExpiryAlerts, setDocumentExpiryAlerts] = useState<ComplianceAlert[]>([]);
  const [complianceTrends, setComplianceTrends] = useState<ComplianceTrend[]>([]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboard(MOCK_COMPLIANCE_DASHBOARD);
      
      // Generate document expiry alerts
      const expiryAlerts = generateDocumentExpiryAlerts(MOCK_COMPLIANCE_DASHBOARD.documents);
      setDocumentExpiryAlerts(expiryAlerts);
      
      // Generate compliance trends
      const trends = generateComplianceTrends();
      setComplianceTrends(trends);
    } catch (error) {
      console.error('Error loading compliance dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!dashboard) return;
    
    try {
      setDashboard(prev => prev ? {
        ...prev,
        alerts: prev.alerts.map(alert =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      } : null);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const completeAction = async (actionId: string) => {
    if (!dashboard) return;
    
    try {
      setDashboard(prev => prev ? {
        ...prev,
        requiredActions: prev.requiredActions.map(action =>
          action.id === actionId ? { ...action, status: 'completed' as const, completedAt: Date.now() } : action
        )
      } : null);
    } catch (error) {
      console.error('Error completing action:', error);
    }
  };

  const uploadComplianceDocument = async (file: File, documentType: ComplianceDocumentType, jurisdiction: string) => {
    if (!dashboard) return;
    
    try {
      const newDocument: ComplianceDocument = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: documentType,
        status: 'pending',
        uploadedAt: Date.now(),
        lastReviewed: Date.now(),
        nextReview: Date.now() + (90 * 24 * 60 * 60 * 1000),
        jurisdiction,
        complianceCategory: getCategoryFromDocumentType(documentType),
        fileSize: file.size,
        url: URL.createObjectURL(file),
        metadata: {},
        reviewHistory: []
      };

      setDashboard(prev => prev ? {
        ...prev,
        documents: [...prev.documents, newDocument]
      } : null);
    } catch (error) {
      console.error('Error uploading compliance document:', error);
    }
  };

  const updateComplianceStatus = async (status: 'compliant' | 'non_compliant' | 'pending' | 'restricted') => {
    if (!dashboard) return;
    
    try {
      setDashboard(prev => prev ? {
        ...prev,
        overallStatus: status,
        lastUpdated: Date.now()
      } : null);
    } catch (error) {
      console.error('Error updating compliance status:', error);
    }
  };

  const scheduleComplianceReview = async (reviewDate: number) => {
    if (!dashboard) return;
    
    try {
      setDashboard(prev => prev ? {
        ...prev,
        nextReviewDate: reviewDate
      } : null);
    } catch (error) {
      console.error('Error scheduling compliance review:', error);
    }
  };

  const generateComplianceReport = async () => {
    if (!dashboard) return null;
    
    try {
      const report = {
        generatedAt: Date.now(),
        complianceScore: dashboard.complianceScore,
        overallStatus: dashboard.overallStatus,
        riskLevel: dashboard.riskLevel,
        totalDocuments: dashboard.documents.length,
        activeDocuments: dashboard.documents.filter(doc => doc.status === 'active').length,
        expiredDocuments: dashboard.documents.filter(doc => doc.status === 'expired').length,
        pendingActions: dashboard.requiredActions.filter(action => action.status === 'pending').length,
        overdueActions: dashboard.requiredActions.filter(action => action.status === 'overdue').length,
        activeAlerts: dashboard.alerts.filter(alert => !alert.acknowledged).length,
        jurisdictionCompliance: dashboard.jurisdictionRequirements.map(jur => ({
          jurisdiction: jur.jurisdiction,
          score: jur.complianceScore,
          riskLevel: jur.riskLevel
        }))
      };
      
      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return null;
    }
  };

  const getCategoryFromDocumentType = (type: ComplianceDocumentType): string => {
    const categoryMap: Record<ComplianceDocumentType, string> = {
      'business_license': 'licensing',
      'financial_statement': 'reporting',
      'tax_return': 'tax',
      'aml_policy': 'aml',
      'kyc_policy': 'kyc',
      'privacy_policy': 'data_protection',
      'terms_of_service': 'legal',
      'risk_assessment': 'risk',
      'audit_report': 'audit',
      'regulatory_filing': 'regulatory',
      'insurance_certificate': 'insurance',
      'capital_proof': 'financial',
      'director_declaration': 'governance'
    };
    return categoryMap[type] || 'other';
  };

  const generateDocumentExpiryAlerts = (documents: ComplianceDocument[]): ComplianceAlert[] => {
    const alerts: ComplianceAlert[] = [];
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    documents.forEach(doc => {
      if (doc.expiresAt) {
        const timeToExpiry = doc.expiresAt - now;
        
        if (timeToExpiry <= thirtyDays && timeToExpiry > 0) {
          alerts.push({
            id: `expiry_${doc.id}`,
            type: 'expiring_document',
            severity: timeToExpiry <= sevenDays ? 'critical' : 'warning',
            title: `Document Expiring Soon: ${doc.name}`,
            message: `Your ${doc.type.replace('_', ' ')} expires in ${Math.ceil(timeToExpiry / (24 * 60 * 60 * 1000))} days.`,
            createdAt: now,
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/compliance/documents/${doc.id}`,
            category: 'documents',
            expiresAt: doc.expiresAt
          });
        } else if (timeToExpiry <= 0) {
          alerts.push({
            id: `expired_${doc.id}`,
            type: 'expiring_document',
            severity: 'critical',
            title: `Document Expired: ${doc.name}`,
            message: `Your ${doc.type.replace('_', ' ')} has expired and requires immediate renewal.`,
            createdAt: now,
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/compliance/documents/${doc.id}`,
            category: 'documents'
          });
        }
      }
    });

    return alerts;
  };

  const generateComplianceTrends = (): ComplianceTrend[] => {
    const trends: ComplianceTrend[] = [];
    const now = Date.now();
    
    // Generate monthly compliance scores for the past 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now - (i * 30 * 24 * 60 * 60 * 1000));
      const baseScore = 85;
      const variation = Math.random() * 10 - 5;
      
      trends.push({
        date: monthDate.getTime(),
        complianceScore: Math.round(baseScore + variation),
        riskLevel: baseScore + variation > 80 ? 'low' : baseScore + variation > 60 ? 'medium' : 'high',
        documentCount: Math.floor(Math.random() * 5) + 10,
        actionCount: Math.floor(Math.random() * 3) + 1
      });
    }
    
    return trends;
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    dashboard,
    isLoading,
    selectedJurisdiction,
    selectedCategory,
    documentExpiryAlerts,
    complianceTrends,
    setSelectedJurisdiction,
    setSelectedCategory,
    loadDashboard,
    acknowledgeAlert,
    completeAction,
    uploadComplianceDocument,
    updateComplianceStatus,
    scheduleComplianceReview,
    generateComplianceReport
  };
}

export interface ComplianceTrend {
  date: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  documentCount: number;
  actionCount: number;
}
