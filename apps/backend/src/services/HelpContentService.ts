import { HelpContent, IHelpContent, HelpContentType } from '../models/HelpContent';

export class HelpContentService {

    async getContentGrouped(type?: HelpContentType) {
        const query: any = { isActive: true };
        if (type) query.type = type;

        const contents = await HelpContent.find(query).sort({ order: 1, title: 1 });

        // Group by category if needed, or by type
        return contents;
    }

    async getBySlug(slug: string) {
        return HelpContent.findOne({ slug, isActive: true });
    }

    async searchContent(searchTerm: string) {
        return HelpContent.find(
            { $text: { $search: searchTerm }, isActive: true },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });
    }

    async seedInitialContent() {
        const count = await HelpContent.countDocuments();
        if (count > 0) return;

        const initialData = [
            {
                type: HelpContentType.GLOSSARY,
                category: 'Basics',
                title: 'Real World Assets (RWA)',
                slug: 'rwa-definition',
                content: 'RWA refers to physical or tangible assets that are tokenized and brought onto the blockchain.',
                order: 1
            },
            {
                type: HelpContentType.FAQ,
                category: 'Bidding',
                title: 'What is a no-loss auction?',
                slug: 'no-loss-faq',
                content: 'In a no-loss auction, your principal is returned if you do not win the bid. Only generated yield is typically used.',
                order: 1
            },
            {
                type: HelpContentType.GUIDE,
                category: 'Wallet',
                title: 'Connecting MetaMask',
                slug: 'metamask-guide',
                content: 'Step 1: Install MetaMask... Step 2: Switch to Base Network...',
                metadata: { difficulty: 'beginner' },
                order: 1
            },
            {
                type: HelpContentType.TUTORIAL,
                category: 'Participation',
                title: 'How to Place Your First Bid',
                slug: 'first-bid-tutorial',
                content: 'Watch this video to learn how to place your first bid on a RWA.',
                metadata: {
                    videoUrl: 'https://example.com/v/123',
                    difficulty: 'beginner'
                },
                order: 1
            },
            {
                type: HelpContentType.RISK_DISCLOSURE,
                category: 'Legal',
                title: 'General Investment Risk',
                slug: 'general-risk',
                content: 'Investing in RWAs carries inherent risks including liquidity risk and market volatility.',
                order: 1
            }
        ];

        for (const data of initialData) {
            await HelpContent.create(data);
        }
    }
}
