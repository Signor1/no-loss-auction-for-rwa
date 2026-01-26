import { EventEmitter } from 'events';
import { InvestorAccreditation, AccreditationStatus, AccreditationType } from '../models/InvestorAccreditation';
import { TransferRestriction, RestrictionType } from '../models/TransferRestriction';
import { Disclosure, DisclosureType } from '../models/Disclosure';
import { User } from '../models/User';
import { Asset } from '../models/Asset';

export class SecurityComplianceService extends EventEmitter {

    constructor() {
        super();
    }

    // --- Investor Accreditation ---

    async submitAccreditationRequest(userId: string, data: any): Promise<any> {
        const accreditation = new InvestorAccreditation({
            userId,
            ...data,
            status: AccreditationStatus.PENDING
        });
        await accreditation.save();
        this.emit('accreditationSubmitted', accreditation);
        return accreditation;
    }

    async getAccreditationStatus(userId: string): Promise<any> {
        return InvestorAccreditation.findOne({ userId });
    }

    async verifyInvestorAccreditation(accreditationId: string, reviewerId: string, decision: AccreditationStatus, notes?: string): Promise<any> {
        const accreditation = await InvestorAccreditation.findById(accreditationId);
        if (!accreditation) throw new Error('Accreditation not found');

        accreditation.status = decision;
        accreditation.lastReviewedBy = reviewerId;
        accreditation.lastReviewedAt = new Date();
        accreditation.reviewNotes = notes;

        if (decision === AccreditationStatus.APPROVED) {
            accreditation.accreditedAt = new Date();
            accreditation.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        }

        await accreditation.save();
        this.emit('accreditationVerified', accreditation);
        return accreditation;
    }

    // --- Transfer Restrictions ---

    async canInvestInAsset(userId: string, assetId: string): Promise<{ allowed: boolean; reason?: string }> {
        const user = await User.findById(userId);
        const asset = await Asset.findById(assetId);
        if (!user || !asset) return { allowed: false, reason: 'User or Asset not found' };

        // Find all active restrictions for this asset
        const restrictions = await TransferRestriction.find({ assetId, isActive: true });

        for (const restriction of restrictions) {
            if (restriction.exceptionUsers.includes(userId)) continue;

            switch (restriction.type) {
                case RestrictionType.LOCK_UP:
                    const now = new Date();
                    if (restriction.parameters.startDate && now < restriction.parameters.startDate) {
                        return { allowed: false, reason: 'Lock-up period has not started' };
                    }
                    if (restriction.parameters.endDate && now < restriction.parameters.endDate) {
                        return { allowed: false, reason: 'Lock-up period in effect' };
                    }
                    break;

                case RestrictionType.ACCREDITATION_REQUIRED:
                    const accreditation = await this.getAccreditationStatus(userId);
                    if (!accreditation || accreditation.status !== AccreditationStatus.APPROVED) {
                        return { allowed: false, reason: 'Investor accreditation required for this asset' };
                    }
                    break;

                case RestrictionType.JURISDICTION_BLOCK:
                    if (restriction.parameters.blockedJurisdictions?.includes(user.location?.country || '')) {
                        return { allowed: false, reason: 'Your jurisdiction is blocked for this asset' };
                    }
                    if (restriction.parameters.allowedJurisdictions?.length && !restriction.parameters.allowedJurisdictions.includes(user.location?.country || '')) {
                        return { allowed: false, reason: 'Your jurisdiction is not in the allowed list' };
                    }
                    break;
            }
        }

        return { allowed: true };
    }

    async addTransferRestriction(data: any): Promise<any> {
        const restriction = new TransferRestriction(data);
        await restriction.save();
        return restriction;
    }

    // --- Disclosures & Reporting ---

    async fileDisclosure(data: any): Promise<any> {
        const disclosure = new Disclosure({
            ...data,
            filingDate: new Date()
        });
        await disclosure.save();
        this.emit('disclosureFiled', disclosure);
        return disclosure;
    }

    async getAssetDisclosures(assetId: string, language?: string): Promise<any[]> {
        const query: any = { assetId };
        if (language) query.language = language;
        return Disclosure.find(query).sort({ filingDate: -1 });
    }
}
