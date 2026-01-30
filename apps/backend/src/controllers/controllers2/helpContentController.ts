import { Request, Response } from 'express';
import { HelpContentService } from '../services/HelpContentService';
import { HelpContentType } from '../models/HelpContent';

const helpService = new HelpContentService();

export const getAllHelpContent = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as HelpContentType;
        const contents = await helpService.getContentGrouped(type);
        res.json(contents);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getHelpContentBySlug = async (req: Request, res: Response) => {
    try {
        const content = await helpService.getBySlug(req.params.slug);
        if (!content) return res.status(404).json({ error: 'Content not found' });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const searchHelpContent = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        if (!query) return res.status(400).json({ error: 'Search query required' });
        const results = await helpService.searchContent(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const seedHelp = async (req: Request, res: Response) => {
    try {
        await helpService.seedInitialContent();
        res.json({ message: 'Seeded successfully' });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
