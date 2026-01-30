import { EventEmitter } from 'events';
import {
  ComplianceRequirement,
  IComplianceRequirement,
  ComplianceStatus,
  RequirementType
} from '../models/ComplianceRequirement';
import { ComplianceReport, IComplianceReport, ComplianceReportType } from '../models/ComplianceReport';

export { ComplianceStatus, RequirementType, ComplianceReportType };

export class RegulatoryComplianceTrackingService extends EventEmitter {

  constructor() {
    super();
  }

  async createRequirement(data: Partial<IComplianceRequirement>): Promise<IComplianceRequirement> {
    const requirement = new ComplianceRequirement(data);
    await requirement.save();
    this.emit('requirementCreated', requirement);
    return requirement;
  }

  async updateRequirement(requirementId: string, updates: Partial<IComplianceRequirement>): Promise<IComplianceRequirement | null> {
    const updated = await ComplianceRequirement.findByIdAndUpdate(requirementId, updates, { new: true });
    if (updated) {
      this.emit('requirementUpdated', updated);
    }
    return updated;
  }

  async getRequirements(filters: any = {}): Promise<IComplianceRequirement[]> {
    return ComplianceRequirement.find(filters).sort({ dueDate: 1 });
  }

  async addEvidence(requirementId: string, evidence: any): Promise<IComplianceRequirement | null> {
    const requirement = await ComplianceRequirement.findById(requirementId);
    if (!requirement) throw new Error('Requirement not found');

    requirement.evidence.push({
      ...evidence,
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      uploadedAt: new Date()
    });

    await requirement.save();
    this.emit('evidenceAdded', { requirementId, evidence });
    return requirement;
  }

  async generateReport(data: {
    type: ComplianceReportType;
    jurisdiction: string;
    generatedBy: string;
    title: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<IComplianceReport> {

    // Fetch requirements for metrics
    const requirements = await ComplianceRequirement.find({
      jurisdictionCode: data.jurisdiction
    });

    const compliantCount = requirements.filter(r => r.status === ComplianceStatus.COMPLIANT).length;
    const score = requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 100;

    const report = new ComplianceReport({
      ...data,
      metrics: {
        overallComplianceScore: score,
        totalRequirements: requirements.length,
        compliantCount,
        nonCompliantCount: requirements.length - compliantCount,
        riskScore: 100 - score
      },
      findings: [], // In real app, analyze data to find issues
      status: 'draft'
    });

    await report.save();
    this.emit('reportGenerated', report);
    return report;
  }

  async getReports(filters: any = {}): Promise<IComplianceReport[]> {
    return ComplianceReport.find(filters).sort({ createdAt: -1 });
  }
}
