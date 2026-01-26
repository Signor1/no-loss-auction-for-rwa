import mongoose, { Document, Schema } from 'mongoose';

export enum HelpContentType {
    FAQ = 'faq',
    GUIDE = 'guide',
    GLOSSARY = 'glossary',
    TUTORIAL = 'tutorial',
    RISK_DISCLOSURE = 'risk_disclosure',
    BEST_PRACTICE = 'best_practice'
}

export interface IHelpContent extends Document {
    type: HelpContentType;
    category: string;
    title: string;
    slug: string;
    content: string; // Markdown supported
    summary?: string;
    order: number;
    tags: string[];
    metadata: {
        videoUrl?: string;
        thumbnail?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HelpContentSchema = new Schema<IHelpContent>({
    type: { type: String, enum: Object.values(HelpContentType), required: true, index: true },
    category: { type: String, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    summary: String,
    order: { type: Number, default: 0 },
    tags: [String],
    metadata: {
        videoUrl: String,
        thumbnail: String,
        difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

HelpContentSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const HelpContent = mongoose.model<IHelpContent>('HelpContent', HelpContentSchema);
