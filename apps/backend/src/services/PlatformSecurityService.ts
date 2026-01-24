import { EventEmitter } from 'events';
import { SecurityMetric, ISecurityMetric } from '../models/SecurityMetric';
import { KeyManagement, IKeyManagement } from '../models/KeyManagement';
import { AuditLog } from '../models/AuditLog';
import { MultiSigWallet } from '../models/MultiSigWallet';

export class PlatformSecurityService extends EventEmitter {

    constructor() {
        super();
        this.seedDefaultMetrics();
    }

    private async seedDefaultMetrics() {
        const metrics = [
            { category: 'encryption', name: 'Database At-Rest Encryption', value: true, status: 'healthy', details: 'AES-256 enabled' },
            { category: 'encryption', name: 'In-Transit TLS Termination', value: 'TLS 1.3', status: 'healthy', details: 'Strict-Transport-Security enabled' },
            { category: 'network', name: 'Firewall/WAF Status', value: 'Active', status: 'healthy', details: 'Cloudflare Proxy enabled' },
            { category: 'backup', name: 'Daily Backup Health', value: '100%', status: 'healthy', lastChecked: new Date() }
        ];

        for (const m of metrics) {
            await SecurityMetric.findOneAndUpdate({ category: m.category, name: m.name }, m, { upsert: true });
        }
    }

    // --- Encryption & Key Management ---

    async registerKey(data: Partial<IKeyManagement>): Promise<IKeyManagement> {
        const nextRotation = new Date(Date.now() + (data.rotationIntervalDays || 90) * 24 * 60 * 60 * 1000);
        const key = new KeyManagement({
            ...data,
            nextRotationAt: nextRotation
        });
        await key.save();
        return key;
    }

    async getKeys(): Promise<IKeyManagement[]> {
        return KeyManagement.find().sort({ lastRotatedAt: -1 });
    }

    // --- Multi-Signature Management ---

    async getMultiSigWallets(): Promise<any[]> {
        return MultiSigWallet.find();
    }

    // --- Consolidated Health ---

    async getSecurityHealthSummary(): Promise<any> {
        const metrics = await SecurityMetric.find();
        const keys = await KeyManagement.find({ status: 'active' });
        const recentAudits = await AuditLog.find().sort({ timestamp: -1 }).limit(5);

        return {
            overallStatus: metrics.every(m => m.status === 'healthy') ? 'secure' : 'warning',
            metrics,
            activeKeys: keys.length,
            recentAudits
        };
    }
}
