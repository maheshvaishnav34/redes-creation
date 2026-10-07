import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ExternalLink,
  Copy,
  ShieldCheck,
  ThumbsUp,
  Globe,
  Sparkles,
  MapPin,
  Tag
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
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);
  const [customEdited, setCustomEdited] = useState(false);
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

  // Quick chips for 1-tap addition (Section 5.1 Experience Themes)
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

  // AI Review Writing Assistant: 3 Natural Draft Options (Section 5.1)
  const draftOptions = useMemo(() => {
    const sName = selectedService || 'services';
    const bName = businessName;
    const themesStr = selectedChips.length > 0 ? selectedChips.join(', ') : '';

    if (rating >= 4) {
      // 1. Concise
      const draft1 = selectedChips.length > 0
        ? `Exceptional experience with ${bName} for ${sName}! Really impressed with their ${themesStr.toLowerCase()}. Highly recommended!`
        : `Outstanding experience with ${bName} for ${sName}! Prompt, professional, and reliable service. Highly recommended!`;

      // 2. Detailed & Professional
      const draft2 = selectedChips.length > 0
        ? `I recently used ${sName} at ${bName} and was thoroughly satisfied. The team maintained high standards of professionalism and communication. Special mention for their ${themesStr.toLowerCase()}, which made a noticeable difference. 5 stars well deserved!`
        : `I recently engaged ${bName} for ${sName} and had a seamless experience from start to finish. The quality of work and attentive service exceeded my expectations. Gladly recommending them to friends and colleagues!`;

      // 3. Warm & Personal
      const draft3 = selectedChips.length > 0
        ? `Super happy with the support from ${bName}! Everything regarding ${sName} was handled with great care. Loved their ${themesStr.toLowerCase()}. Will definitely choose them again!`
        : `Really great experience dealing with the team at ${bName}! Smooth process for ${sName} and very polite staff. Keep up the wonderful work!`;

      return [
        { id: 0, label: 'Concise', icon: '⚡', text: draft1 },
        { id: 1, label: 'Detailed', icon: '📝', text: draft2 },
        { id: 2, label: 'Personal', icon: '🌟', text: draft3 }
      ];
    } else {
      // Constructive private feedback for management
      const draft1 = selectedChips.length > 0
        ? `Providing direct feedback regarding ${sName} at ${bName}. Areas such as ${themesStr.toLowerCase()} need attention.`
        : `Sharing constructive feedback regarding my recent experience with ${sName} at ${bName}. Looking forward to improvements.`;

      const draft2 = selectedChips.length > 0
        ? `I wanted to share private feedback regarding ${sName}. While I appreciate the effort, the experience regarding ${themesStr.toLowerCase()} did not meet expectations. Hoping management can look into this.`
        : `Direct feedback for management regarding ${sName}: the experience was below expectations. Please review and address this with the team.`;

      const draft3 = selectedChips.length > 0
        ? `Constructive note for ${bName}: our experience with ${sName} had some friction, particularly around ${themesStr.toLowerCase()}. Appreciate if someone can reach out.`
        : `Sharing private feedback on ${sName}. There is scope for improvement in service delivery.`;

      return [
        { id: 0, label: 'Concise', icon: '⚡', text: draft1 },
        { id: 1, label: 'Detailed', icon: '📝', text: draft2 },
        { id: 2, label: 'Constructive', icon: '🤝', text: draft3 }
      ];
    }
  }, [rating, selectedService, selectedChips, businessName]);

  // Keep active text in sync with draft options unless user explicitly typed custom edits
  useEffect(() => {
    if (!customEdited) {
      const activeText = draftOptions[activeDraftIndex]?.text || draftOptions[0]?.text || '';
      setReviewText(activeText);
      syncDraftToExtension(activeText, rating);
    }
  }, [draftOptions, activeDraftIndex, customEdited, rating]);

  // Toggle quick chip
  const toggleChip = (chip) => {
    const isSelected = selectedChips.includes(chip);
    const newChips = isSelected ? selectedChips.filter(c => c !== chip) : [...selectedChips, chip];
    setSelectedChips(newChips);
    setCustomEdited(false);
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
    setCustomEdited(false);
    const activeText = draftOptions[activeDraftIndex]?.text || '';
    syncDraftToExtension(activeText, star);
  };

  const handlePostReview = async (e) => {
    if (e) e.preventDefault();
    setPosting(true);

    const activeText = reviewText.trim() || draftOptions[activeDraftIndex]?.text || 'Outstanding experience!';

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

        {/* 1-Step Compact Review Form */}
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

          {/* Section 5: Service / Product Used Selector */}
          {campaignServices.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#034bc0]" />
                  <span>Service Availed:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Tap to customize</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {campaignServices.map((svc) => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => {
                      setSelectedService(svc);
                      setCustomEdited(false);
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

          {/* Section 5.1: What stood out? Experience Themes */}
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

          {/* Section 5.1: AI Review Writing Assistant with 3 Natural Draft Options */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#034bc0]" />
                <span>AI Writing Assistant:</span>
              </label>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#034bc0] border border-blue-100">
                3 Natural Options
              </span>
            </div>

            {/* 3 Natural Draft Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {draftOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setActiveDraftIndex(idx);
                    setReviewText(opt.text);
                    setCustomEdited(false);
                    syncDraftToExtension(opt.text);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    activeDraftIndex === idx
                      ? 'bg-white text-[#034bc0] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500 font-medium">Review Text:</span>
                {customEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewText(draftOptions[activeDraftIndex]?.text || '');
                      setCustomEdited(false);
                      syncDraftToExtension(draftOptions[activeDraftIndex]?.text || '');
                    }}
                    className="text-[#034bc0] font-bold hover:underline cursor-pointer"
                  >
                    Reset to {draftOptions[activeDraftIndex]?.label} Draft
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => {
                  setReviewText(e.target.value);
                  setCustomEdited(true);
                  syncDraftToExtension(e.target.value);
                }}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium leading-relaxed shadow-inner"
                placeholder="Write your review here..."
              />
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
