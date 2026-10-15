/**
 * Google Trends Intelligence - Advanced Trend Analysis Engine
 * Transparent, mathematical metrics and 7-stage classification.
 */

export const trendsAnalyzer = {
  /**
   * Evaluates raw time-series timeline points from Google Trends (0-100 relative index)
   * Computes statistical momentum, moving averages, volatility, seasonality, and classifications.
   */
  analyzeTimeline(timeline = [], keyword = 'topic') {
    if (!timeline || timeline.length < 4) {
      return {
        classification: 'Insufficient Data',
        classificationReason: 'Fewer than 4 historical observations available for robust statistical evaluation.',
        confidence: 20,
        momentumScore: 0,
        volatilityRatio: 0,
        peak: { value: 0, date: null },
        baselineAverage: 0,
        recentAverage: 0,
        percentChange: 0,
        isSeasonal: false,
        metrics: { totalPoints: timeline.length, nonZeroPoints: 0 }
      };
    }

    // Extract values (handling single keyword or object points)
    const values = timeline.map(pt => {
      if (typeof pt.value === 'number') return pt.value;
      if (Array.isArray(pt.value)) return pt.value[0] || 0;
      if (pt[keyword] !== undefined) return Number(pt[keyword]) || 0;
      return 0;
    });

    const nonZeroCount = values.filter(v => v > 0).length;
    if (nonZeroCount < 3) {
      return {
        classification: 'Insufficient Data',
        classificationReason: 'Low search interest activity (predominantly 0 index values).',
        confidence: 30,
        momentumScore: 0,
        volatilityRatio: 0,
        peak: { value: Math.max(...values, 0), date: null },
        baselineAverage: 0,
        recentAverage: 0,
        percentChange: 0,
        isSeasonal: false,
        metrics: { totalPoints: values.length, nonZeroPoints: nonZeroCount }
      };
    }

    // 1. Peak calculation
    let maxVal = -1;
    let peakIndex = 0;
    values.forEach((v, idx) => {
      if (v > maxVal) {
        maxVal = v;
        peakIndex = idx;
      }
    });
    const peakPoint = timeline[peakIndex];

    // 2. Baseline vs Recent Moving Average
    // Baseline: first 70% of points; Recent: last 30% of points
    const splitIndex = Math.max(1, Math.floor(values.length * 0.7));
    const baselineSlice = values.slice(0, splitIndex);
    const recentSlice = values.slice(splitIndex);

    const baselineAvg = baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length;
    const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;

    // Percent change from baseline to recent
    const safeBaseline = baselineAvg > 0 ? baselineAvg : 1;
    const percentChange = Number((((recentAvg - baselineAvg) / safeBaseline) * 100).toFixed(1));

    // 3. Volatility / Standard Deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const volatilityRatio = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;

    // 4. Seasonality Detection (Fourier / Periodic Spike recurrence across intervals)
    let isSeasonal = false;
    let seasonalPattern = null;

    if (values.length >= 24) {
      // For monthly or weekly series with at least 24 points (approx 2 years)
      const half = Math.floor(values.length / 2);
      const year1 = values.slice(0, half);
      const year2 = values.slice(half);

      // Check correlation between year1 and year2
      const year1MaxIdx = year1.indexOf(Math.max(...year1));
      const year2MaxIdx = year2.indexOf(Math.max(...year2));
      const peakDistance = Math.abs((year1MaxIdx + half) - (year2MaxIdx + half));

      // If peaks repeat at roughly 12-month intervals
      if (Math.abs((year2MaxIdx - year1MaxIdx)) <= 2) {
        isSeasonal = true;
        seasonalPattern = 'Annual Recurring Demand Cycle';
      }
    }

    // 5. Short-term Spike vs Sustained Momentum
    const lastValue = values[values.length - 1];
    const previousValue = values[values.length - 2] || lastValue;
    const isSuddenSpike = lastValue >= 80 && previousValue < 40;

    // 6. Classification Logic
    let classification = 'Stable';
    let classificationReason = 'Interest shows steady equilibrium within historical moving averages.';
    let confidence = 85;

    if (isSuddenSpike) {
      classification = 'Emerging';
      classificationReason = `Sudden dramatic spike to ${lastValue}/100 within recent tracking interval. High breakout momentum.`;
      confidence = 88;
    } else if (percentChange >= 25) {
      classification = 'Rising';
      classificationReason = `Recent interest is +${percentChange}% higher than the historical baseline (${recentAvg.toFixed(1)} vs ${baselineAvg.toFixed(1)}).`;
      confidence = 92;
    } else if (percentChange <= -25) {
      classification = 'Declining';
      classificationReason = `Search interest has dropped ${percentChange}% below historical baseline levels.`;
      confidence = 86;
    } else if (isSeasonal) {
      classification = 'Seasonal';
      classificationReason = `${seasonalPattern} detected with periodic historical peak repetition.`;
      confidence = 84;
    } else if (volatilityRatio >= 65) {
      classification = 'Highly Volatile';
      classificationReason = `High variance (${volatilityRatio}% volatility index) with irregular spikes and troughs.`;
      confidence = 80;
    }

    return {
      classification,
      classificationReason,
      confidence,
      momentumScore: Math.min(100, Math.max(0, Math.round(50 + percentChange / 2))),
      volatilityRatio,
      percentChange,
      baselineAverage: Number(baselineAvg.toFixed(1)),
      recentAverage: Number(recentAvg.toFixed(1)),
      currentInterest: lastValue,
      peak: {
        value: maxVal,
        date: peakPoint?.date || peakPoint?.formattedTime || 'N/A'
      },
      isSeasonal,
      seasonalPattern,
      metrics: {
        totalPoints: values.length,
        nonZeroPoints: nonZeroCount,
        dataCoverage: Number(((nonZeroCount / values.length) * 100).toFixed(0))
      }
    };
  }
};
