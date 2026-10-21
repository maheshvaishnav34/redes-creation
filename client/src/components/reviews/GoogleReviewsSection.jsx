import React, { useState, useEffect } from 'react';
import {
  Star,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api.js';

/**
 * Official Google "G" Multi-Color Vector Logo
 */
export const GoogleLogoIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * 5-Star Visual Display with precise Fractional Filling
 */
export const StarRating = ({ rating = 5, size = "w-4 h-4", showNumber = false }) => {
  const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));
  
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const fillRatio = Math.max(0, Math.min(1, numericRating - (starIndex - 1)));
          return (
            <div key={starIndex} className="relative inline-block">
              {/* Background empty star */}
              <Star className={`${size} text-slate-200 fill-slate-200`} />
              {/* Foreground filled star with fractional width */}
              {fillRatio > 0 && (
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <Star className={`${size} text-amber-400 fill-amber-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-bold text-slate-800 ml-1">
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export const GoogleReviewsSection = ({
  businessId = null,
  placeId = null,
  title = "Real Google Reviews",
  subtitle = "Direct customer experiences from our verified Google listing",
  className = "",
  showWriteReview = true
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3'
  const [expandedReviews, setExpandedReviews] = useState({});

  const fetchLiveReviews = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (businessId) params.append('businessId', businessId);
      if (placeId) params.append('placeId', placeId);
      if (isManualRefresh) params.append('refresh', 'true');
      params.append('limit', '50');

      const res = await api.getGoogleLiveReviews(params.toString() ? `?${params.toString()}` : '');
      setData(res);
    } catch (err) {
      console.error('[GOOGLE_REVIEWS_SECTION] Error fetching Google Reviews:', err);
      setError(err.message || 'Unable to load Google reviews at this time.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveReviews();
  }, [businessId, placeId]);

  const toggleExpand = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const reviewsList = data?.reviews || [];
  const filteredReviews = reviewsList.filter(r => {
    if (starFilter === 'all') return true;
    return Number(r.starRating) === Number(starFilter);
  });

  const totalReviewsCount = data?.userRatingsTotal || reviewsList.length || 0;
  const averageRating = Number(data?.rating) || 0;
  const starDist = data?.starDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <section className={`py-12 sm:py-16 bg-white border-y border-slate-200/80 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <GoogleLogoIcon className="w-4 h-4" />
              <span>Official Google Reviews</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => fetchLiveReviews(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh latest Google Reviews"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#034bc0]' : 'text-slate-500'}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {data?.googleMapsUrl && (
              <a
                href={data.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-sm"
              >
                <span>View on Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
            <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
            <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-center max-w-xl mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold">Unable to Load Google Reviews</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={() => fetchLiveReviews(true)}
              className="mt-3 px-4 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-800 hover:bg-rose-100/50 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && totalReviewsCount === 0 && (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center max-w-lg mx-auto space-y-3">
            <GoogleLogoIcon className="w-10 h-10 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-slate-800">No Google Reviews Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {data?.message || 'We could not find public Google reviews for this location yet. Connect your Google Business Profile to sync live customer feedback.'}
            </p>
            {data?.writeReviewUrl && (
              <a
                href={data.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#034bc0] text-white text-xs font-bold hover:bg-[#023aa0] transition shadow-xs mt-2"
              >
                <span>Be the first to review on Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* LIVE CONTENT */}
        {!loading && !error && totalReviewsCount > 0 && (
          <div className="space-y-8">
            
            {/* OVERVIEW HERO CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 shadow-xs">
              
              {/* Column 1: Big Rating & Total */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4 pr-0 lg:pr-6 lg:border-r border-slate-200/80">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GoogleLogoIcon className="w-5 h-5" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Google Rating
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="space-y-1">
                      <StarRating rating={averageRating} size="w-5 h-5" />
                      <div className="text-xs font-semibold text-slate-600">
                        out of 5.0 stars
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{totalReviewsCount.toLocaleString('en-IN')} Genuine Google Reviews</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    All reviews are pulled directly from Google Maps Platform under strict Google policy compliance.
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {showWriteReview && data?.writeReviewUrl && (
                    <a
                      href={data.writeReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Write a Review</span>
                    </a>
                  )}

                  {data?.googleMapsUrl && (
                    <a
                      href={data.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>View on Maps</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Column 2: Rating Distribution Bars */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-2.5 pl-0 lg:pl-4">
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Rating Distribution
                </span>

                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starDist[star] || 0;
                  const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-7 font-bold text-slate-700 flex items-center gap-1">
                        <span>{star}</span>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-200/90 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-right text-[11px] font-semibold text-slate-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setStarFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                    starFilter === 'all'
                      ? 'bg-white text-[#034bc0] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({reviewsList.length})
                </button>
                {[5, 4, 3].map((star) => {
                  const count = reviewsList.filter(r => Number(r.starRating) === star).length;
                  if (count === 0 && starFilter !== String(star)) return null;

                  return (
                    <button
                      key={star}
                      onClick={() => setStarFilter(String(star))}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold flex items-center gap-1 ${
                        starFilter === String(star)
                          ? 'bg-white text-amber-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{star}★</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-slate-500">
                Showing {filteredReviews.length} of {totalReviewsCount} Google Reviews
              </span>
            </div>

            {/* REVIEWS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredReviews.map((review) => {
                const isExpanded = Boolean(expandedReviews[review.reviewId]);
                const comment = review.comment || '';
                const isLong = comment.length > 180;
                const displayText = isLong && !isExpanded ? `${comment.slice(0, 180)}...` : comment;

                const reviewerName = review.reviewer?.displayName || 'Google Customer';
                const avatarUrl = review.reviewer?.profilePhotoUrl;
                const initial = reviewerName.charAt(0).toUpperCase();

                return (
                  <div
                    key={review.reviewId}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                  >
                    {/* Header: Reviewer info & Star rating */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={reviewerName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 ${avatarUrl ? 'hidden' : 'flex'}`}
                          >
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {reviewerName}
                              </h4>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#034bc0] shrink-0" title="Verified Google Review" />
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {review.relativeTimeDescription || 'Verified visit'}
                            </span>
                          </div>
                        </div>

                        <GoogleLogoIcon className="w-4 h-4 shrink-0 opacity-80" />
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.starRating} size="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {review.starRating}.0
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-xs text-slate-700 leading-relaxed">
                        "{displayText}"
                      </p>

                      {isLong && (
                        <button
                          onClick={() => toggleExpand(review.reviewId)}
                          className="text-[11px] font-bold text-[#034bc0] hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Card Footer: Praised tags & Google link */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {Array.isArray(review.praisedServices) && review.praisedServices.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold truncate max-w-[170px]">
                          ✓ {review.praisedServices[0]}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Posted on Google</span>
                      )}

                      <a
                        href={review.authorUrl || data.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#034bc0] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GOOGLE BRANDING & ATTRIBUTION FOOTER */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <GoogleLogoIcon className="w-4 h-4" />
                <span className="font-semibold text-slate-700">Powered by Google</span>
                <span className="text-slate-300">•</span>
                <span>Authentic customer reviews verified through Google Places API</span>
              </div>

              {data?.googleMapsUrl && (
                <a
                  href={data.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#034bc0] hover:underline flex items-center gap-1"
                >
                  <span>Read all reviews on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};

export default GoogleReviewsSection;
