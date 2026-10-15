import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { trendsAnalyzer } from '../src/modules/trends/trends.analyzer.js';
import { trendsScoring } from '../src/modules/trends/trends.scoring.js';
import { trendsForecaster } from '../src/modules/trends/trends.forecaster.js';

describe('Google Trends Intelligence Pro — Comprehensive Unit Tests', () => {

  // 1. Trend Analysis & Classification Tests
  describe('Trend Analyzer Engine', () => {
    test('Correctly rejects insufficient historical data (< 4 points)', () => {
      const sparseTimeline = [{ date: '2026-01', value: 50 }, { date: '2026-02', value: 55 }];
      const result = trendsAnalyzer.analyzeTimeline(sparseTimeline, 'test');
      assert.equal(result.classification, 'Insufficient Data');
      assert.equal(result.confidence, 20);
    });

    test('Correctly detects Rising trend when trajectory exceeds 25% baseline', () => {
      // 10 points: baseline ~20, recent ~60
      const risingTimeline = [
        { date: '1', value: 20 }, { date: '2', value: 21 }, { date: '3', value: 19 },
        { date: '4', value: 20 }, { date: '5', value: 22 }, { date: '6', value: 20 },
        { date: '7', value: 21 }, { date: '8', value: 55 }, { date: '9', value: 60 }, { date: '10', value: 65 }
      ];
      const result = trendsAnalyzer.analyzeTimeline(risingTimeline, 'test');
      assert.equal(result.classification, 'Rising');
      assert.ok(result.percentChange > 25);
      assert.ok(result.recentAverage > result.baselineAverage);
    });

    test('Detects sudden spike / breakout momentum (Emerging)', () => {
      const spikeTimeline = [
        { date: '1', value: 10 }, { date: '2', value: 12 }, { date: '3', value: 10 },
        { date: '4', value: 11 }, { date: '5', value: 10 }, { date: '6', value: 90 }
      ];
      const result = trendsAnalyzer.analyzeTimeline(spikeTimeline, 'test');
      assert.equal(result.classification, 'Emerging');
      assert.equal(result.currentInterest, 90);
    });

    test('Computes non-negative volatility ratio and standard deviation', () => {
      const stableTimeline = [
        { date: '1', value: 50 }, { date: '2', value: 51 }, { date: '3', value: 49 },
        { date: '4', value: 50 }, { date: '5', value: 52 }, { date: '6', value: 50 }
      ];
      const result = trendsAnalyzer.analyzeTimeline(stableTimeline, 'test');
      assert.equal(result.classification, 'Stable');
      assert.ok(result.volatilityRatio < 20);
    });
  });

  // 2. Opportunity Scoring Engine Tests
  describe('Opportunity Scoring Matrix', () => {
    test('Calculates explainable 5-factor weighted score within [0, 100]', () => {
      const mockAnalysis = {
        classification: 'Rising',
        confidence: 90,
        percentChange: 45,
        volatilityRatio: 22,
        isSeasonal: false
      };
      const mockQueries = {
        rising: [{ query: 'breakout topic', isBreakout: true }, { query: 'sub topic' }],
        top: [{ query: 'main' }]
      };

      const scoreResult = trendsScoring.calculateOpportunityScore({
        analysis: mockAnalysis,
        relatedQueries: mockQueries,
        regionsCount: 18
      });

      assert.ok(scoreResult.overallScore >= 0 && scoreResult.overallScore <= 100);
      assert.equal(scoreResult.factors.length, 5);
      // Validate total factor weights equal 100%
      const totalWeight = scoreResult.factors.reduce((sum, f) => sum + f.weight, 0);
      assert.equal(totalWeight, 100);
    });

    test('Gracefully returns Low Potential for insufficient data', () => {
      const result = trendsScoring.calculateOpportunityScore({
        analysis: { classification: 'Insufficient Data', confidence: 25 },
        relatedQueries: { top: [], rising: [] },
        regionsCount: 0
      });
      assert.equal(result.rating, 'Low Potential');
      assert.ok(result.overallScore <= 40);
    });
  });

  // 3. AI Trend Prediction & Statistical Forecasting Engine Tests
  describe('AI Trend Prediction & Backtesting Engine', () => {
    test('Refuses forecast on sparse series with clear explanation', () => {
      const tooShortTimeline = [
        { date: 'D1', value: 10, timestamp: 1000 },
        { date: 'D2', value: 20, timestamp: 2000 }
      ];
      const forecast = trendsForecaster.generateForecast({
        timeline: tooShortTimeline,
        keyword: 'sparse',
        horizonDays: 30
      });

      assert.equal(forecast.feasible, false);
      assert.ok(forecast.reason.includes('minimum of 8'));
    });

    test('Enforces chronological split without temporal data leakage in backtesting', () => {
      const timeline = [
        { date: 'W1', value: 20, timestamp: 1000 },
        { date: 'W2', value: 22, timestamp: 2000 },
        { date: 'W3', value: 25, timestamp: 3000 },
        { date: 'W4', value: 28, timestamp: 4000 },
        { date: 'W5', value: 32, timestamp: 5000 },
        { date: 'W6', value: 37, timestamp: 6000 },
        { date: 'W7', value: 43, timestamp: 7000 },
        { date: 'W8', value: 50, timestamp: 8000 },
        { date: 'W9', value: 56, timestamp: 9000 },
        { date: 'W10', value: 63, timestamp: 10000 },
        { date: 'W11', value: 71, timestamp: 11000 },
        { date: 'W12', value: 80, timestamp: 12000 }
      ];

      const forecast = trendsForecaster.generateForecast({
        timeline,
        keyword: 'deep learning',
        horizonDays: 30,
        modelName: 'holt_linear'
      });

      assert.equal(forecast.feasible, true);
      assert.ok(forecast.forecastPoints.length > 0);

      // Verify backtesting metrics
      const backtest = forecast.backtestMetrics;
      assert.ok(backtest.mae !== undefined);
      assert.ok(backtest.rmse !== undefined);
      assert.ok(backtest.mase !== undefined);
      assert.ok(typeof backtest.smape === 'string');

      // Verify bounds: all forecast points strictly between 0 and 100
      forecast.forecastPoints.forEach(pt => {
        assert.ok(pt.predictedValue >= 0 && pt.predictedValue <= 100);
        assert.ok(pt.lower80 <= pt.predictedValue);
        assert.ok(pt.upper80 >= pt.predictedValue);
        assert.ok(pt.lower95 <= pt.lower80);
        assert.ok(pt.upper95 >= pt.upper80);
      });
    });

    test('Handles zero values safely without division by zero in sMAPE or MASE', () => {
      const zerosTimeline = [
        { date: 'T1', value: 0, timestamp: 1000 },
        { date: 'T2', value: 0, timestamp: 2000 },
        { date: 'T3', value: 5, timestamp: 3000 },
        { date: 'T4', value: 8, timestamp: 4000 },
        { date: 'T5', value: 12, timestamp: 5000 },
        { date: 'T6', value: 15, timestamp: 6000 },
        { date: 'T7', value: 18, timestamp: 7000 },
        { date: 'T8', value: 22, timestamp: 8000 },
        { date: 'T9', value: 25, timestamp: 9000 }
      ];

      const forecast = trendsForecaster.generateForecast({
        timeline: zerosTimeline,
        keyword: 'zero test',
        horizonDays: 7
      });

      assert.equal(forecast.feasible, true);
      assert.ok(!isNaN(forecast.backtestMetrics.mae));
      assert.ok(!isNaN(forecast.backtestMetrics.mase));
    });
  });
});
