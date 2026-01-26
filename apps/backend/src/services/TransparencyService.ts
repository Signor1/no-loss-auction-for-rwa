import { Asset } from '../models/Asset';
import { AuditLog, AuditEventType } from '../models/AuditLog';
import { SmartContract } from '../models/SmartContract';

export class TransparencyService {

    async getPublicLedger(limit = 20) {
        // Fetch non-sensitive logs (e.g., successful transactions, bids)
        const logs = await AuditLog.find({
            eventType: { $in: [AuditEventType.USER_ACTION, AuditEventType.SYSTEM_EVENT] },
            status: 'success',
            severity: { $ne: 'CRITICAL' }
        })
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('timestamp action resource source hash');

        return logs;
    }

    async getAssetDisclosure(assetId: string) {
        const asset = await Asset.findById(assetId)
            .select('title description valuation ownership metadata documents status specifications');
        return asset;
    }

    async getFeeStructure() {
        // In a real app, this would fetch from a configuration model
        return {
            protocolFee: "0.5%",
            primarySaleFee: "2.5%",
            secondaryMarketFee: "1%",
            withdrawalFee: "0.25%",
            gasOptimized: true,
            lastUpdated: new Date()
        };
    }

    async getGovernanceTransparency() {
        // Combine smart contract status changes and protocol updates
        const contracts = await SmartContract.find().select('name address version status isEmergencyPausable lastPausedAt');
        const governanceLogs = await AuditLog.find({
            resource: { $in: ['smart_contract', 'compliance_rule', 'protocol_config'] }
        })
            .sort({ timestamp: -1 })
            .limit(10);

        return {
            activeContracts: contracts,
            recentGovernanceActions: governanceLogs
        };
    }
}
