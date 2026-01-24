import mongoose, { Document, Schema } from 'mongoose';

export enum RiskLevel {
    VERY_LOW = 'very_low',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    VERY_HIGH = 'very_high',
    CRITICAL = 'critical'
}

export enum RiskCategory {
    IDENTITY = 'identity',
    FINANCIAL = 'financial',
    BEHAVIORAL = 'behavioral',
    GEOGRAPHIC = 'geographic',
    TECHNICAL = 'technical',
    REPUTATIONAL = 'reputational',
    COMPLIANCE = 'compliance',
    OPERATIONAL = 'operational'
}

export enum RiskFactor {
    HIGH_RISK_COUNTRY = 'high_risk_country',
    SANCTIONED_COUNTRY = 'sanctioned_country',
    PEP = 'politically_exposed_person',
    ADVERSE_MEDIA = 'adverse_media',
    UNUSUAL_ACTIVITY = 'unusual_activity',
    MISMATCHED_DATA = 'mismatched_data',
    POOR_DOCUMENT_QUALITY = 'poor_document_quality',
    SUSPICIOUS_PATTERN = 'suspicious_pattern',
    HIGH_VALUE_TRANSACTION = 'high_value_transaction',
    RAPID_GROWTH = 'rapid_growth',
    MULTIPLE_IDENTITIES = 'multiple_identities',
    SHORT_TIME_FRAME = 'short_time_frame',
    STRUCTURED_TRANSACTIONS = 'structured_transactions',
    ROUND_NUMBERS = 'round_numbers',
    UNUSUAL_HOURS = 'unusual_hours',
    NEW_ACCOUNT = 'new_account',
    HIGH_RISK_INDUSTRY = 'high_risk_industry',
    CASH_INTENSIVE = 'cash_intensive',
    OFFSHORE_ENTITIES = 'offshore_entities',
    SHELL_COMPANIES = 'shell_companies'
}

export interface IRiskAssessment extends Document {
    userId: string;
    assessmentType: 'initial' | 'ongoing' | 'event_driven' | 'periodic';

    // Overall risk
    overallRiskLevel: RiskLevel;
    overallRiskScore: number; // 0-100

    // Category scores
    categoryScores: Record<RiskCategory, {
        score: number;
        level: RiskLevel;
        factors: RiskFactor[];
        weight: number;
    }>;

    // Risk factors
    identifiedFactors: Array<{
        id: string;
        factor: RiskFactor;
        category: RiskCategory;
        severity: string;
        score: number;
        weight: number;
        description: string;
        evidence: string[];
        detectedAt: Date;
        autoDetected: boolean;
        mitigated: boolean;
        mitigationNotes?: string;
    }>;

    // Mitigation measures
    mitigationMeasures: Array<{
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
    }>;

    // Recommendations
    recommendations: Array<{
        id: string;
        type: 'approve' | 'reject' | 'manual_review' | 'additional_checks' | 'enhanced_monitoring' | 'restrict';
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        confidence: number;
        impact: 'low' | 'medium' | 'high' | 'critical';
        timeframe: string;
        autoImplementable: boolean;
        implemented: boolean;
        implementedAt?: Date;
        result?: string;
    }>;

    // Assessment data
    assessmentData: {
        kycData?: any;
        transactionData?: any;
        behavioralData?: any;
        geographicData?: any;
        technicalData?: any;
        reputationData?: any;
    };

    // Review information
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;

    // Metadata
    metadata: Record<string, any>;
}

const RiskAssessmentSchema = new Schema<IRiskAssessment>({
    userId: { type: String, required: true, index: true },
    assessmentType: {
        type: String,
        enum: ['initial', 'ongoing', 'event_driven', 'periodic'],
        required: true
    },

    overallRiskLevel: {
        type: String,
        enum: Object.values(RiskLevel),
        default: RiskLevel.LOW
    },
    overallRiskScore: { type: Number, default: 0 },

    categoryScores: {
        type: Map, of: new Schema({
            score: Number,
            level: { type: String, enum: Object.values(RiskLevel) },
            factors: [{ type: String, enum: Object.values(RiskFactor) }],
            weight: Number
        })
    },

    identifiedFactors: [{
        id: String,
        factor: { type: String, enum: Object.values(RiskFactor) },
        category: { type: String, enum: Object.values(RiskCategory) },
        severity: String,
        score: Number,
        weight: Number,
        description: String,
        evidence: [String],
        detectedAt: { type: Date, default: Date.now },
        autoDetected: Boolean,
        mitigated: { type: Boolean, default: false },
        mitigationNotes: String
    }],

    mitigationMeasures: [{
        id: String,
        type: { type: String, enum: ['enhanced_monitoring', 'transaction_limits', 'additional_verification', 'manual_review', 'restriction', 'reporting'] },
        description: String,
        priority: String,
        status: String,
        assignedTo: String,
        dueDate: Date,
        completedAt: Date,
        result: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }],

    recommendations: [{
        id: String,
        type: String,
        title: String,
        description: String,
        priority: String,
        confidence: Number,
        impact: String,
        timeframe: String,
        autoImplementable: Boolean,
        implemented: { type: Boolean, default: false },
        implementedAt: Date,
        result: String
    }],

    assessmentData: {
        kycData: Schema.Types.Mixed,
        transactionData: Schema.Types.Mixed,
        behavioralData: Schema.Types.Mixed,
        geographicData: Schema.Types.Mixed,
        technicalData: Schema.Types.Mixed,
        reputationData: Schema.Types.Mixed
    },

    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,

    expiresAt: Date,

    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

// Indexes
RiskAssessmentSchema.index({ userId: 1, createdAt: -1 });
RiskAssessmentSchema.index({ overallRiskLevel: 1 });
RiskAssessmentSchema.index({ assessmentType: 1 });

export const RiskAssessment = mongoose.model<IRiskAssessment>('RiskAssessment', RiskAssessmentSchema);
