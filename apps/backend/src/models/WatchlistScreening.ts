import mongoose, { Document, Schema } from 'mongoose';

export enum WatchlistType {
    SANCTIONS = 'sanctions',
    PEP = 'pep',
    ADVERSE_MEDIA = 'adverse_media',
    BLOCKLIST = 'blocklist',
    CUSTOM = 'custom'
}

export enum ScreeningStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    MANUAL_REVIEW = 'manual_review'
}

export enum MatchLevel {
    NONE = 'none',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    EXACT = 'exact'
}

export enum WatchlistProvider {
    OFAC = 'ofac',
    UN_SANCTIONS = 'un_sanctions',
    EU_SANCTIONS = 'eu_sanctions',
    UK_SANCTIONS = 'uk_sanctions',
    WORLD_CHECK = 'world_check',
    DOW_JONES = 'dow_jones',
    COMPLY_ADVANTAGE = 'comply_advantage',
    REFINITIV = 'refinitiv',
    ACCENTURE = 'accenture',
    CUSTOM = 'custom'
}

export interface IWatchlistScreening extends Document {
    userId: string;
    entityType: 'individual' | 'business';

    // Search parameters
    name: string;
    aliases?: string[];
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    identificationNumbers?: Record<string, string>;

    // Configuration
    watchlistTypes: WatchlistType[];
    providers: WatchlistProvider[];
    priority: 'low' | 'medium' | 'high' | 'urgent';

    // Status
    status: ScreeningStatus;

    // Results
    result?: {
        totalMatches: number;
        matchesByLevel: Record<MatchLevel, number>;
        matchesByType: Record<WatchlistType, number>;
        matches: Array<{
            id: string;
            entityId: string;
            matchLevel: MatchLevel;
            confidenceScore: number;
            matchedFields: string[];
            differences: string[];
            explanation: string;
            requiresManualReview: boolean;
            reviewedBy?: string;
            reviewedAt?: Date;
            reviewDecision?: 'true_positive' | 'false_positive' | 'inconclusive';
            reviewNotes?: string;
        }>;
        riskScore: number;
        recommendations: string[];
        requiresManualReview: boolean;
        processedBy: WatchlistProvider[];
        errors?: string[];
    };

    // Timestamps
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WatchlistScreeningSchema = new Schema<IWatchlistScreening>({
    userId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['individual', 'business'], default: 'individual' },

    name: { type: String, required: true, index: true },
    aliases: [String],
    dateOfBirth: String,
    nationality: String,
    address: String,
    identificationNumbers: { type: Map, of: String },

    watchlistTypes: [{ type: String, enum: Object.values(WatchlistType) }],
    providers: [{ type: String, enum: Object.values(WatchlistProvider) }],
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

    status: {
        type: String,
        enum: Object.values(ScreeningStatus),
        default: ScreeningStatus.PENDING,
        index: true
    },

    result: {
        totalMatches: Number,
        matchesByLevel: { type: Map, of: Number },
        matchesByType: { type: Map, of: Number },
        matches: [{
            id: String,
            entityId: String,
            matchLevel: { type: String, enum: Object.values(MatchLevel) },
            confidenceScore: Number,
            matchedFields: [String],
            differences: [String],
            explanation: String,
            requiresManualReview: Boolean,
            reviewedBy: String,
            reviewedAt: Date,
            reviewDecision: { type: String, enum: ['true_positive', 'false_positive', 'inconclusive'] },
            reviewNotes: String
        }],
        riskScore: Number,
        recommendations: [String],
        requiresManualReview: Boolean,
        processedBy: [{ type: String, enum: Object.values(WatchlistProvider) }],
        errors: [String]
    },

    completedAt: Date
}, {
    timestamps: true
});

// Indexes
WatchlistScreeningSchema.index({ userId: 1, createdAt: -1 });
WatchlistScreeningSchema.index({ status: 1 });

export const WatchlistScreening = mongoose.model<IWatchlistScreening>('WatchlistScreening', WatchlistScreeningSchema);
