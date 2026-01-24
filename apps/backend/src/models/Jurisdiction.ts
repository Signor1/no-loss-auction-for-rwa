import mongoose, { Document, Schema } from 'mongoose';

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

export interface IJurisdiction extends Document {
    name: string;
    code: string; // ISO 3166-1 alpha-2/3
    type: JurisdictionType;
    parentJurisdiction?: string;
    complianceLevel: ComplianceLevel;
    isActive: boolean;
    regulations: Array<{
        id: string;
        name: string;
        category: RegulationCategory;
        description: string;
        effectiveDate: Date;
        expiryDate?: Date;
        status: 'active' | 'draft' | 'superseded' | 'repealed';
        requirements: Array<{
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
        }>;
        penalties: Array<{
            type: 'fine' | 'imprisonment' | 'license_suspension' | 'business_closure' | 'other';
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            minimumAmount?: number;
            maximumAmount?: number;
            currency?: string;
            imprisonmentTerm?: string;
        }>;
        authority: string;
        documentationUrl?: string;
        lastReviewed: Date;
    }>;
    restrictions: Array<{
        id: string;
        type: 'business_activity' | 'service_type' | 'customer_type' | 'transaction_type' | 'data_flow';
        category: string;
        description: string;
        isProhibited: boolean;
        requiresLicense: boolean;
        conditions: Array<{
            field: string;
            operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
            value: any;
            description: string;
        }>;
        effectiveDate: Date;
        expiryDate?: Date;
    }>;
    taxInfo: {
        corporateTaxRate: number;
        vatRate: number;
        withholdingTax: Array<{
            type: 'dividends' | 'interest' | 'royalties' | 'services';
            rate: number;
            conditions?: string[];
        }>;
        taxTreaties: Array<{
            country: string;
            effectiveDate: Date;
            benefits: string[];
            withholdingTaxReduction: Array<{
                type: 'dividends' | 'interest' | 'royalties' | 'services';
                rate: number;
                conditions?: string[];
            }>;
        }>;
        filingRequirements: Array<{
            type: string;
            frequency: 'monthly' | 'quarterly' | 'annually';
            dueDate: string; // MM-DD format
            forms: string[];
            authority: string;
        }>;
        taxResidencyRules: string[];
        exchangeOfInformation: boolean;
        fatcaCrsCompliant: boolean;
    };
    metadata: Record<string, any>;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const JurisdictionSchema = new Schema<IJurisdiction>({
    name: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: Object.values(JurisdictionType), required: true },
    parentJurisdiction: { type: String },
    complianceLevel: { type: String, enum: Object.values(ComplianceLevel), default: ComplianceLevel.MEDIUM },
    isActive: { type: Boolean, default: true },

    regulations: [{
        id: String,
        name: String,
        category: { type: String, enum: Object.values(RegulationCategory) },
        description: String,
        effectiveDate: Date,
        expiryDate: Date,
        status: { type: String, enum: ['active', 'draft', 'superseded', 'repealed'] },
        requirements: [{
            id: String,
            title: String,
            description: String,
            type: { type: String, enum: ['mandatory', 'recommended', 'conditional'] },
            category: String,
            dueDate: Date,
            evidenceRequired: Boolean,
            automatedCheck: Boolean,
            implementationStatus: { type: String, enum: ['not_started', 'in_progress', 'completed', 'exempt'] },
            assignedTo: String,
            notes: String
        }],
        penalties: [{
            type: { type: String, enum: ['fine', 'imprisonment', 'license_suspension', 'business_closure', 'other'] },
            description: String,
            severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            minimumAmount: Number,
            maximumAmount: Number,
            currency: String,
            imprisonmentTerm: String
        }],
        authority: String,
        documentationUrl: String,
        lastReviewed: Date
    }],

    restrictions: [{
        id: String,
        type: { type: String, enum: ['business_activity', 'service_type', 'customer_type', 'transaction_type', 'data_flow'] },
        category: String,
        description: String,
        isProhibited: Boolean,
        requiresLicense: Boolean,
        conditions: [{
            field: String,
            operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
            value: Schema.Types.Mixed,
            description: String
        }],
        effectiveDate: Date,
        expiryDate: Date
    }],

    taxInfo: {
        corporateTaxRate: Number,
        vatRate: Number,
        withholdingTax: [{
            type: { type: String, enum: ['dividends', 'interest', 'royalties', 'services'] },
            rate: Number,
            conditions: [String]
        }],
        taxTreaties: [{
            country: String,
            effectiveDate: Date,
            benefits: [String],
            withholdingTaxReduction: [{
                type: { type: String, enum: ['dividends', 'interest', 'royalties', 'services'] },
                rate: Number,
                conditions: [String]
            }]
        }],
        filingRequirements: [{
            type: String,
            frequency: { type: String, enum: ['monthly', 'quarterly', 'annually'] },
            dueDate: String,
            forms: [String],
            authority: String
        }],
        taxResidencyRules: [String],
        exchangeOfInformation: Boolean,
        fatcaCrsCompliant: Boolean
    },

    metadata: { type: Map, of: Schema.Types.Mixed },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

JurisdictionSchema.index({ 'regulations.category': 1 });
JurisdictionSchema.index({ complianceLevel: 1 });

export const Jurisdiction = mongoose.model<IJurisdiction>('Jurisdiction', JurisdictionSchema);
