import { Router } from 'express';
import { trendsController } from './trends.controller.js';

const router = Router();

// 1. Core Trend Explorer
router.get('/explore', trendsController.explore);

// 2. Multi-Keyword Comparison
router.get('/compare', trendsController.compare);

// 3. Emerging & Daily Trends (Live Google RSS)
router.get('/emerging', trendsController.emerging);

// 4. Geographic Intelligence
router.get('/regions', trendsController.regions);

// 5. YouTube Research Workspace
router.get('/youtube', trendsController.youtubeResearch);

// 6. AI Insights Generation
router.post('/ai-insights', trendsController.generateAiInsights);

// 6b. AI Trend Prediction & Forecasting Engine (Holt-Statistical + Rolling Backtest)
router.get('/forecast', trendsController.forecast);

// 7. Watchlists Management
router.get('/watchlists', trendsController.getWatchlists);
router.post('/watchlists', trendsController.addToWatchlist);
router.delete('/watchlists/:id', trendsController.deleteWatchlist);

// 8. Content Ideas & Calendar
router.get('/content-ideas', trendsController.getContentIdeas);
router.post('/content-ideas', trendsController.createContentIdea);

export default router;
