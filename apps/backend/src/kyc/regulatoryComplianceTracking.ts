import { EventEmitter } from 'events';

export enum ComplianceRegulation {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  AML = 'aml',
  KYC = 'kyc',
  SOX = 'sox',
  PCI_DSS = 'pci_dss',
  FATCA = 'fatca',
  CRS = 'crs',
  MiFID_II = 'mifid_ii',
  PSD2 = 'psd2',
  eIDAS = 'eidas',
  HIPAA = 'hipaa'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  PENDING_REVIEW = 'pending_review',
  EXEMPT = 'exempt',
  NOT_APPLICABLE = 'not_applicable'
}

export enum RequirementType {
  TECHNICAL = 'technical',
  OPERATIONAL = 'operational',
  LEGAL = 'legal',
  ADMINISTRATIVE = 'administrative',
  DOCUMENTATION = 'documentation'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditFrequency {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  ON_DEMAND = 'on_demand'
}

export interface ComplianceRequirement {
  id: string;
  regulation: ComplianceRegulation;
  title: string;
  description: string;
  type: RequirementType;
  category: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  mandatory: boolean;
  dueDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  evidence: ComplianceEvidence[];
  controls: ComplianceControl[];
  dependencies: string[];
  tags: string[];
  lastAssessed: Date;
  nextAssessment: Date;
  notes?: string;
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'test_result' | 'certification' | 'other';
  name: string;
  description: string;
  url?: string;
  filePath?: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  implementation: string;
  effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
  testingFrequency: AuditFrequency;
  lastTested?: Date;
  nextTest: Date;
  owner: string;
  documentation?: string;
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
}

export interface ComplianceAssessment {
  id: string;
  requirementId: string;
  type: 'initial' | 'periodic' | 'ad_hoc' | 'remediation';
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  assessor: string;
  startDate: Date;
  endDate?: Date;
  score: number;
  maxScore: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  evidence: string[];
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  remediationPlan?: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  discoveredAt: Date;
  resolvedAt?: Date;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  regulations: ComplianceRegulation[];
  requirements: string[];
  lastUpdated: Date;
  isActive: boolean;
  customFields?: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  type: 'summary' | 'detailed' | 'executive' | 'audit' | 'regulatory';
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  regulations: ComplianceRegulation[];
  overallStatus: ComplianceStatus;
  overallScore: number;
  requirements: ComplianceRequirement[];
  findings: ComplianceFinding[];
  recommendations: string[];
  attachments: string[];
  metadata?: Record<string, any>;
}

export interface ComplianceMetrics {
  totalRequirements: number;
  compliantRequirements: number;
  nonCompliantRequirements: number;
  partiallyCompliantRequirements: number;
  overallCompliancePercentage: number;
  requirementsByRiskLevel: Record<RiskLevel, number>;
  requirementsByRegulation: Record<ComplianceRegulation, number>;
  overdueAssessments: number;
  openFindings: number;
  criticalFindings: number;
  averageResolutionTime: number;
  upcomingDueDates: Array<{
    requirementId: string;
    title: string;
    dueDate: Date;
    riskLevel: RiskLevel;
  }>;
  complianceTrend: Array<{
    date: string;
    compliancePercentage: number;
    totalFindings: number;
  }>;
}

export interface ComplianceConfig {
  autoAssessmentEnabled: boolean;
  assessmentFrequency: AuditFrequency;
  notificationSettings: {
    upcomingDueDates: boolean;
    failedAssessments: boolean;
    newFindings: boolean;
    overdueTasks: boolean;
  };
  riskThresholds: {
    acceptableRiskLevel: RiskLevel;
    maxOpenFindings: number;
    maxOverdueDays: number;
  };
  retentionPeriod: number; // days
  customWorkflows: Record<string, any>;
}

export class RegulatoryComplianceTrackingService extends EventEmitter {
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private assessments: Map<string, ComplianceAssessment> = new Map();
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();
  private config: ComplianceConfig;
  private metrics: ComplianceMetrics;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultFrameworks();
    this.initializeDefaultRequirements();
  }

  private initializeDefaultConfig(): ComplianceConfig {
    return {
      autoAssessmentEnabled: true,
      assessmentFrequency: AuditFrequency.QUARTERLY,
      notificationSettings: {
        upcomingDueDates: true,
        failedAssessments: true,
        newFindings: true,
        overdueTasks: true
      },
      riskThresholds: {
        acceptableRiskLevel: RiskLevel.MEDIUM,
        maxOpenFindings: 10,
        maxOverdueDays: 30
      },
      retentionPeriod: 2555, // 7 years
      customWorkflows: {}
    };
  }

  private initializeMetrics(): ComplianceMetrics {
    return {
      totalRequirements: 0,
      compliantRequirements: 0,
      nonCompliantRequirements: 0,
      partiallyCompliantRequirements: 0,
      overallCompliancePercentage: 0,
      requirementsByRiskLevel: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      requirementsByRegulation: {
        gdpr: 0,
        ccpa: 0,
        aml: 0,
        kyc: 0,
        sox: 0,
        pci_dss: 0,
        fatca: 0,
        crs: 0,
        mifid_ii: 0,
        psd2: 0,
        eidas: 0,
        hipaa: 0
      },
      overdueAssessments: 0,
      openFindings: 0,
      criticalFindings: 0,
      averageResolutionTime: 0,
      upcomingDueDates: [],
      complianceTrend: []
    };
  }

  private initializeDefaultFrameworks(): void {
    const frameworks: ComplianceFramework[] = [
      {
        id: 'fw_gdpr',
        name: 'GDPR Compliance Framework',
        version: '1.0',
        description: 'General Data Protection Regulation compliance framework',
        regulations: [ComplianceRegulation.GDPR],
        requirements: [],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'fw_aml',
        name: 'AML Compliance Framework',
        version: '1.0',
        description: 'Anti-Money Laundering compliance framework',
        regulations: [ComplianceRegulation.AML],
        requirements: [],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'fw_pci_dss',
        name: 'PCI DSS Compliance Framework',
        version: '4.0',
        description: 'Payment Card Industry Data Security Standard compliance framework',
        regulations: [ComplianceRegulation.PCI_DSS],
        requirements: [],
        lastUpdated: new Date(),
        isActive: true
      }
    ];

    frameworks.forEach(framework => {
      this.frameworks.set(framework.id, framework);
    });
  }

  private initializeDefaultRequirements(): void {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'req_gdpr_001',
        regulation: ComplianceRegulation.GDPR,
        title: 'Lawful Basis for Processing',
        description: 'Ensure a lawful basis for processing personal data',
        type: RequirementType.LEGAL,
        category: 'Data Protection',
        status: ComplianceStatus.COMPLIANT,
        riskLevel: RiskLevel.HIGH,
        mandatory: true,
        evidence: [],
        controls: [],
        dependencies: [],
        tags: ['gdpr', 'data-processing', 'legal-basis'],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      },
      {
        id: 'req_gdpr_002',
        regulation: ComplianceRegulation.GDPR,
        title: 'Data Subject Rights',
        description: 'Implement procedures to handle data subject rights requests',
        type: RequirementType.OPERATIONAL,
        category: 'Data Subject Rights',
        status: ComplianceStatus.PARTIALLY_COMPLIANT,
        riskLevel: RiskLevel.MEDIUM,
        mandatory: true,
        evidence: [],
        controls: [],
        dependencies: ['req_gdpr_001'],
        tags: ['gdpr', 'data-subject-rights', 'requests'],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        id: 'req_aml_001',
        regulation: ComplianceRegulation.AML,
        title: 'Customer Due Diligence',
        description: 'Perform customer due diligence procedures',
        type: RequirementType.OPERATIONAL,
        category: 'KYC/CDD',
        status: ComplianceStatus.COMPLIANT,
        riskLevel: RiskLevel.HIGH,
        mandatory: true,
        evidence: [],
        controls: [],
        dependencies: [],
        tags: ['aml', 'cdd', 'kyc'],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        id: 'req_pci_001',
        regulation: ComplianceRegulation.PCI_DSS,
        title: 'Network Security Controls',
        description: 'Implement and maintain network security controls',
        type: RequirementType.TECHNICAL,
        category: 'Network Security',
        status: ComplianceStatus.COMPLIANT,
        riskLevel: RiskLevel.CRITICAL,
        mandatory: true,
        evidence: [],
        controls: [],
        dependencies: [],
        tags: ['pci-dss', 'network-security', 'technical'],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
      }
    ];

    requirements.forEach(requirement => {
      this.requirements.set(requirement.id, requirement);
    });

    this.updateMetrics();
  }

  async createRequirement(data: Partial<ComplianceRequirement>): Promise<ComplianceRequirement> {
    const requirement: ComplianceRequirement = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      regulation: data.regulation || ComplianceRegulation.GDPR,
      title: data.title || '',
      description: data.description || '',
      type: data.type || RequirementType.OPERATIONAL,
      category: data.category || 'General',
      status: ComplianceStatus.PENDING_REVIEW,
      riskLevel: data.riskLevel || RiskLevel.MEDIUM,
      mandatory: data.mandatory || false,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      evidence: [],
      controls: [],
      dependencies: data.dependencies || [],
      tags: data.tags || [],
      lastAssessed: new Date(),
      nextAssessment: data.nextAssessment || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      notes: data.notes
    };

    this.requirements.set(requirement.id, requirement);
    this.updateMetrics();
    this.emit('requirementCreated', requirement);

    return requirement;
  }

  async updateRequirement(requirementId: string, updates: Partial<ComplianceRequirement>): Promise<ComplianceRequirement | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const updatedRequirement = { ...requirement, ...updates };
    this.requirements.set(requirementId, updatedRequirement);
    this.updateMetrics();
    this.emit('requirementUpdated', updatedRequirement);

    return updatedRequirement;
  }

  async deleteRequirement(requirementId: string): Promise<boolean> {
    const deleted = this.requirements.delete(requirementId);
    if (deleted) {
      this.updateMetrics();
      this.emit('requirementDeleted', { requirementId });
    }
    return deleted;
  }

  async createAssessment(data: Partial<ComplianceAssessment>): Promise<ComplianceAssessment> {
    const assessment: ComplianceAssessment = {
      id: `ass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requirementId: data.requirementId || '',
      type: data.type || 'periodic',
      status: 'planned',
      assessor: data.assessor || '',
      startDate: data.startDate || new Date(),
      score: 0,
      maxScore: data.maxScore || 100,
      findings: [],
      recommendations: [],
      evidence: [],
      endDate: data.endDate,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt
    };

    this.assessments.set(assessment.id, assessment);
    this.emit('assessmentCreated', assessment);

    return assessment;
  }

  async updateAssessment(assessmentId: string, updates: Partial<ComplianceAssessment>): Promise<ComplianceAssessment | null> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) return null;

    const updatedAssessment = { ...assessment, ...updates };
    this.assessments.set(assessmentId, updatedAssessment);
    this.emit('assessmentUpdated', updatedAssessment);

    // Update requirement status based on assessment
    if (updatedAssessment.status === 'completed') {
      const requirement = this.requirements.get(updatedAssessment.requirementId);
      if (requirement) {
        const newStatus = this.calculateRequirementStatus(updatedAssessment.score, updatedAssessment.maxScore);
        await this.updateRequirement(requirement.id, {
          status: newStatus,
          lastAssessed: new Date()
        });
      }
    }

    return updatedAssessment;
  }

  private calculateRequirementStatus(score: number, maxScore: number): ComplianceStatus {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return ComplianceStatus.COMPLIANT;
    if (percentage >= 70) return ComplianceStatus.PARTIALLY_COMPLIANT;
    return ComplianceStatus.NON_COMPLIANT;
  }

  async addEvidence(requirementId: string, evidence: Omit<ComplianceEvidence, 'id' | 'uploadedAt'>): Promise<ComplianceEvidence> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) throw new Error('Requirement not found');

    const newEvidence: ComplianceEvidence = {
      ...evidence,
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    };

    requirement.evidence.push(newEvidence);
    this.emit('evidenceAdded', { requirementId, evidence: newEvidence });

    return newEvidence;
  }

  async removeEvidence(requirementId: string, evidenceId: string): Promise<boolean> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    const initialLength = requirement.evidence.length;
    requirement.evidence = requirement.evidence.filter(e => e.id !== evidenceId);
    const removed = requirement.evidence.length < initialLength;

    if (removed) {
      this.emit('evidenceRemoved', { requirementId, evidenceId });
    }

    return removed;
  }

  async addControl(requirementId: string, control: Omit<ComplianceControl, 'id'>): Promise<ComplianceControl> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) throw new Error('Requirement not found');

    const newControl: ComplianceControl = {
      ...control,
      id: `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    requirement.controls.push(newControl);
    this.emit('controlAdded', { requirementId, control: newControl });

    return newControl;
  }

  async removeControl(requirementId: string, controlId: string): Promise<boolean> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    const initialLength = requirement.controls.length;
    requirement.controls = requirement.controls.filter(c => c.id !== controlId);
    const removed = requirement.controls.length < initialLength;

    if (removed) {
      this.emit('controlRemoved', { requirementId, controlId });
    }

    return removed;
  }

  async generateReport(data: {
    type: ComplianceReport['type'];
    title: string;
    description?: string;
    regulations: ComplianceRegulation[];
    period: {
      startDate: Date;
      endDate: Date;
    };
    generatedBy: string;
  }): Promise<ComplianceReport> {
    const relevantRequirements = Array.from(this.requirements.values())
      .filter(req => data.regulations.includes(req.regulation));

    const relevantFindings = Array.from(this.assessments.values())
      .flatMap(ass => ass.findings);

    const overallStatus = this.calculateOverallStatus(relevantRequirements);
    const overallScore = this.calculateOverallScore(relevantRequirements);

    const report: ComplianceReport = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      title: data.title,
      description: data.description || '',
      generatedBy: data.generatedBy,
      generatedAt: new Date(),
      period: data.period,
      regulations: data.regulations,
      overallStatus,
      overallScore,
      requirements: relevantRequirements,
      findings: relevantFindings,
      recommendations: this.generateRecommendations(relevantRequirements, relevantFindings),
      attachments: []
    };

    this.reports.set(report.id, report);
    this.emit('reportGenerated', report);

    return report;
  }

  private calculateOverallStatus(requirements: ComplianceRequirement[]): ComplianceStatus {
    if (requirements.length === 0) return ComplianceStatus.NOT_APPLICABLE;

    const compliantCount = requirements.filter(r => r.status === ComplianceStatus.COMPLIANT).length;
    const nonCompliantCount = requirements.filter(r => r.status === ComplianceStatus.NON_COMPLIANT).length;
    const partiallyCompliantCount = requirements.filter(r => r.status === ComplianceStatus.PARTIALLY_COMPLIANT).length;

    if (nonCompliantCount > 0) return ComplianceStatus.NON_COMPLIANT;
    if (partiallyCompliantCount > 0) return ComplianceStatus.PARTIALLY_COMPLIANT;
    if (compliantCount === requirements.length) return ComplianceStatus.COMPLIANT;
    return ComplianceStatus.PENDING_REVIEW;
  }

  private calculateOverallScore(requirements: ComplianceRequirement[]): number {
    if (requirements.length === 0) return 0;

    const statusScores = {
      [ComplianceStatus.COMPLIANT]: 100,
      [ComplianceStatus.PARTIALLY_COMPLIANT]: 70,
      [ComplianceStatus.NON_COMPLIANT]: 30,
      [ComplianceStatus.PENDING_REVIEW]: 50,
      [ComplianceStatus.EXEMPT]: 100,
      [ComplianceStatus.NOT_APPLICABLE]: 100
    };

    const totalScore = requirements.reduce((sum, req) => sum + statusScores[req.status], 0);
    return Math.round(totalScore / requirements.length);
  }

  private generateRecommendations(requirements: ComplianceRequirement[], findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    // Analyze requirements
    const nonCompliantReqs = requirements.filter(r => r.status === ComplianceStatus.NON_COMPLIANT);
    const partiallyCompliantReqs = requirements.filter(r => r.status === ComplianceStatus.PARTIALLY_COMPLIANT);
    const highRiskReqs = requirements.filter(r => r.riskLevel === RiskLevel.HIGH || r.riskLevel === RiskLevel.CRITICAL);

    if (nonCompliantReqs.length > 0) {
      recommendations.push(`Address ${nonCompliantReqs.length} non-compliant requirements immediately`);
    }

    if (partiallyCompliantReqs.length > 0) {
      recommendations.push(`Complete implementation of ${partiallyCompliantReqs.length} partially compliant requirements`);
    }

    if (highRiskReqs.some(r => r.status !== ComplianceStatus.COMPLIANT)) {
      recommendations.push('Prioritize remediation of high-risk and critical requirements');
    }

    // Analyze findings
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push(`Immediate action required for ${criticalFindings.length} critical findings`);
    }

    if (highFindings.length > 0) {
      recommendations.push(`Address ${highFindings.length} high-priority findings within 30 days`);
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring compliance posture and maintain current controls');
    }

    recommendations.push('Schedule regular compliance assessments and reviews');
    recommendations.push('Update documentation and evidence regularly');

    return recommendations;
  }

  private updateMetrics(): void {
    const requirements = Array.from(this.requirements.values());

    this.metrics.totalRequirements = requirements.length;
    this.metrics.compliantRequirements = requirements.filter(r => r.status === ComplianceStatus.COMPLIANT).length;
    this.metrics.nonCompliantRequirements = requirements.filter(r => r.status === ComplianceStatus.NON_COMPLIANT).length;
    this.metrics.partiallyCompliantRequirements = requirements.filter(r => r.status === ComplianceStatus.PARTIALLY_COMPLIANT).length;

    this.metrics.overallCompliancePercentage = this.metrics.totalRequirements > 0
      ? Math.round((this.metrics.compliantRequirements / this.metrics.totalRequirements) * 100)
      : 0;

    // Requirements by risk level
    this.metrics.requirementsByRiskLevel = {
      low: requirements.filter(r => r.riskLevel === RiskLevel.LOW).length,
      medium: requirements.filter(r => r.riskLevel === RiskLevel.MEDIUM).length,
      high: requirements.filter(r => r.riskLevel === RiskLevel.HIGH).length,
      critical: requirements.filter(r => r.riskLevel === RiskLevel.CRITICAL).length
    };

    // Requirements by regulation
    this.metrics.requirementsByRegulation = {
      gdpr: requirements.filter(r => r.regulation === ComplianceRegulation.GDPR).length,
      ccpa: requirements.filter(r => r.regulation === ComplianceRegulation.CCPA).length,
      aml: requirements.filter(r => r.regulation === ComplianceRegulation.AML).length,
      kyc: requirements.filter(r => r.regulation === ComplianceRegulation.KYC).length,
      sox: requirements.filter(r => r.regulation === ComplianceRegulation.SOX).length,
      pci_dss: requirements.filter(r => r.regulation === ComplianceRegulation.PCI_DSS).length,
      fatca: requirements.filter(r => r.regulation === ComplianceRegulation.FATCA).length,
      crs: requirements.filter(r => r.regulation === ComplianceRegulation.CRS).length,
      mifid_ii: requirements.filter(r => r.regulation === ComplianceRegulation.MiFID_II).length,
      psd2: requirements.filter(r => r.regulation === ComplianceRegulation.PSD2).length,
      eidas: requirements.filter(r => r.regulation === ComplianceRegulation.eIDAS).length,
      hipaa: requirements.filter(r => r.regulation === ComplianceRegulation.HIPAA).length
    };

    // Overdue assessments
    const now = new Date();
    this.metrics.overdueAssessments = requirements.filter(r => r.nextAssessment < now).length;

    // Upcoming due dates
    this.metrics.upcomingDueDates = requirements
      .filter(r => r.dueDate && r.dueDate > now)
      .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
      .slice(0, 10)
      .map(r => ({
        requirementId: r.id,
        title: r.title,
        dueDate: r.dueDate!,
        riskLevel: r.riskLevel
      }));

    // Findings metrics
    const allFindings = Array.from(this.assessments.values()).flatMap(ass => ass.findings);
    this.metrics.openFindings = allFindings.filter(f => f.status === 'open').length;
    this.metrics.criticalFindings = allFindings.filter(f => f.severity === 'critical' && f.status === 'open').length;

    // Average resolution time
    const resolvedFindings = allFindings.filter(f => f.status === 'resolved' && f.resolvedAt);
    if (resolvedFindings.length > 0) {
      const totalResolutionTime = resolvedFindings.reduce((sum, f) => {
        return sum + (f.resolvedAt!.getTime() - f.discoveredAt.getTime());
      }, 0);
      this.metrics.averageResolutionTime = totalResolutionTime / resolvedFindings.length / (1000 * 60 * 60 * 24); // days
    }
  }

  async getMetrics(): Promise<ComplianceMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async getRequirement(requirementId: string): Promise<ComplianceRequirement | null> {
    return this.requirements.get(requirementId) || null;
  }

  async getAssessment(assessmentId: string): Promise<ComplianceAssessment | null> {
    return this.assessments.get(assessmentId) || null;
  }

  async getReport(reportId: string): Promise<ComplianceReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getRequirements(filters?: {
    regulation?: ComplianceRegulation;
    status?: ComplianceStatus;
    riskLevel?: RiskLevel;
    assignedTo?: string;
  }): Promise<ComplianceRequirement[]> {
    let requirements = Array.from(this.requirements.values());

    if (filters) {
      if (filters.regulation) {
        requirements = requirements.filter(r => r.regulation === filters.regulation);
      }
      if (filters.status) {
        requirements = requirements.filter(r => r.status === filters.status);
      }
      if (filters.riskLevel) {
        requirements = requirements.filter(r => r.riskLevel === filters.riskLevel);
      }
      if (filters.assignedTo) {
        requirements = requirements.filter(r => r.assignedTo === filters.assignedTo);
      }
    }

    return requirements;
  }

  async getAssessments(filters?: {
    requirementId?: string;
    assessor?: string;
    status?: ComplianceAssessment['status'];
    type?: ComplianceAssessment['type'];
  }): Promise<ComplianceAssessment[]> {
    let assessments = Array.from(this.assessments.values());

    if (filters) {
      if (filters.requirementId) {
        assessments = assessments.filter(a => a.requirementId === filters.requirementId);
      }
      if (filters.assessor) {
        assessments = assessments.filter(a => a.assessor === filters.assessor);
      }
      if (filters.status) {
        assessments = assessments.filter(a => a.status === filters.status);
      }
      if (filters.type) {
        assessments = assessments.filter(a => a.type === filters.type);
      }
    }

    return assessments;
  }

  async getReports(filters?: {
    type?: ComplianceReport['type'];
    regulations?: ComplianceRegulation[];
    generatedBy?: string;
  }): Promise<ComplianceReport[]> {
    let reports = Array.from(this.reports.values());

    if (filters) {
      if (filters.type) {
        reports = reports.filter(r => r.type === filters.type);
      }
      if (filters.regulations) {
        reports = reports.filter(r => 
          filters.regulations!.some(reg => r.regulations.includes(reg))
        );
      }
      if (filters.generatedBy) {
        reports = reports.filter(r => r.generatedBy === filters.generatedBy);
      }
    }

    return reports;
  }

  async updateConfig(updates: Partial<ComplianceConfig>): Promise<ComplianceConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<ComplianceConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalRequirements: number;
    compliancePercentage: number;
    criticalFindings: number;
    overdueAssessments: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (this.metrics.criticalFindings > 0 || this.metrics.overdueAssessments > 10) {
      status = 'critical';
    } else if (this.metrics.overallCompliancePercentage < 80 || this.metrics.overdueAssessments > 5) {
      status = 'warning';
    }

    return {
      status,
      totalRequirements: this.metrics.totalRequirements,
      compliancePercentage: this.metrics.overallCompliancePercentage,
      criticalFindings: this.metrics.criticalFindings,
      overdueAssessments: this.metrics.overdueAssessments,
      lastUpdated: new Date()
    };
  }
}
