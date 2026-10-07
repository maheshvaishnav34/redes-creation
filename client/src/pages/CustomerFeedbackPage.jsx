import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ThumbsUp,
  Globe,
  Sparkles,
  MapPin,
  Tag,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api.js';

export const CustomerFeedbackPage = () => {
  const { slug } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  // Core Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedService, setSelectedService] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);
  const [aiVariationSeed, setAiVariationSeed] = useState(0);
  const [hasGeneratedAi, setHasGeneratedAi] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [extensionActive, setExtensionActive] = useState(false);

  // Listen for extension ready message
  useEffect(() => {
    const handleExtMsg = (e) => {
      if (e.data && e.data.type === 'REDES_EXTENSION_READY') {
        setExtensionActive(true);
      }
    };
    window.addEventListener('message', handleExtMsg);
    if (document.documentElement.getAttribute('data-redes-extension-active') === 'true') {
      setExtensionActive(true);
    }
    return () => window.removeEventListener('message', handleExtMsg);
  }, []);

  // Fetch campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await api.getPublicCampaign(slug || 'default');
        const camp = res.campaign || null;
        setCampaign(camp);
        if (camp?.id) {
          api.trackCampaignEvent(camp.id, 'LANDING_PAGE_VIEWED', {
            path: window.location.pathname,
            referrer: document.referrer || 'direct_or_qr'
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[FEEDBACK] Error loading campaign details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  const businessName = campaign?.business_name || campaign?.name || 'Redes Creation';
  const businessCity = campaign?.city || 'Ahmedabad';
  const rawWebsite = campaign?.website || campaign?.business_website || '';
  const businessWebsite = rawWebsite ? (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`) : '';
  const displayWebsite = businessWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  const lowerBiz = `${businessName} ${campaign?.name || ''}`.toLowerCase();
  const isTrainingOrTech = lowerBiz.includes('training') || lowerBiz.includes('code') || lowerBiz.includes('institute') || lowerBiz.includes('tech') || lowerBiz.includes('academy');
  const isHospitality = lowerBiz.includes('dine') || lowerBiz.includes('restaurant') || lowerBiz.includes('cafe') || lowerBiz.includes('food');
  const isDental = lowerBiz.includes('dental') || lowerBiz.includes('clinic') || lowerBiz.includes('teeth');

  // Extract or synthesize campaign services
  const campaignServices = useMemo(() => {
    if (campaign?.services) {
      if (Array.isArray(campaign.services)) return campaign.services;
      try {
        const parsed = JSON.parse(campaign.services);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        const parts = campaign.services.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }
    }
    if (isTrainingOrTech) {
      return ['Full Stack Web Development', 'Python Programming', 'Software Engineering', 'Placement Support'];
    }
    if (isHospitality) {
      return ['A La Carte Dining', 'Banquet Catering', 'Family Dinners', 'Special Events'];
    }
    if (isDental) {
      return ['Dental Consultation', 'Teeth Whitening', 'Root Canal Treatment', 'Aligners'];
    }
    return ['Website Designing & Development', 'Google Review Optimization', 'Local SEO & Geo-Grid', 'General Service'];
  }, [campaign?.services, isTrainingOrTech, isHospitality, isDental]);

  // Set default selected service once loaded
  useEffect(() => {
    if (campaignServices.length > 0 && !selectedService) {
      setSelectedService(campaignServices[0]);
    }
  }, [campaignServices, selectedService]);

  // Quick chips for 1-tap addition (Experience Themes)
  const quickChips = useMemo(() => {
    if (isTrainingOrTech) {
      return ['Practical Training', 'Expert Faculty', 'Live Project Work', 'Doubt Clearing', 'Placement Support'];
    }
    if (isHospitality) {
      return ['Delicious Food', 'Great Ambiance', 'Attentive Staff', 'Quick Service', 'Clean & Hygienic'];
    }
    if (isDental) {
      return ['Painless Treatment', 'Modern Equipment', 'Caring Doctors', 'Hygiene & Cleanliness', 'Fast Appointment'];
    }
    return ['Quality Service', 'Clear Communication', 'Professional Team', 'Timely Delivery', 'Fair Pricing'];
  }, [isTrainingOrTech, isHospitality, isDental]);

  // Dynamic Natural AI Generator Function (Produces varied, human-like reviews on each call)
  const generateFreshAiReview = (currentRating, service, chips, seed) => {
    const sName = service || 'service';
    const bName = businessName;
    const themesStr = chips.length > 0 ? chips.join(', ') : '';

    if (currentRating >= 4) {
      const highOpeners = [
        `Outstanding experience with ${bName} for ${sName}!`,
        `Honestly one of the best experiences I have had with ${bName}!`,
        `Recently availed ${sName} from ${bName} and was truly impressed.`,
        `Extremely satisfied with the service provided by ${bName} for ${sName}.`,
        `Cannot recommend ${bName} enough for ${sName}!`,
        `Had a wonderful experience with the team at ${bName}!`,
        `Top-notch quality and great support from ${bName} for ${sName}.`,
        `Really happy that I chose ${bName} for ${sName}.`
      ];

      const highBodiesWithThemes = [
        `The team's dedication to ${themesStr.toLowerCase()} was evident throughout the entire process. Everything was handled seamlessly.`,
        `What really stood out to me was their focus on ${themesStr.toLowerCase()}. The staff is very courteous, responsive, and skilled.`,
        `Their attention to detail and ${themesStr.toLowerCase()} made a significant difference. Clear communication and great outcomes.`,
        `Prompt coordination and high-standard ${themesStr.toLowerCase()}. They deliver exactly what they promise without any hassle.`,
        `From start to finish, their ${themesStr.toLowerCase()} was impeccable. It is rare to find this level of consistency and care.`
      ];

      const highBodiesWithoutThemes = [
        `Prompt communication, dependable execution, and very courteous staff. They made the entire process completely hassle-free.`,
        `The professionalism, punctuality, and quality of work exceeded all expectations. A truly reliable team.`,
        `Very smooth coordination from start to finish. Transparent, efficient, and thoroughly customer-focused.`,
        `Great value for money and dependable support. Everything was executed with utmost precision.`
      ];

      const highClosers = [
        `5 stars well deserved!`,
        `Highly recommended to anyone looking for quality and reliability!`,
        `Will definitely come back and recommend to friends and family.`,
        `Keep up the fantastic work! A solid 10/10 from me.`,
        `Gladly giving 5 stars for their exceptional service.`,
        `Looking forward to continuing with them in the future!`
      ];

      const opIdx = (seed * 3) % highOpeners.length;
      const bdIdx = chips.length > 0 
        ? (seed * 2 + 1) % highBodiesWithThemes.length 
        : (seed * 2 + 1) % highBodiesWithoutThemes.length;
      const clIdx = (seed * 5 + 2) % highClosers.length;

      const opener = highOpeners[opIdx];
      const body = chips.length > 0 ? highBodiesWithThemes[bdIdx] : highBodiesWithoutThemes[bdIdx];
      const closer = highClosers[clIdx];

      return `${opener} ${body} ${closer}`;
    } else {
      // Constructive private feedback for management (1-3 stars)
      const lowOpeners = [
        `Sharing constructive feedback regarding my recent experience with ${sName} at ${bName}.`,
        `Providing direct feedback for management regarding ${sName}.`,
        `Wanted to highlight a few areas for improvement concerning ${sName} at ${bName}.`,
        `Writing to share our experience with ${sName}.`
      ];

      const lowBodies = chips.length > 0
        ? [
            `While certain aspects were noted, specific points regarding ${themesStr.toLowerCase()} did not meet expectations.`,
            `We encountered issues particularly around ${themesStr.toLowerCase()}, which caused inconvenience.`,
            `There is noticeable room for improvement in ${themesStr.toLowerCase()} and overall execution.`
          ]
        : [
            `The service quality and execution were below what was expected.`,
            `There were communication delays and difficulties during the process.`,
            `The experience felt rushed and did not meet standard expectations.`
          ];

      const lowClosers = [
        `Hoping management takes this feedback positively to address these gaps.`,
        `Appreciate if the team looks into this to improve customer satisfaction.`,
        `Sharing this directly so necessary adjustments can be made.`
      ];

      const opIdx = seed % lowOpeners.length;
      const bdIdx = seed % lowBodies.length;
      const clIdx = seed % lowClosers.length;

      return `${lowOpeners[opIdx]} ${lowBodies[bdIdx]} ${lowClosers[clIdx]}`;
    }
  };

  // Initialize review text on first load or when key inputs change initially
  useEffect(() => {
    if (!hasGeneratedAi && reviewText === '') {
      const initialText = generateFreshAiReview(rating, selectedService, selectedChips, 0);
      setReviewText(initialText);
      syncDraftToExtension(initialText, rating);
    }
  }, [rating, selectedService, selectedChips, hasGeneratedAi]);

  // Handler: Generate fresh AI Review on demand
  const handleGenerateAiReview = () => {
    setIsGeneratingAi(true);
    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    setHasGeneratedAi(true);

    setTimeout(() => {
      const freshText = generateFreshAiReview(rating, selectedService, selectedChips, nextSeed);
      setReviewText(freshText);
      syncDraftToExtension(freshText, rating);
      setIsGeneratingAi(false);
    }, 220);
  };

  // Toggle quick highlight chip
  const toggleChip = (chip) => {
    const isSelected = selectedChips.includes(chip);
    const newChips = isSelected ? selectedChips.filter(c => c !== chip) : [...selectedChips, chip];
    setSelectedChips(newChips);

    // Update review text with new theme context
    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    const updated = generateFreshAiReview(rating, selectedService, newChips, nextSeed);
    setReviewText(updated);
    syncDraftToExtension(updated, rating);
  };

  const getGoogleReviewUrl = () => {
    if (campaign?.google_review_url && !campaign.google_review_url.includes('ChIJr2oQ32_9XzkRLw5P7A8V-uU')) {
      return campaign.google_review_url;
    }
    if (campaign?.google_place_id && campaign.google_place_id !== 'ChIJr2oQ32_9XzkRLw5P7A8V-uU') {
      return `https://search.google.com/local/writereview?placeid=${campaign.google_place_id}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName + ' ' + businessCity)}`;
  };

  const syncDraftToExtension = (text, explicitRating) => {
    if (!text) return;
    const currentRating = typeof explicitRating === 'number' ? explicitRating : rating;
    try {
      localStorage.setItem('redes_latest_review_draft', JSON.stringify({
        text,
        rating: currentRating,
        customerName: customerName.trim() || 'Verified Customer',
        businessName
      }));
      window.postMessage({
        type: 'REDES_POST_DRAFT',
        text,
        rating: currentRating,
        customerName: customerName.trim() || 'Verified Customer',
        businessName
      }, '*');
    } catch {}
  };

  const copyToClipboard = async (text) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {}
    }
    if (!success) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    return success;
  };

  const handleRatingSelect = (star) => {
    setRating(star);
    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    const freshText = generateFreshAiReview(star, selectedService, selectedChips, nextSeed);
    setReviewText(freshText);
    syncDraftToExtension(freshText, star);
  };

  const handlePostReview = async (e) => {
    if (e) e.preventDefault();
    setPosting(true);

    const activeText = reviewText.trim() || 'Outstanding experience!';

    await copyToClipboard(activeText);
    syncDraftToExtension(activeText, rating);
    setCopied(true);

    if (campaign?.id) {
      api.trackCampaignEvent(campaign.id, 'REVIEW_DESTINATION_CLICKED', {
        rating,
        service: selectedService,
        destination: rating >= 4 ? 'google_reviews' : 'private_feedback'
      }).catch(() => {});
    }

    try {
      if (rating >= 4) {
        await api.autoPostReview({
          campaignId: campaign?.id || slug,
          customerName: customerName.trim() || 'Verified Customer',
          rating,
          reviewText: activeText,
          selectedDraft: activeText,
          serviceExperienced: selectedService,
          themesSelected: selectedChips,
          destination: 'google'
        });
      } else {
        await api.submitFeedback({
          campaignId: campaign?.id || slug,
          customerName: customerName.trim() || 'Valued Client',
          rating,
          feedbackText: activeText,
          serviceExperienced: selectedService,
          themesSelected: selectedChips,
          proceededToGoogle: false
        });
      }
    } catch (err) {
      console.warn('[FEEDBACK] Sync notice:', err);
    } finally {
      setPosting(false);
    }

    if (rating >= 4) {
      const targetUrl = getGoogleReviewUrl();
      window.open(targetUrl, '_blank');
      setCompleted(true);
    } else {
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#034bc0] border-t-transparent animate-spin"></div>
          <span className="text-xs font-bold text-slate-600">Loading feedback portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-xl p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">
        
        {/* Header: Brand & Business Name */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img 
              src="/redes-logo.png" 
              alt="Redes Creation" 
              className="h-9 sm:h-10 w-auto object-contain mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {businessName}
          </h1>

          <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-500 font-medium">
            {displayWebsite && (
              <a
                href={businessWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#034bc0] hover:bg-blue-100 transition font-bold"
              >
                <Globe className="w-3 h-3" />
                <span>{displayWebsite}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {businessCity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{businessCity}</span>
              </span>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="space-y-4">
          
          {/* Star Rating Section */}
          <div className="text-center py-3 px-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              How was your experience?
            </label>
            
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingSelect(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-black text-slate-900 mt-1">
              {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional (5/5)'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good (4/5)'}
              {rating === 3 && '⭐⭐⭐ Average (3/5)'}
              {rating === 2 && '⭐⭐ Needs Improvement (2/5)'}
              {rating === 1 && '⭐ Disappointing (1/5)'}
            </div>
          </div>

          {/* Service / Product Used Selector */}
          {campaignServices.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#034bc0]" />
                  <span>Service Availed:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Tap to customize</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {campaignServices.map((svc) => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => {
                      setSelectedService(svc);
                      const nextSeed = aiVariationSeed + 1;
                      setAiVariationSeed(nextSeed);
                      const fresh = generateFreshAiReview(rating, svc, selectedChips, nextSeed);
                      setReviewText(fresh);
                      syncDraftToExtension(fresh, rating);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedService === svc
                        ? 'bg-[#034bc0] text-white shadow-xs ring-2 ring-[#034bc0]/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* What stood out? Experience Themes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>What stood out? (Tap 1 or more)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip) => {
                const isSelected = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Clean AI Review Box + 1-Click Refresh */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#034bc0]" />
                <span>Your Review:</span>
              </label>

              {/* 1-Click AI Generation Button */}
              <button
                type="button"
                onClick={handleGenerateAiReview}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Writing...' : (hasGeneratedAi ? 'Try Another AI Review' : 'Write with AI')}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value);
                syncDraftToExtension(e.target.value);
              }}
              className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium leading-relaxed shadow-xs"
              placeholder="Your review text appears here (feel free to edit or write your own words)..."
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>AI-generated • Click "Try Another" anytime for a new variation</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReviewText('');
                  syncDraftToExtension('');
                }}
                className="text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Optional Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">Your Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0]"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-1 space-y-2">
            {rating >= 4 ? (
              <button
                type="button"
                disabled={posting}
                onClick={handlePostReview}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {posting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{completed ? 'Review Copied! Tap to Open Google Again' : `Post Review on Google (${rating}★)`}</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={posting}
                onClick={handlePostReview}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{completed ? 'Thank You! Feedback Sent to Management' : 'Send Private Feedback to Management'}</span>
                {completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ThumbsUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Customer Feedback</span>
          </div>
          <span>Powered by Redes Creation</span>
        </div>

      </div>
    </div>
  );
};

export default CustomerFeedbackPage;
