import mongoose, { Document, Schema } from 'mongoose';

export enum DocumentType {
    PASSPORT = 'passport',
    NATIONAL_ID = 'national_id',
    DRIVING_LICENSE = 'driving_license',
    RESIDENCE_PERMIT = 'residence_permit',
    VISA = 'visa',
    MILITARY_ID = 'military_id',
    TAX_ID = 'tax_id',
    SOCIAL_SECURITY = 'social_security',
    BIRTH_CERTIFICATE = 'birth_certificate',
    MARRIAGE_CERTIFICATE = 'marriage_certificate',
    DIVORCE_DECREE = 'divorce_decree',
    ADOPTION_PAPERS = 'adoption_papers',
    COURT_ORDER = 'court_order',
    UTILITY_BILL = 'utility_bill',
    BANK_STATEMENT = 'bank_statement',
    RENTAL_AGREEMENT = 'rental_agreement',
    EMPLOYMENT_VERIFICATION = 'employment_verification',
    INVOICE = 'invoice',
    CONTRACT = 'contract',
    OTHER = 'other'
}

export enum VerificationStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    NEEDS_REVIEW = 'needs_review',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    ERROR = 'error'
}

export enum DocumentQuality {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
    UNREADABLE = 'unreadable'
}

export enum FraudRisk {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface IKYCDocument extends Document {
    userId: string;
    type: DocumentType;
    category: 'identity' | 'address' | 'financial' | 'legal' | 'other';

    // Document metadata
    country: string;
    issuingAuthority: string;
    documentNumber: string;
    issueDate: Date;
    expiryDate?: Date;

    // File information
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileHash: string;

    // Images
    frontImage?: string;
    backImage?: string;
    selfie?: string;

    // Extracted data
    extractedData: {
        // Personal information
        firstName?: string;
        lastName?: string;
        middleName?: string;
        fullName?: string;
        dateOfBirth?: Date;
        placeOfBirth?: string;
        gender?: 'male' | 'female' | 'other';
        nationality?: string;

        // Document information
        documentNumber?: string;
        issueDate?: Date;
        expiryDate?: Date;
        issuingAuthority?: string;
        issuingCountry?: string;

        // Address information
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };

        // Physical characteristics
        height?: string;
        weight?: string;
        eyeColor?: string;
        hairColor?: string;
        distinguishingMarks?: string;

        // Machine readable data
        mrz?: string;
        barcode?: string;
        qrCode?: string;

        // Additional fields
        additionalFields: Record<string, any>;

        // Confidence scores
        fieldConfidence: Record<string, number>;
    };

    // Verification results
    verificationStatus: VerificationStatus;
    quality: DocumentQuality;
    authenticityScore: number;
    fraudRisk: FraudRisk;
    confidence: number;

    // Issues and warnings
    issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        field?: string;
        description: string;
        detectedAt: Date;
        autoDetected: boolean;
    }>;

    warnings: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        field?: string;
        description: string;
        detectedAt: Date;
        autoDetected: boolean;
    }>;

    // Verification steps
    verificationSteps: Array<{
        id: string;
        name: string;
        type: string;
        status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
        result?: any;
        confidence?: number;
        duration?: number;
        startedAt?: Date;
        completedAt?: Date;
        error?: string;
    }>;

    // Review information
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;

    // Timestamps
    uploadedAt: Date;
    processedAt?: Date;
    expiresAt?: Date;

    // Metadata
    metadata: Record<string, any>;
}

const KYCDocumentSchema = new Schema<IKYCDocument>({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(DocumentType), required: true },
    category: { type: String, enum: ['identity', 'address', 'financial', 'legal', 'other'], required: true },

    country: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    documentNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },

    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    fileHash: { type: String, required: true },

    frontImage: { type: String },
    backImage: { type: String },
    selfie: { type: String },

    extractedData: {
        firstName: String,
        lastName: String,
        middleName: String,
        fullName: String,
        dateOfBirth: Date,
        placeOfBirth: String,
        gender: { type: String, enum: ['male', 'female', 'other'] },
        nationality: String,

        documentNumber: String,
        issueDate: Date,
        expiryDate: Date,
        issuingAuthority: String,
        issuingCountry: String,

        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String
        },

        height: String,
        weight: String,
        eyeColor: String,
        hairColor: String,
        distinguishingMarks: String,

        mrz: String,
        barcode: String,
        qrCode: String,

        additionalFields: { type: Map, of: Schema.Types.Mixed },
        fieldConfidence: { type: Map, of: Number }
    },

    verificationStatus: {
        type: String,
        enum: Object.values(VerificationStatus),
        default: VerificationStatus.PENDING,
        index: true
    },
    quality: {
        type: String,
        enum: Object.values(DocumentQuality),
        default: DocumentQuality.GOOD
    },
    authenticityScore: { type: Number, default: 0 },
    fraudRisk: {
        type: String,
        enum: Object.values(FraudRisk),
        default: FraudRisk.LOW
    },
    confidence: { type: Number, default: 0 },

    issues: [{
        type: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        field: String,
        description: { type: String, required: true },
        detectedAt: { type: Date, default: Date.now },
        autoDetected: { type: Boolean, default: true }
    }],

    warnings: [{
        type: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
        field: String,
        description: { type: String, required: true },
        detectedAt: { type: Date, default: Date.now },
        autoDetected: { type: Boolean, default: true }
    }],

    verificationSteps: [{
        id: String,
        name: String,
        type: String,
        status: String,
        result: Schema.Types.Mixed,
        confidence: Number,
        duration: Number,
        startedAt: Date,
        completedAt: Date,
        error: String
    }],

    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,

    uploadedAt: { type: Date, default: Date.now },
    processedAt: Date,
    expiresAt: Date,

    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

// Indexes
KYCDocumentSchema.index({ userId: 1, type: 1 });
KYCDocumentSchema.index({ verificationStatus: 1 });
KYCDocumentSchema.index({ 'extractedData.documentNumber': 1 });

export const KYCDocument = mongoose.model<IKYCDocument>('KYCDocument', KYCDocumentSchema);
