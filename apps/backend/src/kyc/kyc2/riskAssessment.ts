import { EventEmitter } from 'events';
import {
  RiskAssessment,
  IRiskAssessment,
  RiskLevel,
  RiskCategory,
  RiskFactor
} from '../models/RiskAssessment';
import { Document, Schema } from 'mongoose';

// Re-export enums
export { RiskLevel, RiskCategory, RiskFactor };

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RiskFactorInstance {
  id: string;
  factor: RiskFactor;
  category: RiskCategory;
  severity: RiskSeverity;
  score: number; // 0-100
  weight: number; // 0-1
  description: string;
  evidence: string[];
  detectedAt: Date;
  autoDetected: boolean;
  mitigated: boolean;
  mitigationNotes?: string;
}

export interface MitigationMeasure {
  id: string;
  type: 'enhanced_monitoring' | 'transaction_limits' | 'additional_verification' | 'manual_review' | 'restriction' | 'reporting';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskRecommendation {
  id: string;
  type: 'approve' | 'reject' | 'manual_review' | 'additional_checks' | 'enhanced_monitoring' | 'restrict';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  autoImplementable: boolean;
  implemented: boolean;
  implementedAt?: Date;
  result?: string;
}

export interface RiskModel {
  id: string;
  name: string;
  version: string;
  category: RiskCategory;
  description: string;

  // Model configuration
  factors: RiskFactorDefinition[];
  weights: Record<RiskFactor, number>;
  thresholds: {
    veryLow: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    critical: number;
  };

  // Model metadata
  isActive: boolean;
  trainedAt?: Date;
  accuracy?: number;
  precision?: number;
  recall?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskFactorDefinition {
  factor: RiskFactor;
  category: RiskCategory;
  description: string;
  dataType: 'boolean' | 'numeric' | 'categorical' | 'text';
  weight: number;
  threshold?: number;
  options?: string[];
  validation: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface RiskAssessmentConfig {
  enableAutoAssessment: boolean;
  enablePeriodicAssessment: boolean;
  periodicAssessmentInterval: number; // days
  enableEventDrivenAssessment: boolean;
  eventTriggers: string[];

  // Thresholds
  autoApproveThreshold: number;
  manualReviewThreshold: number;
  autoRejectThreshold: number;

  // Model settings
  defaultModels: Record<RiskCategory, string>;
  enableModelEnsemble: boolean;
  modelUpdateFrequency: number; // days

  // Monitoring settings
  enableContinuousMonitoring: boolean;
  monitoringInterval: number; // hours
  alertThresholds: {
    riskIncrease: number;
    newRiskFactors: number;
    rapidChanges: number;
  };

  // Data retention
  enableDataRetention: boolean;
  retentionPeriod: number; // days

  // Reporting
  enableReporting: boolean;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
  enableAuditLogging: boolean;
}

export class RiskAssessmentService extends EventEmitter {
  private models: Map<string, RiskModel> = new Map();
  private config: RiskAssessmentConfig;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config?: Partial<RiskAssessmentConfig>) {
    super();
    this.config = {
      enableAutoAssessment: true,
      enablePeriodicAssessment: true,
      periodicAssessmentInterval: 30,
      enableEventDrivenAssessment: true,
      eventTriggers: ['large_transaction', 'suspicious_activity', 'profile_change'],
      autoApproveThreshold: 20,
      manualReviewThreshold: 60,
      autoRejectThreshold: 85,
      defaultModels: {
        [RiskCategory.IDENTITY]: 'identity_v2',
        [RiskCategory.FINANCIAL]: 'financial_v1',
        [RiskCategory.BEHAVIORAL]: 'behavioral_v1',
        [RiskCategory.GEOGRAPHIC]: 'geographic_v1',
        [RiskCategory.TECHNICAL]: 'technical_v1',
        [RiskCategory.REPUTATIONAL]: 'reputational_v1',
        [RiskCategory.COMPLIANCE]: 'compliance_v1',
        [RiskCategory.OPERATIONAL]: 'operational_v1'
      },
      enableModelEnsemble: true,
      modelUpdateFrequency: 7,
      enableContinuousMonitoring: true,
      monitoringInterval: 24,
      alertThresholds: {
        riskIncrease: 20,
        newRiskFactors: 3,
        rapidChanges: 5
      },
      enableDataRetention: true,
      retentionPeriod: 2555, // 7 years
      enableReporting: true,
      reportingFrequency: 'daily',
      enableAuditLogging: true,
      ...config
    };

    this.initializeDefaultModels();
  }

  // Risk Assessment
  async assessRisk(
    userId: string,
    assessmentType: 'initial' | 'ongoing' | 'event_driven' | 'periodic',
    data: any
  ): Promise<IRiskAssessment> {
    const assessment = new RiskAssessment({
      userId,
      assessmentType,
      overallRiskLevel: RiskLevel.LOW,
      overallRiskScore: 0,
      categoryScores: {},
      identifiedFactors: [],
      mitigationMeasures: [],
      recommendations: [],
      assessmentData: data,
      metadata: {}
    });

    // Perform risk assessment for each category
    for (const category of Object.values(RiskCategory)) {
      const categoryScore = await this.assessCategoryRisk(category, data);
      assessment.categoryScores.set(category, categoryScore);
    }

    // Calculate overall risk score
    await this.calculateOverallRisk(assessment);

    // Generate recommendations
    await this.generateRecommendations(assessment);

    // Store assessment
    await assessment.save();

    this.emit('riskAssessed', assessment);
    return assessment;
  }

  async updateAssessment(
    assessmentId: string,
    updates: Partial<IRiskAssessment>
  ): Promise<IRiskAssessment> {
    const assessment = await RiskAssessment.findByIdAndUpdate(
      assessmentId,
      { $set: updates },
      { new: true }
    );

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    this.emit('assessmentUpdated', assessment);
    return assessment;
  }

  async getAssessment(assessmentId: string): Promise<IRiskAssessment | null> {
    return RiskAssessment.findById(assessmentId);
  }

  async getUserAssessments(
    userId: string,
    type?: string,
    limit = 50
  ): Promise<IRiskAssessment[]> {
    const query: any = { userId };
    if (type) query.assessmentType = type;

    return RiskAssessment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getLatestAssessment(userId: string): Promise<IRiskAssessment | null> {
    return RiskAssessment.findOne({ userId }).sort({ createdAt: -1 });
  }

  // Model Management
  async createModel(model: Omit<RiskModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskModel> {
    const modelId = this.generateId();
    const now = new Date();

    const newModel: RiskModel = {
      id: modelId,
      ...model,
      createdAt: now,
      updatedAt: now
    };

    this.models.set(modelId, newModel);
    this.emit('modelCreated', newModel);
    return newModel;
  }

  async updateModel(
    modelId: string,
    updates: Partial<RiskModel>
  ): Promise<RiskModel> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    Object.assign(model, updates);
    model.updatedAt = new Date();

    this.emit('modelUpdated', model);
    return model;
  }

  async getModel(modelId: string): Promise<RiskModel | null> {
    return this.models.get(modelId) || null;
  }

  async getModels(category?: RiskCategory): Promise<RiskModel[]> {
    let models = Array.from(this.models.values());

    if (category) {
      models = models.filter(m => m.category === category);
    }

    return models.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Mitigation Management
  async addMitigationMeasure(
    assessmentId: string,
    measure: Omit<MitigationMeasure, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MitigationMeasure> {
    const assessment = await RiskAssessment.findById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const mitigationId = this.generateId();
    const now = new Date();

    const mitigationMeasure: MitigationMeasure = {
      id: mitigationId,
      ...measure,
      createdAt: now,
      updatedAt: now
    };

    assessment.mitigationMeasures.push(mitigationMeasure);
    await assessment.save();

    this.emit('mitigationMeasureAdded', { assessment, measure: mitigationMeasure });
    return mitigationMeasure;
  }

  async updateMitigationMeasure(
    assessmentId: string,
    measureId: string,
    updates: Partial<MitigationMeasure>
  ): Promise<MitigationMeasure> {
    const assessment = await RiskAssessment.findById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const measure = assessment.mitigationMeasures.find(m => m.id === measureId);
    if (!measure) {
      throw new Error('Mitigation measure not found');
    }

    Object.assign(measure, updates);
    measure.updatedAt = new Date();
    await assessment.save();

    this.emit('mitigationMeasureUpdated', { assessment, measure });
    return measure;
  }

  // Risk Monitoring
  async startRiskMonitoring(): Promise<void> {
    if (this.config.enableContinuousMonitoring) {
      this.monitoringTimer = setInterval(() => {
        this.performRiskMonitoring();
      }, this.config.monitoringInterval * 60 * 60 * 1000);
    }

    this.emit('riskMonitoringStarted');
  }

  async stopRiskMonitoring(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    this.emit('riskMonitoringStopped');
  }

  // Private Methods
  private async assessCategoryRisk(
    category: RiskCategory,
    data: any
  ): Promise<any> {
    const modelName = this.config.defaultModels[category];
    const model = Array.from(this.models.values()).find(m => m.id === modelName);

    if (!model) {
      // Default assessment if no model found
      return {
        score: 25,
        level: RiskLevel.LOW,
        factors: [],
        weight: 0.125 // 1/8 for 8 categories
      };
    }

    // Calculate risk score using model
    const score = await this.calculateModelScore(model, data, category);
    const level = this.mapScoreToLevel(score, model.thresholds);
    const factors = await this.identifyRiskFactors(model, data, category);

    return {
      score,
      level,
      factors,
      weight: 0.125
    };
  }

  private async calculateModelScore(
    model: RiskModel,
    data: any,
    category: RiskCategory
  ): Promise<number> {
    let totalScore = 0;
    let totalWeight = 0;

    for (const factorDef of model.factors) {
      const factorScore = await this.evaluateFactor(factorDef, data);
      const weight = model.weights[factorDef.factor] || factorDef.weight;

      totalScore += factorScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private async evaluateFactor(
    factorDef: RiskFactorDefinition,
    data: any
  ): Promise<number> {
    // Placeholder for factor evaluation
    switch (factorDef.factor) {
      case RiskFactor.HIGH_RISK_COUNTRY:
        return data.geographicData?.highRiskCountry ? 80 : 10;
      case RiskFactor.PEP:
        return data.reputationData?.isPEP ? 90 : 5;
      case RiskFactor.ADVERSE_MEDIA:
        return data.reputationData?.adverseMediaCount > 0 ? 70 : 10;
      case RiskFactor.UNUSUAL_ACTIVITY:
        return data.behavioralData?.unusualActivityScore || 20;
      case RiskFactor.POOR_DOCUMENT_QUALITY:
        return data.kycData?.averageQuality < 70 ? 60 : 15;
      case RiskFactor.NEW_ACCOUNT:
        const daysSinceCreation = data.behavioralData?.daysSinceCreation || 0;
        return daysSinceCreation < 30 ? 40 : 10;
      default:
        return 25; // Default medium risk
    }
  }

  private async identifyRiskFactors(
    model: RiskModel,
    data: any,
    category: RiskCategory
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    for (const factorDef of model.factors) {
      const score = await this.evaluateFactor(factorDef, data);
      const threshold = factorDef.threshold || 50;

      if (score > threshold) {
        factors.push(factorDef.factor);
      }
    }

    return factors;
  }

  private async calculateOverallRisk(assessment: IRiskAssessment): Promise<void> {
    let totalScore = 0;
    let totalWeight = 0;

    // Convert Map to array for iteration if it's a Map in Mongoose (it is defined as Map in Schema)
    // However, when accessing via document, it behaves like a Map or POJO depending on Mongoose version/config.
    // Assuming standard Mongoose Map behavior:
    if (assessment.categoryScores instanceof Map) {
      for (const [category, scoreData] of assessment.categoryScores.entries()) {
        totalScore += scoreData.score * scoreData.weight;
        totalWeight += scoreData.weight;
      }
    } else {
      // Fallback if not Map
      for (const [category, scoreData] of Object.entries(assessment.categoryScores)) {
        totalScore += (scoreData as any).score * (scoreData as any).weight;
        totalWeight += (scoreData as any).weight;
      }
    }

    assessment.overallRiskScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    assessment.overallRiskLevel = this.mapScoreToLevel(assessment.overallRiskScore);
  }

  private mapScoreToLevel(
    score: number,
    thresholds?: RiskModel['thresholds']
  ): RiskLevel {
    const defaultThresholds = {
      veryLow: 20,
      low: 40,
      medium: 60,
      high: 80,
      veryHigh: 90,
      critical: 100
    };

    const th = thresholds || defaultThresholds;

    if (score <= th.veryLow) return RiskLevel.VERY_LOW;
    if (score <= th.low) return RiskLevel.LOW;
    if (score <= th.medium) return RiskLevel.MEDIUM;
    if (score <= th.high) return RiskLevel.HIGH;
    if (score <= th.veryHigh) return RiskLevel.VERY_HIGH;
    return RiskLevel.CRITICAL;
  }

  private async generateRecommendations(assessment: IRiskAssessment): Promise<void> {
    const recommendations: RiskRecommendation[] = [];

    // Auto-approve recommendation
    if (assessment.overallRiskScore <= this.config.autoApproveThreshold) {
      recommendations.push({
        id: this.generateId(),
        type: 'approve',
        title: 'Auto-approve',
        description: 'Risk score is within auto-approval threshold',
        priority: 'low',
        confidence: 95,
        impact: 'low',
        timeframe: 'immediate',
        autoImplementable: true,
        implemented: false
      });
    }

    // Manual review recommendation
    if (assessment.overallRiskScore > this.config.manualReviewThreshold) {
      recommendations.push({
        id: this.generateId(),
        type: 'manual_review',
        title: 'Manual Review Required',
        description: 'Risk score requires manual review',
        priority: 'high',
        confidence: 90,
        impact: 'medium',
        timeframe: '24 hours',
        autoImplementable: false,
        implemented: false
      });
    }

    // Auto-reject recommendation
    if (assessment.overallRiskScore >= this.config.autoRejectThreshold) {
      recommendations.push({
        id: this.generateId(),
        type: 'reject',
        title: 'Auto-reject',
        description: 'Risk score exceeds auto-rejection threshold',
        priority: 'critical',
        confidence: 95,
        impact: 'high',
        timeframe: 'immediate',
        autoImplementable: true,
        implemented: false
      });
    }

    // Update assessment with recommendations
    // using unknown cast to bypass strict typing if needed, but array push should match
    (assessment.recommendations as any) = recommendations;
  }

  private getFactorSeverity(factor: RiskFactor): RiskSeverity {
    const severityMap: Record<RiskFactor, RiskSeverity> = {
      [RiskFactor.SANCTIONED_COUNTRY]: RiskSeverity.CRITICAL,
      [RiskFactor.PEP]: RiskSeverity.HIGH,
      [RiskFactor.ADVERSE_MEDIA]: RiskSeverity.HIGH,
      [RiskFactor.SHELL_COMPANIES]: RiskSeverity.HIGH,
      [RiskFactor.OFFSHORE_ENTITIES]: RiskSeverity.MEDIUM,
      [RiskFactor.HIGH_RISK_COUNTRY]: RiskSeverity.MEDIUM,
      [RiskFactor.UNUSUAL_ACTIVITY]: RiskSeverity.MEDIUM,
      [RiskFactor.STRUCTURED_TRANSACTIONS]: RiskSeverity.MEDIUM,
      [RiskFactor.MULTIPLE_IDENTITIES]: RiskSeverity.HIGH,
      [RiskFactor.MISMATCHED_DATA]: RiskSeverity.MEDIUM,
      [RiskFactor.POOR_DOCUMENT_QUALITY]: RiskSeverity.LOW,
      [RiskFactor.SUSPICIOUS_PATTERN]: RiskSeverity.MEDIUM,
      [RiskFactor.HIGH_VALUE_TRANSACTION]: RiskSeverity.MEDIUM,
      [RiskFactor.RAPID_GROWTH]: RiskSeverity.LOW,
      [RiskFactor.SHORT_TIME_FRAME]: RiskSeverity.LOW,
      [RiskFactor.ROUND_NUMBERS]: RiskSeverity.LOW,
      [RiskFactor.UNUSUAL_HOURS]: RiskSeverity.LOW,
      [RiskFactor.NEW_ACCOUNT]: RiskSeverity.LOW,
      [RiskFactor.HIGH_RISK_INDUSTRY]: RiskSeverity.MEDIUM,
      [RiskFactor.CASH_INTENSIVE]: RiskSeverity.MEDIUM
    };

    return severityMap[factor] || RiskSeverity.LOW;
  }

  private async performRiskMonitoring(): Promise<void> {
    if (this.config.enablePeriodicAssessment) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.periodicAssessmentInterval);

      // In real implementation, we would query the database for users to check
      // For now, this would need an efficient way to find users needing assessment
      // Skipping heavy query implementation for this mock step
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private initializeDefaultModels(): void {
    // Initialize mocks
  }
}
