import { EventEmitter } from 'events';

export enum JurisdictionType {
  COUNTRY = 'country',
  STATE = 'state',
  PROVINCE = 'province',
  REGION = 'region',
  CITY = 'city',
  SPECIAL_ECONOMIC_ZONE = 'special_economic_zone',
  TAX_HAVEN = 'tax_haven'
}

export enum ComplianceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  RESTRICTED = 'restricted'
}

export enum RegulationCategory {
  DATA_PROTECTION = 'data_protection',
  FINANCIAL_SERVICES = 'financial_services',
  TAX = 'tax',
  ANTI_MONEY_LAUNDERING = 'anti_money_laundering',
  CONSUMER_PROTECTION = 'consumer_protection',
  EMPLOYMENT = 'employment',
  ENVIRONMENTAL = 'environmental',
  HEALTHCARE = 'healthcare',
  TELECOMMUNICATIONS = 'telecommunications'
}

export interface Jurisdiction {
  id: string;
  name: string;
  code: string; // ISO 3166-1 alpha-2/3
  type: JurisdictionType;
  parentJurisdiction?: string;
  complianceLevel: ComplianceLevel;
  isActive: boolean;
  regulations: JurisdictionRegulation[];
  restrictions: JurisdictionRestriction[];
  taxInfo: TaxInformation;
  metadata: Record<string, any>;
  lastUpdated: Date;
}

export interface JurisdictionRegulation {
  id: string;
  name: string;
  category: RegulationCategory;
  description: string;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'draft' | 'superseded' | 'repealed';
  requirements: RegulationRequirement[];
  penalties: RegulationPenalty[];
  authority: string;
  documentationUrl?: string;
  lastReviewed: Date;
}

export interface RegulationRequirement {
  id: string;
  title: string;
  description: string;
  type: 'mandatory' | 'recommended' | 'conditional';
  category: string;
  dueDate?: Date;
  evidenceRequired: boolean;
  automatedCheck: boolean;
  implementationStatus: 'not_started' | 'in_progress' | 'completed' | 'exempt';
  assignedTo?: string;
  notes?: string;
}

export interface RegulationPenalty {
  type: 'fine' | 'imprisonment' | 'license_suspension' | 'business_closure' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  minimumAmount?: number;
  maximumAmount?: number;
  currency?: string;
  imprisonmentTerm?: string;
}

export interface JurisdictionRestriction {
  id: string;
  type: 'business_activity' | 'service_type' | 'customer_type' | 'transaction_type' | 'data_flow';
  category: string;
  description: string;
  isProhibited: boolean;
  requiresLicense: boolean;
  conditions: RestrictionCondition[];
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface RestrictionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  description: string;
}

export interface TaxInformation {
  corporateTaxRate: number;
  vatRate: number;
  withholdingTax: WithholdingTaxRate[];
  taxTreaties: TaxTreaty[];
  filingRequirements: TaxFilingRequirement[];
  taxResidencyRules: string[];
  exchangeOfInformation: boolean;
  fatcaCrsCompliant: boolean;
}

export interface WithholdingTaxRate {
  type: 'dividends' | 'interest' | 'royalties' | 'services';
  rate: number;
  conditions?: string[];
}

export interface TaxTreaty {
  country: string;
  effectiveDate: Date;
  benefits: string[];
  withholdingTaxReduction: WithholdingTaxRate[];
}

export interface TaxFilingRequirement {
  type: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  dueDate: string; // MM-DD format
  forms: string[];
  authority: string;
}

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

export interface JurisdictionAnalytics {
  totalJurisdictions: number;
  activeJurisdictions: number;
  jurisdictionsByType: Record<JurisdictionType, number>;
  jurisdictionsByComplianceLevel: Record<ComplianceLevel, number>;
  totalRegulations: number;
  activeRegulations: number;
  upcomingDeadlines: Array<{
    jurisdictionId: string;
    jurisdictionName: string;
    requirementId: string;
    requirementTitle: string;
    dueDate: Date;
    category: RegulationCategory;
  }>;
  highRiskJurisdictions: Array<{
    jurisdictionId: string;
    name: string;
    riskScore: number;
    riskFactors: string[];
  }>;
  complianceTrend: Array<{
    date: string;
    complianceScore: number;
    openRequirements: number;
  }>;
}

export class JurisdictionManagementService extends EventEmitter {
  private jurisdictions: Map<string, Jurisdiction> = new Map();
  private config: JurisdictionConfig;
  private analytics: JurisdictionAnalytics;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.analytics = this.initializeAnalytics();
    this.initializeDefaultJurisdictions();
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

  private initializeAnalytics(): JurisdictionAnalytics {
    return {
      totalJurisdictions: 0,
      activeJurisdictions: 0,
      jurisdictionsByType: {
        country: 0,
        state: 0,
        province: 0,
        region: 0,
        city: 0,
        special_economic_zone: 0,
        tax_haven: 0
      },
      jurisdictionsByComplianceLevel: {
        low: 0,
        medium: 0,
        high: 0,
        restricted: 0
      },
      totalRegulations: 0,
      activeRegulations: 0,
      upcomingDeadlines: [],
      highRiskJurisdictions: [],
      complianceTrend: []
    };
  }

  private initializeDefaultJurisdictions(): void {
    const jurisdictions: Jurisdiction[] = [
      {
        id: 'us',
        name: 'United States',
        code: 'US',
        type: JurisdictionType.COUNTRY,
        complianceLevel: ComplianceLevel.HIGH,
        isActive: true,
        regulations: [],
        restrictions: [],
        taxInfo: {
          corporateTaxRate: 21,
          vatRate: 0,
          withholdingTax: [
            { type: 'dividends', rate: 30 },
            { type: 'interest', rate: 30 },
            { type: 'royalties', rate: 30 }
          ],
          taxTreaties: [],
          filingRequirements: [
            {
              type: 'Corporate Income Tax',
              frequency: 'annually',
              dueDate: '04-15',
              forms: ['1120'],
              authority: 'IRS'
            }
          ],
          taxResidencyRules: ['Incorporation', 'Place of Management'],
          exchangeOfInformation: true,
          fatcaCrsCompliant: true
        },
        metadata: {
          region: 'North America',
          currency: 'USD',
          language: 'English'
        },
        lastUpdated: new Date()
      },
      {
        id: 'gb',
        name: 'United Kingdom',
        code: 'GB',
        type: JurisdictionType.COUNTRY,
        complianceLevel: ComplianceLevel.HIGH,
        isActive: true,
        regulations: [],
        restrictions: [],
        taxInfo: {
          corporateTaxRate: 19,
          vatRate: 20,
          withholdingTax: [
            { type: 'dividends', rate: 0 },
            { type: 'interest', rate: 20 },
            { type: 'royalties', rate: 20 }
          ],
          taxTreaties: [],
          filingRequirements: [
            {
              type: 'Corporation Tax',
              frequency: 'annually',
              dueDate: '12-31',
              forms: ['CT600'],
              authority: 'HMRC'
            }
          ],
          taxResidencyRules: ['Incorporation', 'Central Management'],
          exchangeOfInformation: true,
          fatcaCrsCompliant: true
        },
        metadata: {
          region: 'Europe',
          currency: 'GBP',
          language: 'English'
        },
        lastUpdated: new Date()
      },
      {
        id: 'sg',
        name: 'Singapore',
        code: 'SG',
        type: JurisdictionType.COUNTRY,
        complianceLevel: ComplianceLevel.MEDIUM,
        isActive: true,
        regulations: [],
        restrictions: [],
        taxInfo: {
          corporateTaxRate: 17,
          vatRate: 7,
          withholdingTax: [
            { type: 'dividends', rate: 0 },
            { type: 'interest', rate: 15 },
            { type: 'royalties', rate: 15 }
          ],
          taxTreaties: [],
          filingRequirements: [
            {
              type: 'Corporate Income Tax',
              frequency: 'annually',
              dueDate: '11-30',
              forms: ['Form C'],
              authority: 'IRAS'
            }
          ],
          taxResidencyRules: ['Incorporation', 'Control'],
          exchangeOfInformation: true,
          fatcaCrsCompliant: true
        },
        metadata: {
          region: 'Asia',
          currency: 'SGD',
          language: 'English'
        },
        lastUpdated: new Date()
      }
    ];

    jurisdictions.forEach(jurisdiction => {
      this.jurisdictions.set(jurisdiction.id, jurisdiction);
    });

    this.updateAnalytics();
  }

  async createJurisdiction(data: Partial<Jurisdiction>): Promise<Jurisdiction> {
    const jurisdiction: Jurisdiction = {
      id: data.id || `jur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      code: data.code || '',
      type: data.type || JurisdictionType.COUNTRY,
      parentJurisdiction: data.parentJurisdiction,
      complianceLevel: data.complianceLevel || this.config.defaultComplianceLevel,
      isActive: data.isActive !== undefined ? data.isActive : true,
      regulations: data.regulations || [],
      restrictions: data.restrictions || [],
      taxInfo: data.taxInfo || {
        corporateTaxRate: 0,
        vatRate: 0,
        withholdingTax: [],
        taxTreaties: [],
        filingRequirements: [],
        taxResidencyRules: [],
        exchangeOfInformation: false,
        fatcaCrsCompliant: false
      },
      metadata: data.metadata || {},
      lastUpdated: new Date()
    };

    this.jurisdictions.set(jurisdiction.id, jurisdiction);
    this.updateAnalytics();
    this.emit('jurisdictionCreated', jurisdiction);

    return jurisdiction;
  }

  async updateJurisdiction(jurisdictionId: string, updates: Partial<Jurisdiction>): Promise<Jurisdiction | null> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) return null;

    const updatedJurisdiction = { 
      ...jurisdiction, 
      ...updates, 
      lastUpdated: new Date() 
    };
    
    this.jurisdictions.set(jurisdictionId, updatedJurisdiction);
    this.updateAnalytics();
    this.emit('jurisdictionUpdated', updatedJurisdiction);

    return updatedJurisdiction;
  }

  async deleteJurisdiction(jurisdictionId: string): Promise<boolean> {
    const deleted = this.jurisdictions.delete(jurisdictionId);
    if (deleted) {
      this.updateAnalytics();
      this.emit('jurisdictionDeleted', { jurisdictionId });
    }
    return deleted;
  }

  async addRegulation(jurisdictionId: string, regulation: Omit<JurisdictionRegulation, 'id' | 'lastReviewed'>): Promise<JurisdictionRegulation> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) throw new Error('Jurisdiction not found');

    const newRegulation: JurisdictionRegulation = {
      ...regulation,
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastReviewed: new Date()
    };

    jurisdiction.regulations.push(newRegulation);
    jurisdiction.lastUpdated = new Date();
    this.updateAnalytics();
    this.emit('regulationAdded', { jurisdictionId, regulation: newRegulation });

    return newRegulation;
  }

  async updateRegulation(jurisdictionId: string, regulationId: string, updates: Partial<JurisdictionRegulation>): Promise<JurisdictionRegulation | null> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) return null;

    const regulationIndex = jurisdiction.regulations.findIndex(r => r.id === regulationId);
    if (regulationIndex === -1) return null;

    const updatedRegulation = { 
      ...jurisdiction.regulations[regulationIndex], 
      ...updates,
      lastReviewed: new Date()
    };

    jurisdiction.regulations[regulationIndex] = updatedRegulation;
    jurisdiction.lastUpdated = new Date();
    this.updateAnalytics();
    this.emit('regulationUpdated', { jurisdictionId, regulation: updatedRegulation });

    return updatedRegulation;
  }

  async addRestriction(jurisdictionId: string, restriction: Omit<JurisdictionRestriction, 'id'>): Promise<JurisdictionRestriction> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) throw new Error('Jurisdiction not found');

    const newRestriction: JurisdictionRestriction = {
      ...restriction,
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    jurisdiction.restrictions.push(newRestriction);
    jurisdiction.lastUpdated = new Date();
    this.updateAnalytics();
    this.emit('restrictionAdded', { jurisdictionId, restriction: newRestriction });

    return newRestriction;
  }

  async updateTaxInformation(jurisdictionId: string, taxInfo: Partial<TaxInformation>): Promise<TaxInformation | null> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) return null;

    const updatedTaxInfo = { ...jurisdiction.taxInfo, ...taxInfo };
    jurisdiction.taxInfo = updatedTaxInfo;
    jurisdiction.lastUpdated = new Date();
    this.updateAnalytics();
    this.emit('taxInformationUpdated', { jurisdictionId, taxInfo: updatedTaxInfo });

    return updatedTaxInfo;
  }

  async getJurisdiction(jurisdictionId: string): Promise<Jurisdiction | null> {
    return this.jurisdictions.get(jurisdictionId) || null;
  }

  async getJurisdictions(filters?: {
    type?: JurisdictionType;
    complianceLevel?: ComplianceLevel;
    isActive?: boolean;
    parentJurisdiction?: string;
  }): Promise<Jurisdiction[]> {
    let jurisdictions = Array.from(this.jurisdictions.values());

    if (filters) {
      if (filters.type) {
        jurisdictions = jurisdictions.filter(j => j.type === filters.type);
      }
      if (filters.complianceLevel) {
        jurisdictions = jurisdictions.filter(j => j.complianceLevel === filters.complianceLevel);
      }
      if (filters.isActive !== undefined) {
        jurisdictions = jurisdictions.filter(j => j.isActive === filters.isActive);
      }
      if (filters.parentJurisdiction) {
        jurisdictions = jurisdictions.filter(j => j.parentJurisdiction === filters.parentJurisdiction);
      }
    }

    return jurisdictions;
  }

  async searchJurisdictions(query: string): Promise<Jurisdiction[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.jurisdictions.values()).filter(j => 
      j.name.toLowerCase().includes(lowerQuery) ||
      j.code.toLowerCase().includes(lowerQuery) ||
      Object.values(j.metadata).some(value => 
        String(value).toLowerCase().includes(lowerQuery)
      )
    );
  }

  async assessJurisdictionRisk(jurisdictionId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{
      category: string;
      score: number;
      description: string;
    }>;
    recommendations: string[];
  }> {
    const jurisdiction = this.jurisdictions.get(jurisdictionId);
    if (!jurisdiction) throw new Error('Jurisdiction not found');

    const settings = this.config.riskAssessmentSettings;
    const factors: Array<{ category: string; score: number; description: string }> = [];

    // Compliance level risk
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

    // Restrictions risk
    const restrictionScore = Math.min(jurisdiction.restrictions.length * 0.1, 1.0);
    factors.push({
      category: 'restrictions',
      score: restrictionScore,
      description: `${jurisdiction.restrictions.length} active restrictions`
    });

    // Tax complexity risk
    const taxComplexityScore = Math.min(
      (jurisdiction.taxInfo.filingRequirements.length * 0.1) +
      (jurisdiction.taxInfo.withholdingTax.length * 0.05),
      1.0
    );
    factors.push({
      category: 'tax_complexity',
      score: taxComplexityScore,
      description: `${jurisdiction.taxInfo.filingRequirements.length} filing requirements`
    });

    // Political stability (simplified)
    const politicalStabilityScore = this.getPoliticalStabilityScore(jurisdiction.code);
    factors.push({
      category: 'political_stability',
      score: politicalStabilityScore,
      description: 'Political stability assessment'
    });

    // Calculate weighted risk score
    const riskScore = 
      factors[0].score * settings.weightComplianceLevel +
      factors[1].score * settings.weightRestrictions +
      factors[2].score * settings.weightTaxComplexity +
      factors[3].score * settings.weightPoliticalStability;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';

    const recommendations = this.generateRiskRecommendations(jurisdiction, riskScore, factors);

    return {
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      factors,
      recommendations
    };
  }

  private getPoliticalStabilityScore(countryCode: string): number {
    // Simplified political stability scoring
    const stabilityScores: Record<string, number> = {
      'US': 0.2,
      'GB': 0.2,
      'SG': 0.15,
      'CH': 0.1,
      'DE': 0.2,
      'JP': 0.15,
      'CA': 0.15,
      'AU': 0.15
    };
    return stabilityScores[countryCode] || 0.5;
  }

  private generateRiskRecommendations(jurisdiction: Jurisdiction, riskScore: number, factors: Array<{ category: string; score: number; description: string }>): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 0.7) {
      recommendations.push('High-risk jurisdiction identified. Consider additional due diligence.');
      recommendations.push('Implement enhanced monitoring and reporting procedures.');
    } else if (riskScore >= 0.4) {
      recommendations.push('Medium-risk jurisdiction. Regular monitoring recommended.');
    }

    const highRiskFactors = factors.filter(f => f.score >= 0.7);
    highRiskFactors.forEach(factor => {
      switch (factor.category) {
        case 'compliance_level':
          recommendations.push('Review compliance requirements and implement necessary controls.');
          break;
        case 'restrictions':
          recommendations.push('Ensure all business restrictions are understood and followed.');
          break;
        case 'tax_complexity':
          recommendations.push('Engage tax experts for proper compliance and optimization.');
          break;
        case 'political_stability':
          recommendations.push('Monitor political developments and assess impact on operations.');
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Jurisdiction appears to have low risk. Maintain standard compliance procedures.');
    }

    return recommendations;
  }

  async getUpcomingDeadlines(daysAhead: number = 30): Promise<Array<{
    jurisdictionId: string;
    jurisdictionName: string;
    requirementId: string;
    requirementTitle: string;
    dueDate: Date;
    category: RegulationCategory;
  }>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const deadlines: Array<{
      jurisdictionId: string;
      jurisdictionName: string;
      requirementId: string;
      requirementTitle: string;
      dueDate: Date;
      category: RegulationCategory;
    }> = [];

    this.jurisdictions.forEach(jurisdiction => {
      jurisdiction.regulations.forEach(regulation => {
        regulation.requirements.forEach(requirement => {
          if (requirement.dueDate && 
              requirement.dueDate >= now && 
              requirement.dueDate <= futureDate &&
              requirement.implementationStatus !== 'completed') {
            deadlines.push({
              jurisdictionId: jurisdiction.id,
              jurisdictionName: jurisdiction.name,
              requirementId: requirement.id,
              requirementTitle: requirement.title,
              dueDate: requirement.dueDate,
              category: regulation.category
            });
          }
        });
      });
    });

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  private updateAnalytics(): void {
    const jurisdictions = Array.from(this.jurisdictions.values());

    this.analytics.totalJurisdictions = jurisdictions.length;
    this.analytics.activeJurisdictions = jurisdictions.filter(j => j.isActive).length;

    // By type
    this.analytics.jurisdictionsByType = {
      country: jurisdictions.filter(j => j.type === JurisdictionType.COUNTRY).length,
      state: jurisdictions.filter(j => j.type === JurisdictionType.STATE).length,
      province: jurisdictions.filter(j => j.type === JurisdictionType.PROVINCE).length,
      region: jurisdictions.filter(j => j.type === JurisdictionType.REGION).length,
      city: jurisdictions.filter(j => j.type === JurisdictionType.CITY).length,
      special_economic_zone: jurisdictions.filter(j => j.type === JurisdictionType.SPECIAL_ECONOMIC_ZONE).length,
      tax_haven: jurisdictions.filter(j => j.type === JurisdictionType.TAX_HAVEN).length
    };

    // By compliance level
    this.analytics.jurisdictionsByComplianceLevel = {
      low: jurisdictions.filter(j => j.complianceLevel === ComplianceLevel.LOW).length,
      medium: jurisdictions.filter(j => j.complianceLevel === ComplianceLevel.MEDIUM).length,
      high: jurisdictions.filter(j => j.complianceLevel === ComplianceLevel.HIGH).length,
      restricted: jurisdictions.filter(j => j.complianceLevel === ComplianceLevel.RESTRICTED).length
    };

    // Regulations
    const allRegulations = jurisdictions.flatMap(j => j.regulations);
    this.analytics.totalRegulations = allRegulations.length;
    this.analytics.activeRegulations = allRegulations.filter(r => r.status === 'active').length;

    // Upcoming deadlines
    this.analytics.upcomingDeadlines = this.getUpcomingDeadlines(30);

    // High risk jurisdictions
    this.analytics.highRiskJurisdictions = [];
    for (const jurisdiction of jurisdictions) {
      if (jurisdiction.isActive) {
        const riskAssessment = await this.assessJurisdictionRisk(jurisdiction.id);
        if (riskAssessment.riskScore >= 0.6) {
          this.analytics.highRiskJurisdictions.push({
            jurisdictionId: jurisdiction.id,
            name: jurisdiction.name,
            riskScore: riskAssessment.riskScore,
            riskFactors: riskAssessment.factors.map(f => f.description)
          });
        }
      }
    }
  }

  async getAnalytics(): Promise<JurisdictionAnalytics> {
    this.updateAnalytics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<JurisdictionConfig>): Promise<JurisdictionConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<JurisdictionConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalJurisdictions: number;
    activeJurisdictions: number;
    highRiskCount: number;
    upcomingDeadlines: number;
    lastUpdated: Date;
  }> {
    this.updateAnalytics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (this.analytics.highRiskJurisdictions.length > 5 || this.analytics.upcomingDeadlines.length > 20) {
      status = 'critical';
    } else if (this.analytics.highRiskJurisdictions.length > 2 || this.analytics.upcomingDeadlines.length > 10) {
      status = 'warning';
    }

    return {
      status,
      totalJurisdictions: this.analytics.totalJurisdictions,
      activeJurisdictions: this.analytics.activeJurisdictions,
      highRiskCount: this.analytics.highRiskJurisdictions.length,
      upcomingDeadlines: this.analytics.upcomingDeadlines.length,
      lastUpdated: new Date()
    };
  }
}
