import { prisma } from '../config/database.js';
import { crawlUrl } from '../services/seo/crawlerService.js';
import { runTechnicalSeoChecks } from '../services/seo/technicalChecks.js';
import { calculateSeoScore } from '../services/seo/scoringService.js';

export const seoController = {
  /**
   * Executes a website audit: POST /api/seo/audits
   */
  async runAudit(req, res, next) {
    try {
      const { url, businessId, businessLocationId } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'Missing URL',
          message: 'Website URL is required to run SEO audit.',
        });
      }

      const targetId = businessId || businessLocationId;

      // 1. Crawl URL with SSRF protection
      const crawlResult = await crawlUrl(url);

      // 2. Run Technical SEO Checks
      const checkResults = await runTechnicalSeoChecks({
        targetUrl: crawlResult.finalUrl,
        html: crawlResult.html,
        statusCode: crawlResult.statusCode,
      });

      // 3. Calculate Transparent SEO Diagnostic Scores
      const scoring = calculateSeoScore(checkResults.issues);

      // 4. Persist Audit in PostgreSQL via Prisma
      const savedAudit = await prisma.sEOAudit.create({
        data: {
          business_id: targetId || null,
          overallScore: scoring.overallScore,
          localSignalsScore: scoring.localSignalsScore,
          contentScore: scoring.contentScore,
          gbp_score: scoring.technicalScore,
          review_score: 85,
          status: 'completed',
          completed_at: new Date(),
        },
      });

      // Store individual checks/issues in seo_checks table
      for (const iss of checkResults.issues) {
        await prisma.seo_checks.create({
          data: {
            seo_audits: { connect: { id: savedAudit.id } },
            category: iss.category,
            check_name: iss.title,
            status: iss.severity === 'passed' ? 'pass' : iss.severity === 'warning' ? 'warning' : 'fail',
            severity: iss.severity,
            why_it_matters: iss.description,
            recommendation: iss.fixRecommendation || 'Passed successfully.',
            evidence: iss.evidence || null,
          },
        });
      }

      res.status(201).json({
        success: true,
        auditId: savedAudit.id,
        url: crawlResult.finalUrl,
        scores: scoring,
        summary: {
          title: checkResults.title,
          metaDescription: checkResults.metaDesc,
          h1: checkResults.h1,
          canonical: checkResults.canonical,
          totalIssues: checkResults.issues.length,
          criticalCount: checkResults.issues.filter((i) => i.severity === 'critical').length,
          warningCount: checkResults.issues.filter((i) => i.severity === 'warning').length,
          passedCount: checkResults.issues.filter((i) => i.severity === 'passed').length,
        },
        issues: checkResults.issues,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves single audit: GET /api/seo/audits/:auditId
   */
  async getAuditById(req, res, next) {
    try {
      const { auditId } = req.params;

      const audit = await prisma.sEOAudit.findUnique({
        where: { id: auditId },
        include: {
          seo_checks: true,
          business_locations: {
            select: { id: true, name: true, website: true },
          },
        },
      });

      if (!audit) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'SEO audit report not found.',
        });
      }

      res.json({
        success: true,
        audit: {
          id: audit.id,
          businessName: audit.business_locations?.name || null,
          website: audit.business_locations?.website || null,
          overallScore: audit.overallScore,
          technicalScore: audit.gbp_score,
          contentScore: audit.contentScore,
          localSignalsScore: audit.localSignalsScore,
          status: audit.status,
          createdAt: audit.createdAt,
          checks: audit.seo_checks,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Search Console Properties: GET /api/search-console/properties
   */
  async getSearchConsoleProperties(req, res, next) {
    try {
      res.json({
        success: true,
        connected: false,
        properties: [],
        message: 'Google Search Console property integration available upon authorizing Search Console permissions.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Search Console Performance: GET /api/search-console/performance
   */
  async getSearchConsolePerformance(req, res, next) {
    try {
      res.json({
        success: true,
        connected: false,
        performance: null,
        message: 'Connect Google Search Console to retrieve measured search clicks, impressions, and CTR data.',
      });
    } catch (err) {
      next(err);
    }
  },
};
