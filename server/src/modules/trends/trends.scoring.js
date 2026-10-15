/**
 * Google Trends Intelligence - Opportunity Scoring Engine
 * Transparent, multi-factor decision-support scoring (0–100 scale).
 * Note: Internal estimate, NOT an official Google metric.
 */

export const trendsScoring = {
  /**
   * Calculates explainable opportunity score from analysis, related queries, and data completeness.
   */
  calculateOpportunityScore({ analysis, relatedQueries = { top: [], rising: [] }, regionsCount = 0 }) {
    if (!analysis || analysis.classification === 'Insufficient Data') {
      return {
        overallScore: 25,
        rating: 'Low Potential',
        confidence: analysis?.confidence || 30,
        explanation: 'Insufficient historical search data to compute a confident opportunity score.',
        factors: [
          { name: 'Growth Momentum', score: 20, weight: 30, description: 'Limited historical trajectory data' },
          { name: 'Demand Stability', score: 30, weight: 20, description: 'Sparse search observations' },
          { name: 'Seasonality Window', score: 20, weight: 15, description: 'No clear seasonal recurrence found' },
          { name: 'Query Ecosystem', score: 20, weight: 15, description: 'Limited related queries' },
          { name: 'Content Feasibility', score: 40, weight: 20, description: 'Broad or unproven search intent' }
        ],
        methodology: 'Normalized weighted matrix combining velocity, stability, seasonality, and keyword density.'
      };
    }

    // 1. Growth Momentum (30% weight)
    let growthScore = 50;
    if (analysis.percentChange > 100) growthScore = 95;
    else if (analysis.percentChange > 40) growthScore = 85;
    else if (analysis.percentChange > 15) growthScore = 75;
    else if (analysis.percentChange > 0) growthScore = 60;
    else if (analysis.percentChange > -20) growthScore = 40;
    else growthScore = 20;

    // 2. Demand Stability (20% weight) - Rewards sustainability, penalizes fragile high volatility
    let stabilityScore = 70;
    if (analysis.volatilityRatio < 25) stabilityScore = 90;
    else if (analysis.volatilityRatio < 45) stabilityScore = 80;
    else if (analysis.volatilityRatio < 65) stabilityScore = 60;
    else stabilityScore = 35; // Wild spikes / unstable

    // 3. Seasonality Window (15% weight)
    let seasonalityScore = 50;
    if (analysis.isSeasonal) {
      seasonalityScore = 85; // High predictability
    } else if (analysis.classification === 'Rising' || analysis.classification === 'Emerging') {
      seasonalityScore = 75;
    }

    // 4. Query Ecosystem (15% weight) - Higher when there are breakout & top related queries
    const risingCount = relatedQueries.rising?.length || 0;
    const breakoutCount = (relatedQueries.rising || []).filter(q => q.isBreakout).length;
    let queryScore = 50;
    if (breakoutCount >= 3) queryScore = 95;
    else if (risingCount >= 10) queryScore = 85;
    else if (risingCount >= 4) queryScore = 70;
    else queryScore = 45;

    // 5. Content Feasibility & Geographic Reach (20% weight)
    let feasibilityScore = 65;
    if (regionsCount >= 15) feasibilityScore = 85;
    else if (regionsCount >= 5) feasibilityScore = 75;
    else feasibilityScore = 55;

    // Weighted Total
    const totalScore = Math.round(
      (growthScore * 0.30) +
      (stabilityScore * 0.20) +
      (seasonalityScore * 0.15) +
      (queryScore * 0.15) +
      (feasibilityScore * 0.20)
    );

    let rating = 'Moderate Potential';
    let explanation = 'Shows steady interest with reasonable content conversion opportunities.';

    if (totalScore >= 80) {
      rating = 'High Potential Opportunity';
      explanation = 'Strong upward search momentum backed by emerging breakout queries and wide geographic interest.';
    } else if (totalScore >= 65) {
      rating = 'Promising Opportunity';
      explanation = 'Solid interest base with favorable growth indicators and actionable keyword expansion.';
    } else if (totalScore < 45) {
      rating = 'Low or Declining Opportunity';
      explanation = 'Declining trend trajectory or high volatility poses higher risk for long-term SEO investment.';
    }

    return {
      overallScore: totalScore,
      rating,
      confidence: analysis.confidence,
      explanation,
      factors: [
        { name: 'Growth Momentum', score: growthScore, weight: 30, description: `${analysis.percentChange > 0 ? '+' : ''}${analysis.percentChange}% velocity vs historical baseline` },
        { name: 'Demand Stability', score: stabilityScore, weight: 20, description: `${analysis.volatilityRatio}% volatility ratio (${analysis.volatilityRatio < 45 ? 'low variance' : 'high fluctuation'})` },
        { name: 'Seasonality Window', score: seasonalityScore, weight: 15, description: analysis.isSeasonal ? 'Recurring seasonal demand cycle' : 'Evergreen / steady' },
        { name: 'Query Ecosystem', score: queryScore, weight: 15, description: `${risingCount} rising related queries (${breakoutCount} breakout)` },
        { name: 'Content Feasibility', score: feasibilityScore, weight: 20, description: `Supported across ${regionsCount} geographic sub-regions` }
      ],
      methodology: 'Transparent 5-factor weighted algorithm evaluating velocity, volatility, related query diversity, and regional demand.'
    };
  }
};
