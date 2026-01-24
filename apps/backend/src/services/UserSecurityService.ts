import { EventEmitter } from 'events';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { ThreatIntelligence, ThreatType } from '../models/ThreatIntelligence';

export class UserSecurityService extends EventEmitter {

    constructor() {
        super();
    }

    // --- Two-Factor Authentication (TOTP) ---

    async generate2FASecret(user: IUser) {
        // Mocking speakeasy structure
        const secret = {
            base32: crypto.randomBytes(20).toString('hex').substr(0, 32),
            otpauth_url: `otpauth://totp/NoLossAuction:${user.email}?secret=MOCK_SECRET&issuer=NoLossAuction`
        };

        await User.findByIdAndUpdate(user.id, { twoFactorSecret: secret.base32 });
        return secret;
    }

    async verifyAndEnable2FA(userId: string, code: string): Promise<boolean> {
        // In a real app we'd use speakeasy.totp.verify()
        // Simulating success for valid-looking 6 digit codes for demo
        if (!/^\d{6}$/.test(code)) return false;

        const user = await User.findById(userId).select('+twoFactorSecret');
        if (!user || !user.twoFactorSecret) return false;

        user.twoFactorEnabled = true;
        // Generate recovery codes
        user.recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
        await user.save();

        this.emit('2faEnabled', { userId });
        return true;
    }

    // --- Account Recovery ---

    async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
        const user = await User.findById(userId).select('+recoveryCodes');
        if (!user) return false;

        const index = user.recoveryCodes.indexOf(code);
        if (index === -1) return false;

        // Consume the code
        user.recoveryCodes.splice(index, 1);
        await user.save();

        this.emit('recoveryCodeUsed', { userId });
        return true;
    }

    // --- Phishing Protection ---

    async checkUrlTransparency(url: string): Promise<{ safe: boolean; threat?: string }> {
        try {
            const domain = new URL(url).hostname;
            const threat = await ThreatIntelligence.findOne({
                value: domain,
                type: ThreatType.PHISHING_DOMAIN,
                isActive: true
            });

            if (threat) {
                return { safe: false, threat: threat.description };
            }
            return { safe: true };
        } catch (e) {
            return { safe: true }; // Not a valid URL or not in list
        }
    }

    async monitorSuspiciousActivity(userId: string, activity: any) {
        // Logic for detecting unusual login patterns or rapid transaction bursts
        this.emit('suspiciousActivityDetected', { userId, activity });
    }
}
