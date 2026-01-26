import { Request, Response } from 'express';
import { User } from '../models/User';

export const getOnboardingProgress = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user!.id).select('onboarding');
        res.json(user?.onboarding || { status: 'new', completedSteps: [], lastStep: '' });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const updateOnboardingProgress = async (req: Request, res: Response) => {
    try {
        const { status, step, completed } = req.body;
        const user = await User.findById(req.user!.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (status) user.onboarding.status = status;
        if (step) user.onboarding.lastStep = step;
        if (completed && !user.onboarding.completedSteps.includes(completed)) {
            user.onboarding.completedSteps.push(completed);
        }

        await user.save();
        res.json({ success: true, onboarding: user.onboarding });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const completeOnboarding = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user!.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.onboarding.status = 'completed';
        await user.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
