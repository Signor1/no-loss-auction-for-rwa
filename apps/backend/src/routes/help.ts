import express from 'express';
import * as helpController from '../controllers/helpContentController';

const router = express.Router();

// Public Educational Content Endpoints
router.get('/content', helpController.getAllHelpContent);
router.get('/content/search', helpController.searchHelpContent);
router.get('/content/:slug', helpController.getHelpContentBySlug);
router.post('/seed', helpController.seedHelp); // Internal/Dev only usually

export default router;
