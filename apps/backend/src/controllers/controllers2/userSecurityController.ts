import { Request, Response } from 'express';
import { UserSecurityService } from '../services/UserSecurityService';

const securityService = new UserSecurityService();

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const secret = await securityService.generate2FASecret(req.user!);
        return res.json({
            secret: secret.base32,
            qrCode: secret.otpauth_url // In real app, generate QR image
        });
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const success = await securityService.verifyAndEnable2FA(req.user!.id, code);

        if (success) {
            return res.json({ success: true, message: '2FA enabled successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getRecoveryCodes = async (req: Request, res: Response) => {
    try {
        const user = await req.user!.model('User').findById(req.user!.id).select('+recoveryCodes');
        return res.json(user.recoveryCodes || []);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const checkUrl = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });

        const result = await securityService.checkUrlTransparency(url as string);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
