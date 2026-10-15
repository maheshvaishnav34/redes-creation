import { trendsProvider } from './trends.provider.js';
import { trendsAnalyzer } from './trends.analyzer.js';
import { trendsScoring } from './trends.scoring.js';
import { trendsAi } from './trends.ai.js';
import { trendsForecaster } from './trends.forecaster.js';
import { query } from '../../config/db.js';

export const trendsController = {
  /**
   * 1. Trend Explorer (Full Deep-Dive)
   * GET /api/v1/trends/explore?q=keyword&geo=IN&timeframe=today 12-m&property=&category=0
   */
  async explore(req, res, next) {
    try {
      const q = req.query.q || req.query.keyword || 'artificial intelligence';
      const geo = req.query.geo || 'IN';
      const timeframe = req.query.timeframe || 'today 12-m';
      const property = req.query.property || '';
      const category = req.query.category || 0;
      const includeAi = req.query.ai !== 'false';

      // 1. Fetch live or cached data in parallel
      const [timelineRes, queriesRes, topicsRes, regionsRes] = await Promise.all([
        trendsProvider.getInterestOverTime({ keyword: q, geo, timeframe, property, category }),
        trendsProvider.getRelatedQueries({ keyword: q, geo, timeframe, property, category }),
        trendsProvider.getRelatedTopics({ keyword: q, geo, timeframe, property }),
        trendsProvider.getInterestByRegion({ keyword: q, geo, timeframe, property })
      ]);

      // 2. Statistical Analysis
      const analysis = trendsAnalyzer.analyzeTimeline(timelineRes.timeline, q);

      // 3. Opportunity Scoring
      const scoring = trendsScoring.calculateOpportunityScore({
        analysis,
        relatedQueries: queriesRes,
        regionsCount: regionsRes.regions?.length || 0
      });

      // 4. AI Insights (optional or on-demand)
      let aiInsights = null;
      if (includeAi) {
        aiInsights = await trendsAi.generateTrendInsights({
          keyword: q,
          geo,
          timeframe,
          analysis,
          relatedQueries: queriesRes,
          regions: regionsRes.regions || [],
          researchGoal: req.query.goal || 'SEO & Content Growth'
        });
      }

      // 5. Store search history in database (non-blocking)
      const workspaceId = req.headers['x-workspace-id'] || null;
      if (workspaceId) {
        try {
          await query(
            `INSERT INTO trend_searches (workspace_id, query, geo, timeframe, property, category, timeline_data, related_queries, related_topics, regional_data, summary_metrics, ai_insights)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              workspaceId, q, geo, timeframe, property, `${category}`,
              JSON.stringify(timelineRes.timeline.slice(-30)),
              JSON.stringify(queriesRes),
              JSON.stringify(topicsRes),
              JSON.stringify(regionsRes.regions.slice(0, 10)),
              JSON.stringify({ analysis, scoring }),
              JSON.stringify(aiInsights || {})
            ]
          );
        } catch (dbErr) {
          console.warn('[Trends Controller] Could not persist search history:', dbErr.message);
        }
      }

      res.json({
        success: true,
        keyword: q,
        geo,
        timeframe,
        property: property || 'web',
        timeline: timelineRes.timeline,
        analysis,
        opportunityScore: scoring,
        relatedQueries: queriesRes,
        relatedTopics: topicsRes,
        regions: regionsRes.regions,
        topRegion: regionsRes.topRegion,
        aiInsights,
        metadata: {
          scale: '0-100 Normalized Relative Search Interest',
          note: 'Google Trends reports relative index values, NOT absolute monthly search volumes or clicks.',
          retrievedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 2. Multi-Keyword Comparison
   * GET /api/v1/trends/compare?terms=chatgpt,claude,gemini&geo=IN&timeframe=today 3-m
   */
  async compare(req, res, next) {
    try {
      const termsParam = req.query.terms || 'chatgpt,claude,gemini';
      const terms = termsParam.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      const geo = req.query.geo || 'IN';
      const timeframe = req.query.timeframe || 'today 3-m';
      const property = req.query.property || '';

      if (terms.length < 2) {
        return res.status(400).json({ error: 'Please provide at least 2 comma-separated terms to compare.' });
      }

      const timelineRes = await trendsProvider.getInterestOverTime({
        keyword: terms,
        geo,
        timeframe,
        property
      });

      // Compute comparative statistics for each term
      const comparisons = terms.map(term => {
        const values = timelineRes.timeline.map(pt => Number(pt[term]) || 0);
        const avg = values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0;
        const peak = Math.max(...values, 0);
        const current = values[values.length - 1] || 0;
        return {
          term,
          averageInterest: avg,
          peakInterest: peak,
          currentInterest: current
        };
      }).sort((a, b) => b.averageInterest - a.averageInterest);

      const leader = comparisons[0];
      const runnerUp = comparisons[1];
      const ratio = runnerUp && runnerUp.averageInterest > 0 
        ? Number((leader.averageInterest / runnerUp.averageInterest).toFixed(1))
        : 1;

      res.json({
        success: true,
        terms,
        geo,
        timeframe,
        property: property || 'web',
        timeline: timelineRes.timeline,
        comparisons,
        insights: {
          leadingTerm: leader.term,
          leaderSummary: `"${leader.term}" dominates relative popularity with an average score of ${leader.averageInterest}/100 (~${ratio}x higher than "${runnerUp?.term || 'others'}").`,
          comparisonMethodology: 'Values represent normalized relative search interest compared concurrently against the highest single peak.'
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 3. Emerging & Daily Trending Searches (Live RSS Feed)
   * GET /api/v1/trends/emerging?geo=IN
   */
  async emerging(req, res, next) {
    try {
      const geo = req.query.geo || 'IN';
      const result = await trendsProvider.getDailyTrendingSearches(geo);
      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 4. Geographic Intelligence Breakdown
   * GET /api/v1/trends/regions?q=keyword&geo=IN
   */
  async regions(req, res, next) {
    try {
      const q = req.query.q || req.query.keyword || 'artificial intelligence';
      const geo = req.query.geo || 'IN';
      const timeframe = req.query.timeframe || 'today 12-m';
      const property = req.query.property || '';

      const regionsRes = await trendsProvider.getInterestByRegion({
        keyword: q,
        geo,
        timeframe,
        property
      });

      res.json({
        success: true,
        keyword: q,
        geo,
        ...regionsRes
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 5. YouTube Specific Research Workspace
   * GET /api/v1/trends/youtube?q=gaming&geo=IN
   */
  async youtubeResearch(req, res, next) {
    try {
      const q = req.query.q || req.query.keyword || 'tech review';
      const geo = req.query.geo || 'IN';
      const timeframe = req.query.timeframe || 'today 12-m';

      // Explicitly query with property: 'youtube'
      const [timelineRes, queriesRes] = await Promise.all([
        trendsProvider.getInterestOverTime({ keyword: q, geo, timeframe, property: 'youtube' }),
        trendsProvider.getRelatedQueries({ keyword: q, geo, timeframe, property: 'youtube' })
      ]);

      const analysis = trendsAnalyzer.analyzeTimeline(timelineRes.timeline, q);

      // Dedicated YouTube Title & Video Concepts generator
      const videoIdeas = [
        {
          title: `How to Master ${q} in 2026 (Beginner to Pro)`,
          format: 'Step-by-step Complete Tutorial',
          targetHook: 'Stop wasting time on outdated methods. Here is the modern approach.',
          tags: [q, `${q} tutorial`, `${q} guide 2026`],
          retentionStrategy: 'Deliver immediate value in first 30 seconds with summary scorecard.'
        },
        {
          title: `${q} vs The Competition: Honest Review & Comparison`,
          format: 'Comparison & Benchmark',
          targetHook: 'Before you spend your money or time, watch this side-by-side test.',
          tags: [q, `${q} review`, `${q} comparison`],
          retentionStrategy: 'Use split-screen visual charts and real examples.'
        },
        {
          title: `5 Secret ${q} Mistakes EVERYONE Makes (And How to Fix Them)`,
          format: 'High-CTR Problem Solver',
          targetHook: 'If you are seeing poor results, you are probably making mistake #3.',
          tags: [q, `${q} mistakes`, `${q} tips`],
          retentionStrategy: 'Fast-paced jump cuts with concrete solutions.'
        }
      ];

      res.json({
        success: true,
        keyword: q,
        property: 'youtube',
        geo,
        timeframe,
        timeline: timelineRes.timeline,
        analysis,
        risingQueries: queriesRes.rising,
        topQueries: queriesRes.top,
        videoIdeas,
        disclaimer: 'Data reflects Google Trends YouTube Search interest, not direct channel view counts or YouTube Studio metrics.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 6. Generate Custom AI Trend Insights
   * POST /api/v1/trends/ai-insights
   */
  async generateAiInsights(req, res, next) {
    try {
      const { keyword, geo = 'IN', timeframe = 'today 12-m', researchGoal = 'SEO & Content Growth' } = req.body;

      const [timelineRes, queriesRes, regionsRes] = await Promise.all([
        trendsProvider.getInterestOverTime({ keyword, geo, timeframe }),
        trendsProvider.getRelatedQueries({ keyword, geo, timeframe }),
        trendsProvider.getInterestByRegion({ keyword, geo, timeframe })
      ]);

      const analysis = trendsAnalyzer.analyzeTimeline(timelineRes.timeline, keyword);

      const aiInsights = await trendsAi.generateTrendInsights({
        keyword,
        geo,
        timeframe,
        analysis,
        relatedQueries: queriesRes,
        regions: regionsRes.regions || [],
        researchGoal
      });

      res.json({
        success: true,
        keyword,
        aiInsights
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 7. Watchlists Management
   * GET /api/v1/trends/watchlists
   */
  async getWatchlists(req, res, next) {
    try {
      const workspaceId = req.headers['x-workspace-id'] || null;
      let sql = 'SELECT * FROM trend_watchlists ORDER BY created_at DESC';
      const params = [];
      if (workspaceId) {
        sql = 'SELECT * FROM trend_watchlists WHERE workspace_id = $1 ORDER BY created_at DESC';
        params.push(workspaceId);
      }
      const result = await query(sql, params);
      res.json({ success: true, watchlists: result.rows });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/trends/watchlists
   */
  async addToWatchlist(req, res, next) {
    try {
      const workspaceId = req.headers['x-workspace-id'] || null;
      const { keyword, geo = 'IN', property = '', alertOnSpike = true, notes = '' } = req.body;

      if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      // Check current score
      const timelineRes = await trendsProvider.getInterestOverTime({ keyword, geo, timeframe: 'today 1-m', property });
      const analysis = trendsAnalyzer.analyzeTimeline(timelineRes.timeline, keyword);
      const currentScore = analysis.currentInterest || 50;

      const insertRes = await query(
        `INSERT INTO trend_watchlists (workspace_id, keyword, geo, property, current_score, previous_score, trend_status, alert_on_spike, notes)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8)
         RETURNING *`,
        [workspaceId, keyword, geo, property, currentScore, analysis.classification, alertOnSpike, notes]
      );

      res.json({ success: true, item: insertRes.rows[0] });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/trends/watchlists/:id
   */
  async deleteWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM trend_watchlists WHERE id = $1', [id]);
      res.json({ success: true, message: 'Removed from watchlist.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 8. Content Ideas / Calendar
   * GET /api/v1/trends/content-ideas
   */
  async getContentIdeas(req, res, next) {
    try {
      const workspaceId = req.headers['x-workspace-id'] || null;
      let sql = 'SELECT * FROM trend_content_ideas ORDER BY created_at DESC';
      const params = [];
      if (workspaceId) {
        sql = 'SELECT * FROM trend_content_ideas WHERE workspace_id = $1 ORDER BY created_at DESC';
        params.push(workspaceId);
      }
      const result = await query(sql, params);
      res.json({ success: true, ideas: result.rows });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/trends/content-ideas
   */
  async createContentIdea(req, res, next) {
    try {
      const workspaceId = req.headers['x-workspace-id'] || null;
      const { keyword, title, contentFormat = 'blog', targetPlatform = 'website', searchIntent = 'informational', outline = [], suggestedPublishDate = null } = req.body;

      const result = await query(
        `INSERT INTO trend_content_ideas (workspace_id, keyword, title, content_format, target_platform, search_intent, outline, suggested_publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [workspaceId, keyword, title, contentFormat, targetPlatform, searchIntent, JSON.stringify(outline), suggestedPublishDate]
      );

      res.json({ success: true, idea: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 9. AI Trend Prediction & Statistical Forecasting
   * GET /api/v1/trends/forecast?q=keyword&geo=IN&timeframe=today 12-m&horizon=30&model=holt_linear
   */
  async forecast(req, res, next) {
    try {
      const q = req.query.q || req.query.keyword || 'artificial intelligence';
      const geo = req.query.geo || 'IN';
      const timeframe = req.query.timeframe || 'today 12-m';
      const horizonDays = Number(req.query.horizon) || 30;
      const modelName = req.query.model || 'holt_linear';
      const workspaceId = req.headers['x-workspace-id'] || null;

      // 1. Fetch real historical timeline points
      const timelineRes = await trendsProvider.getInterestOverTime({
        keyword: q,
        geo,
        timeframe
      });

      // 2. Generate mathematical forecast with walk-forward backtesting
      const forecastResult = trendsForecaster.generateForecast({
        timeline: timelineRes.timeline,
        keyword: q,
        horizonDays,
        modelName
      });

      // 3. Persist forecast evaluation into PostgreSQL
      if (forecastResult.feasible) {
        try {
          await query(
            `INSERT INTO trend_forecasts (workspace_id, keyword, geo, timeframe, horizon_days, model_name, historical_points_used, forecast_points, evaluation_metrics, assumptions, limitations)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              workspaceId,
              q,
              geo,
              timeframe,
              horizonDays,
              modelName,
              forecastResult.trainingWindowPoints,
              JSON.stringify(forecastResult.forecastPoints),
              JSON.stringify(forecastResult.backtestMetrics || {}),
              JSON.stringify(forecastResult.assumptions || []),
              JSON.stringify(forecastResult.limitations || [])
            ]
          );

          if (forecastResult.backtestMetrics) {
            await query(
              `INSERT INTO trend_model_evaluations (model_name, horizon_days, keyword, geo, mae, rmse, smape, mase, train_points, test_points)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                modelName,
                horizonDays,
                q,
                geo,
                forecastResult.backtestMetrics.mae,
                forecastResult.backtestMetrics.rmse,
                parseFloat(forecastResult.backtestMetrics.smape) || 0,
                forecastResult.backtestMetrics.mase,
                Math.floor(forecastResult.trainingWindowPoints * 0.75),
                Math.ceil(forecastResult.trainingWindowPoints * 0.25)
              ]
            );
          }
        } catch (dbErr) {
          console.warn('[Trends Controller] Could not persist forecast run:', dbErr.message);
        }
      }

      res.json({
        success: true,
        keyword: q,
        geo,
        timeframe,
        historicalTimeline: timelineRes.timeline,
        forecast: forecastResult
      });
    } catch (err) {
      next(err);
    }
  }
};
