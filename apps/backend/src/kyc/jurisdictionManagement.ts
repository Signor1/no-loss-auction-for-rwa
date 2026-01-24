import { EventEmitter } from 'events';
import {
  Jurisdiction,
  IJurisdiction,
  JurisdictionType,
  ComplianceLevel,
  RegulationCategory
} from '../models/Jurisdiction';

export { JurisdictionType, ComplianceLevel, RegulationCategory };

export interface JurisdictionConfig {
  defaultComplianceLevel: ComplianceLevel;
  autoUpdateRegulations: boolean;
  notificationSettings: {
    regulationChanges: boolean;
    complianceDeadlines: boolean;
    restrictionUpdates: boolean;
    taxChanges: boolean;
  };
  riskAssessmentSettings: {
    weightComplianceLevel: number;
    weightRestrictions: number;
    weightTaxComplexity: number;
    weightPoliticalStability: number;
  };
  integrationSettings: {
    taxApiProvider?: string;
    regulatoryApiProvider?: string;
    updateFrequency: number; // hours
  };
}

export class JurisdictionManagementService extends EventEmitter {
  private config: JurisdictionConfig;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.seedDefaultJurisdictions();
  }

  private initializeDefaultConfig(): JurisdictionConfig {
    return {
      defaultComplianceLevel: ComplianceLevel.MEDIUM,
      autoUpdateRegulations: true,
      notificationSettings: {
        regulationChanges: true,
        complianceDeadlines: true,
        restrictionUpdates: true,
        taxChanges: true
      },
      riskAssessmentSettings: {
        weightComplianceLevel: 0.3,
        weightRestrictions: 0.25,
        weightTaxComplexity: 0.25,
        weightPoliticalStability: 0.2
      },
      integrationSettings: {
        updateFrequency: 24
      }
    };
  }

  private async seedDefaultJurisdictions() {
    // Check if jurisdictions already exist
    const count = await Jurisdiction.countDocuments();
    if (count > 0) return;

    const initialJurisdictions = [
      {
        name: 'United States',
        code: 'US',
        type: JurisdictionType.COUNTRY,
        complianceLevel: ComplianceLevel.HIGH,
        isActive: true,
        taxInfo: {
          corporateTaxRate: 21,
          vatRate: 0,
          withholdingTax: [{ type: 'dividends', rate: 30 }],
          taxTreaties: [],
          filingRequirements: [],
          taxResidencyRules: ['Incorporation'],
          exchangeOfInformation: true,
          fatcaCrsCompliant: true
        }
      },
      {
        name: 'United Kingdom',
        code: 'GB',
        type: JurisdictionType.COUNTRY,
        complianceLevel: ComplianceLevel.HIGH,
        isActive: true,
        taxInfo: {
          corporateTaxRate: 19,
          vatRate: 20,
          withholdingTax: [],
          taxTreaties: [],
          filingRequirements: [],
          taxResidencyRules: ['Incorporation'],
          exchangeOfInformation: true,
          fatcaCrsCompliant: true
        }
      }
    ];

    for (const j of initialJurisdictions) {
      const newJur = new Jurisdiction(j);
      await newJur.save();
    }
  }

  async createJurisdiction(data: Partial<IJurisdiction>): Promise<IJurisdiction> {
    const jurisdiction = new Jurisdiction({
      ...data,
      complianceLevel: data.complianceLevel || this.config.defaultComplianceLevel,
      lastUpdated: new Date()
    });

    await jurisdiction.save();
    this.emit('jurisdictionCreated', jurisdiction);
    return jurisdiction;
  }

  async updateJurisdiction(jurisdictionId: string, updates: Partial<IJurisdiction>): Promise<IJurisdiction | null> {
    const updatedJurisdiction = await Jurisdiction.findByIdAndUpdate(
      jurisdictionId,
      { ...updates, lastUpdated: new Date() },
      { new: true }
    );

    if (updatedJurisdiction) {
      this.emit('jurisdictionUpdated', updatedJurisdiction);
    }
    return updatedJurisdiction;
  }

  async deleteJurisdiction(jurisdictionId: string): Promise<boolean> {
    const result = await Jurisdiction.findByIdAndDelete(jurisdictionId);
    if (result) {
      this.emit('jurisdictionDeleted', { jurisdictionId });
      return true;
    }
    return false;
  }

  async getJurisdiction(query: any): Promise<IJurisdiction | null> {
    if (typeof query === 'string' && mongoose.Types.ObjectId.isValid(query)) {
      return Jurisdiction.findById(query);
    }
    return Jurisdiction.findOne(query);
  }

  async getJurisdictions(filters: any = {}): Promise<IJurisdiction[]> {
    return Jurisdiction.find(filters).sort({ name: 1 });
  }

  async addRegulation(jurisdictionId: string, regulation: any): Promise<IJurisdiction | null> {
    const jurisdiction = await Jurisdiction.findById(jurisdictionId);
    if (!jurisdiction) throw new Error('Jurisdiction not found');

    const newRegulation = {
      ...regulation,
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastReviewed: new Date()
    };

    jurisdiction.regulations.push(newRegulation);
    jurisdiction.lastUpdated = new Date();
    await jurisdiction.save();

    this.emit('regulationAdded', { jurisdictionId, regulation: newRegulation });
    return jurisdiction;
  }

  async assessJurisdictionRisk(jurisdictionId: string): Promise<any> {
    const jurisdiction = await Jurisdiction.findById(jurisdictionId);
    if (!jurisdiction) throw new Error('Jurisdiction not found');

    const settings = this.config.riskAssessmentSettings;
    const factors: any[] = [];

    // Simple risk logic preserved from original
    const complianceScores = {
      [ComplianceLevel.LOW]: 0.2,
      [ComplianceLevel.MEDIUM]: 0.5,
      [ComplianceLevel.HIGH]: 0.8,
      [ComplianceLevel.RESTRICTED]: 0.9
    };

    factors.push({
      category: 'compliance_level',
      score: complianceScores[jurisdiction.complianceLevel],
      description: `Compliance level: ${jurisdiction.complianceLevel}`
    });

    const riskScore = factors[0].score * settings.weightComplianceLevel;

    let riskLevel = 'low';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';

    return {
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      factors,
      recommendations: riskScore > 0.6 ? ['High risk jurisdiction. Implement enhanced monitoring.'] : ['Standard procedures.']
    };
  }

  async searchJurisdictions(query: string): Promise<IJurisdiction[]> {
    const regex = new RegExp(query, 'i');
    return Jurisdiction.find({
      $or: [
        { name: regex },
        { code: regex }
      ]
    });
  }
}

import mongoose from 'mongoose';
