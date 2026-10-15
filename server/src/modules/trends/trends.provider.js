import googleTrends from 'google-trends-api';
import * as cheerio from 'cheerio';

// In-memory cache with 30-minute TTL to respect quotas and prevent rate limiting
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCacheKey(type, params) {
  return `${type}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setToCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks: prune cache if larger than 500 items
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

/**
 * Parses timeframes into Google Trends API compatible options.
 * Timeframes supported: 'now 1-d', 'now 7-d', 'today 1-m', 'today 3-m', 'today 12-m', 'today 5-y', 'all'
 */
function parseTimeframe(timeframe = 'today 12-m') {
  const now = new Date();
  let startTime;

  switch (timeframe) {
    case 'now 1-d':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'now 7-d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'today 1-m':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'today 3-m':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'today 12-m':
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'today 5-y':
      startTime = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startTime = new Date('2004-01-01');
      break;
    default:
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  return { startTime, endTime: now };
}

export const trendsProvider = {
  /**
   * 1. Interest Over Time (Single or Multi-keyword)
   */
  async getInterestOverTime({ keyword, geo = 'IN', timeframe = 'today 12-m', property = '', category = 0 }) {
    const cacheKey = getCacheKey('interestOverTime', { keyword, geo, timeframe, property, category });
    const cached = getFromCache(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const { startTime, endTime } = parseTimeframe(timeframe);
    const options = {
      keyword,
      startTime,
      endTime,
      geo: geo === 'WORLDWIDE' ? '' : geo,
      property: property || '',
      category: Number(category) || 0
    };

    try {
      const raw = await googleTrends.interestOverTime(options);
      const parsed = JSON.parse(raw);
      const timeline = parsed?.default?.timelineData || [];

      // Normalize timeline format for frontend Recharts
      const normalizedTimeline = timeline.map(point => {
        const item = {
          date: point.formattedAxisTime || point.formattedTime,
          timestamp: Number(point.time) * 1000,
          formattedTime: point.formattedTime,
          isPartial: point.isPartial?.[0] || false
        };

        if (Array.isArray(keyword)) {
          keyword.forEach((kw, i) => {
            item[kw] = point.value?.[i] || 0;
            item[`${kw}_formatted`] = point.formattedValue?.[i] || '0';
          });
        } else {
          item.value = point.value?.[0] || 0;
          item.formattedValue = point.formattedValue?.[0] || '0';
        }

        return item;
      });

      const result = {
        keyword,
        geo: geo || 'WORLDWIDE',
        timeframe,
        property: property || 'web',
        category,
        timeline: normalizedTimeline,
        pointsCount: normalizedTimeline.length,
        source: 'Google Trends (Normalized 0-100 Relative Index)',
        retrievedAt: new Date().toISOString(),
        isCached: false,
        status: 'success'
      };

      setToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.error('[Trends Provider] interestOverTime error:', err.message);
      // Fallback response with explicit diagnostic information
      return {
        keyword,
        geo: geo || 'WORLDWIDE',
        timeframe,
        property: property || 'web',
        timeline: [],
        pointsCount: 0,
        source: 'Google Trends',
        error: err.message,
        status: 'error',
        notice: 'Google Trends query rate-limited or unavailable for this parameter combination. Try adjusting timeframe or country.'
      };
    }
  },

  /**
   * 2. Related Queries (Top and Rising with Breakouts)
   */
  async getRelatedQueries({ keyword, geo = 'IN', timeframe = 'today 12-m', property = '', category = 0 }) {
    const singleKeyword = Array.isArray(keyword) ? keyword[0] : keyword;
    const cacheKey = getCacheKey('relatedQueries', { keyword: singleKeyword, geo, timeframe, property, category });
    const cached = getFromCache(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const { startTime, endTime } = parseTimeframe(timeframe);
    const options = {
      keyword: singleKeyword,
      startTime,
      endTime,
      geo: geo === 'WORLDWIDE' ? '' : geo,
      property: property || '',
      category: Number(category) || 0
    };

    try {
      const raw = await googleTrends.relatedQueries(options);
      const parsed = JSON.parse(raw);
      const rankedList = parsed?.default?.rankedList || [];

      // RankedList[0] is Top, RankedList[1] is Rising
      const topList = rankedList[0]?.rankedKeyword || [];
      const risingList = rankedList[1]?.rankedKeyword || [];

      const top = topList.map(item => ({
        query: item.query,
        value: item.value,
        formattedValue: item.formattedValue || `${item.value}`,
        type: 'top',
        link: item.link
      }));

      const rising = risingList.map(item => ({
        query: item.query,
        value: item.value,
        formattedValue: item.formattedValue || `+${item.value}%`,
        isBreakout: item.formattedValue === 'Breakout' || item.value > 5000,
        type: 'rising',
        link: item.link
      }));

      const result = {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        top,
        rising,
        source: 'Google Trends Related Queries',
        retrievedAt: new Date().toISOString(),
        status: 'success'
      };

      setToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[Trends Provider] relatedQueries notice:', err.message);
      return {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        top: [],
        rising: [],
        error: err.message,
        status: 'insufficient_data'
      };
    }
  },

  /**
   * 3. Related Topics (Top and Rising)
   */
  async getRelatedTopics({ keyword, geo = 'IN', timeframe = 'today 12-m', property = '' }) {
    const singleKeyword = Array.isArray(keyword) ? keyword[0] : keyword;
    const cacheKey = getCacheKey('relatedTopics', { keyword: singleKeyword, geo, timeframe, property });
    const cached = getFromCache(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const { startTime, endTime } = parseTimeframe(timeframe);
    const options = {
      keyword: singleKeyword,
      startTime,
      endTime,
      geo: geo === 'WORLDWIDE' ? '' : geo,
      property: property || ''
    };

    try {
      const raw = await googleTrends.relatedTopics(options);
      const parsed = JSON.parse(raw);
      const rankedList = parsed?.default?.rankedList || [];

      const top = (rankedList[0]?.rankedKeyword || []).map(item => ({
        title: item.topic?.title || item.query,
        type: item.topic?.type || 'Topic',
        value: item.value,
        formattedValue: item.formattedValue || `${item.value}`
      }));

      const rising = (rankedList[1]?.rankedKeyword || []).map(item => ({
        title: item.topic?.title || item.query,
        type: item.topic?.type || 'Topic',
        value: item.value,
        formattedValue: item.formattedValue || `+${item.value}%`,
        isBreakout: item.formattedValue === 'Breakout' || item.value > 5000
      }));

      const result = {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        top,
        rising,
        source: 'Google Trends Related Topics',
        retrievedAt: new Date().toISOString(),
        status: 'success'
      };

      setToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[Trends Provider] relatedTopics notice:', err.message);
      return {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        top: [],
        rising: [],
        error: err.message,
        status: 'insufficient_data'
      };
    }
  },

  /**
   * 4. Interest by Region (States / Provinces)
   */
  async getInterestByRegion({ keyword, geo = 'IN', timeframe = 'today 12-m', property = '', resolution = 'REGION' }) {
    const singleKeyword = Array.isArray(keyword) ? keyword[0] : keyword;
    const cacheKey = getCacheKey('interestByRegion', { keyword: singleKeyword, geo, timeframe, property, resolution });
    const cached = getFromCache(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const { startTime, endTime } = parseTimeframe(timeframe);
    const options = {
      keyword: singleKeyword,
      startTime,
      endTime,
      geo: geo === 'WORLDWIDE' ? '' : geo,
      resolution: resolution || 'REGION',
      property: property || ''
    };

    try {
      const raw = await googleTrends.interestByRegion(options);
      const parsed = JSON.parse(raw);
      const geoMapData = parsed?.default?.geoMapData || [];

      const regions = geoMapData
        .map(r => ({
          geoCode: r.geoCode,
          geoName: r.geoName,
          value: r.value?.[0] || 0,
          formattedValue: r.formattedValue?.[0] || '0',
          hasData: r.hasData?.[0] || false
        }))
        .filter(r => r.value > 0)
        .sort((a, b) => b.value - a.value);

      const result = {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        regions,
        topRegion: regions[0] || null,
        source: 'Google Trends Geographic Breakdown (Relative Index 0-100)',
        retrievedAt: new Date().toISOString(),
        status: 'success'
      };

      setToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[Trends Provider] interestByRegion notice:', err.message);
      return {
        keyword: singleKeyword,
        geo: geo || 'WORLDWIDE',
        regions: [],
        topRegion: null,
        error: err.message,
        status: 'insufficient_data'
      };
    }
  },

  /**
   * 5. Live Emerging & Daily Search Trends (Direct Google RSS Feed)
   * Fetches real-time trending queries with news context and estimated search volume
   */
  async getDailyTrendingSearches(geo = 'IN') {
    const targetGeo = (geo || 'IN').toUpperCase();
    const cacheKey = getCacheKey('dailyTrendingRSS', { geo: targetGeo });
    const cached = getFromCache(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const rssUrl = `https://trends.google.com/trending/rss?geo=${targetGeo}`;

    try {
      const res = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      if (!res.ok) {
        throw new Error(`Google Trends RSS responded with HTTP ${res.status}`);
      }

      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      const trends = [];
      $('item').each((_, el) => {
        const item = $(el);
        const query = item.find('title').text()?.trim();
        const traffic = item.find('ht\\:approx_traffic, approx_traffic').text()?.trim() || '10K+';
        const pubDate = item.find('pubDate').text()?.trim();
        const pictureUrl = item.find('ht\\:picture, picture').text()?.trim();
        const newsItems = [];

        item.find('ht\\:news_item, news_item').each((_, newsEl) => {
          const n = $(newsEl);
          newsItems.push({
            title: n.find('ht\\:news_item_title, news_item_title').text()?.trim(),
            snippet: n.find('ht\\:news_item_snippet, news_item_snippet').text()?.trim(),
            url: n.find('ht\\:news_item_url, news_item_url').text()?.trim(),
            source: n.find('ht\\:news_item_source, news_item_source').text()?.trim()
          });
        });

        if (query) {
          trends.push({
            query,
            traffic,
            pubDate,
            pictureUrl,
            news: newsItems.slice(0, 3),
            primaryArticle: newsItems[0] || null,
            geo: targetGeo
          });
        }
      });

      const result = {
        geo: targetGeo,
        trends,
        count: trends.length,
        source: 'Google Trends Daily Search Trends RSS Feed',
        retrievedAt: new Date().toISOString(),
        status: 'success'
      };

      setToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.error('[Trends Provider] getDailyTrendingSearches error:', err.message);
      return {
        geo: targetGeo,
        trends: [],
        count: 0,
        error: err.message,
        status: 'error'
      };
    }
  }
};
