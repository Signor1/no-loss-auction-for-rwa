import { EventEmitter } from 'events';
import { SmartContract, ISmartContract, ContractStatus } from '../models/SmartContract';
import { SecurityAudit, ISecurityAudit } from '../models/SecurityAudit';
import { BugBounty, IBugBounty } from '../models/BugBounty';

export class ContractSecurityService extends EventEmitter {

    constructor() {
        super();
    }

    // --- Contract Management ---

    async registerContract(data: Partial<ISmartContract>): Promise<ISmartContract> {
        const contract = new SmartContract(data);
        await contract.save();
        this.emit('contractRegistered', contract);
        return contract;
    }

    async getContracts(filters: any = {}): Promise<ISmartContract[]> {
        return SmartContract.find(filters).sort({ name: 1 });
    }

    async toggleEmergencyPause(contractId: string, userId: string, isPaused: boolean, reason?: string): Promise<ISmartContract | null> {
        const contract = await SmartContract.findById(contractId);
        if (!contract) throw new Error('Contract not found');

        if (!contract.isEmergencyPausable) throw new Error('Contract is not pausable via emergency procedures');

        contract.status = isPaused ? ContractStatus.PAUSED : ContractStatus.ACTIVE;
        if (isPaused) {
            contract.lastPausedAt = new Date();
            contract.pausedBy = userId;
            contract.metadata.set('pauseReason', reason);
        }

        await contract.save();
        this.emit('contractPauseToggled', { contractId, isPaused, userId, reason });
        return contract;
    }

    // --- Audit Tracking ---

    async addAuditReport(data: Partial<ISecurityAudit>): Promise<ISecurityAudit> {
        const audit = new SecurityAudit(data);
        await audit.save();
        this.emit('auditReportAdded', audit);
        return audit;
    }

    async getContractAudits(contractId: string): Promise<ISecurityAudit[]> {
        return SecurityAudit.find({ contractId }).sort({ auditDate: -1 });
    }

    // --- Bug Bounty ---

    async submitVulnerability(data: Partial<IBugBounty>): Promise<IBugBounty> {
        const report = new BugBounty(data);
        await report.save();
        this.emit('vulnerabilityReported', report);
        return report;
    }

    async getBountyReports(filters: any = {}): Promise<IBugBounty[]> {
        return BugBounty.find(filters).sort({ createdAt: -1 });
    }

    async updateFindingsStatus(reportId: string, status: IBugBounty['status'], notes?: string): Promise<IBugBounty | null> {
        const report = await BugBounty.findById(reportId);
        if (!report) return null;

        report.status = status;
        if (notes) report.metadata.set('remediationNotes', notes);

        await report.save();
        this.emit('bountyStatusUpdated', report);
        return report;
    }
}
