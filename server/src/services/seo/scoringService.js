/**
 * Transparent Local & Technical SEO Scoring Engine
 * 
 * Score Calculation Rules:
 * - Starting Base Score: 100 points
 * - Critical Issues: -15 points each (e.g. missing H1, missing title, noindex tag, missing LocalBusiness schema)
 * - Warning Issues: -5 points each (e.g. title too long/short, missing canonical, suboptimal meta description, missing alt tags)
 * - Minimum Floor: 10 points
 * 
 * Category Weighting breakdown:
 * - Technical Health (HTTP, Robots, Viewport, Canonical): 30%
 * - On-Page Content (Title, Meta Description, H1, Alt text): 35%
 * - Local Signals (LocalBusiness JSON-LD, NAP, Phone): 35%
 * 
 * Note: This score is a diagnostic technical audit score based on documented web best practices.
 * It is NOT an official Google ranking score and does not guarantee ranking positions.
 */

export function calculateSeoScore(issues = []) {
  let technicalDeductions = 0;
  let contentDeductions = 0;
  let localDeductions = 0;

  for (const issue of issues) {
    let penalty = 0;
    if (issue.severity === 'critical') penalty = 15;
    else if (issue.severity === 'warning') penalty = 5;

    if (issue.category === 'technical') technicalDeductions += penalty;
    else if (issue.category === 'meta' || issue.category === 'content') contentDeductions += penalty;
    else if (issue.category === 'local') localDeductions += penalty;
  }

  const technicalScore = Math.max(10, Math.min(100, 100 - technicalDeductions));
  const contentScore = Math.max(10, Math.min(100, 100 - contentDeductions));
  const localSignalsScore = Math.max(10, Math.min(100, 100 - localDeductions));

  // Weighted overall score
  const overallScore = Math.round(
    technicalScore * 0.30 +
    contentScore * 0.35 +
    localSignalsScore * 0.35
  );

  return {
    overallScore,
    technicalScore,
    contentScore,
    localSignalsScore,
    methodology: {
      basis: 'Deterministic technical rule engine based on Google Search Central guidelines and Schema.org standards',
      weights: {
        technical: '30%',
        content: '35%',
        localSignals: '35%',
      },
      disclaimer: 'This score is a diagnostic health metric for web development optimization. It does not represent an official Google PageRank or guaranteed search engine placement.',
    },
  };
}
