import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sparkles,
  MapPin,
  RotateCw,
  Check,
  MessageSquare,
  Building2,
  User,
  HeartHandshake,
  Flame
} from 'lucide-react';
import { api } from '../services/api.js';
import { validateGoogleReviewUrl } from '../utils/googleUrlValidator.js';
import { ReviewGuideBottomSheet } from '../components/feedback/ReviewGuideBottomSheet.jsx';


export const CustomerFeedbackPage = () => {
  const { slug } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuideSheet, setShowGuideSheet] = useState(false);

  // Core Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [aiVariationSeed, setAiVariationSeed] = useState(0);
  const [hasGeneratedAi, setHasGeneratedAi] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reviewAdded, setReviewAdded] = useState(false);
  const [savedReviewId, setSavedReviewId] = useState(null);
  const [copySuccessToast, setCopySuccessToast] = useState(false);
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

  // Fetch campaign details by slug & resolve configured Google review destination
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await api.getPublicCampaign(slug || 'default');
        let camp = res?.campaign || null;

        // Fetch configured Google review URL directly from backend connection if business is present
        if (camp?.business_id) {
          try {
            const revRes = await api.getPublicBusinessReviewUrl(camp.business_id);
            if (revRes?.reviewUrl) {
              camp = {
                ...camp,
                google_review_url: revRes.reviewUrl,
                google_place_id: revRes.googlePlaceId || camp.google_place_id
              };
            }
          } catch (rErr) {
            console.warn('[FEEDBACK] Business Google URL fetch notice:', rErr.message);
          }
        }

        setCampaign(camp);
        if (camp?.id) {
          api.trackCampaignEvent(camp.id, 'LANDING_PAGE_VIEWED', {
            path: window.location.pathname,
            referrer: document.referrer || 'direct_or_qr'
          }).catch(() => { });
        }
      } catch (err) {
        console.error('[FEEDBACK] Error loading campaign details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  // Derive dynamic business metadata per location
  const defaultBusinessName = 'Business Location';

  const businessName = campaign?.business_name || defaultBusinessName;
  const businessCity = campaign?.city || '';
  const businessAddress = campaign?.address
    ? `${campaign.address}${businessCity ? ', ' + businessCity : ''}`
    : (businessCity ? `${businessCity}, India` : '');
  const rawWebsite = campaign?.website || campaign?.business_website || '';
  const businessWebsite = rawWebsite ? (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`) : '';
  const displayWebsite = businessWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  const lowerBiz = `${businessName} ${campaign?.name || ''}`.toLowerCase();
  const isTechOrTraining = lowerBiz.includes('code') || lowerBiz.includes('tech') || lowerBiz.includes('developer') || lowerBiz.includes('training') || lowerBiz.includes('software') || lowerBiz.includes('it ') || lowerBiz.includes('stack');
  const isDental = lowerBiz.includes('dental') || lowerBiz.includes('clinic') || lowerBiz.includes('teeth') || lowerBiz.includes('implant');
  const isHospitality = lowerBiz.includes('hotel') || lowerBiz.includes('resort') || lowerBiz.includes('dine') || lowerBiz.includes('restaurant') || lowerBiz.includes('cafe') || lowerBiz.includes('bistro') || lowerBiz.includes('food');

  // Industry-specific experience themes
  const quickChips = useMemo(() => {
    if (isTechOrTraining) {
      return ['Practical Training', 'Expert Faculty', 'Live Project Work', 'Placement Support', 'Doubt Clearing', 'Hands-on Coding'];
    }
    if (isDental) {
      return ['Painless Treatment', 'Modern Equipment', 'Caring Doctors', 'Hygiene & Cleanliness', 'Fast Appointment'];
    }
    if (isHospitality) {
      return ['Delicious Food', 'Great Ambiance', 'Attentive Staff', 'Quick Service', 'Clean & Hygienic Rooms', 'Scenic Location'];
    }
    return ['Quality Service', 'Clear Communication', 'Professional Team', 'Timely Delivery', 'Fair Pricing'];
  }, [isHospitality, isDental, isTechOrTraining]);

  // Dynamic Natural AI Generator Function — branches by business type & integrates 7-day keywords
  const generateFreshAiReview = (currentRating, chips = [], seed = 0, keywords = []) => {
    const activeKwList = (keywords && keywords.length > 0)
      ? keywords
      : (selectedKeywords.length > 0 ? selectedKeywords : (campaign?.trending_keywords || []));
    const trendingKw = activeKwList.length > 0
      ? activeKwList[seed % activeKwList.length]
      : null;
    const defaultTopic = isDental
      ? 'our dental care'
      : (isTechOrTraining ? 'our training program' : (isHospitality ? 'our stay and dining' : 'our experience'));
    const sName = trendingKw || defaultTopic;
    const bName = businessName;
    const themesStr = chips.length > 0 ? chips.join(', ') : '';

    if (currentRating >= 4) {
      if (isTechOrTraining && seed === 0 && chips.length === 0 && (!keywords || keywords.length === 0)) {
        return 'The training experience was helpful. The sessions and practical learning supported my understanding. Thank you to the team.';
      }

      // ── Tech & Training openers ──
      const techHighOpeners = [
        `Outstanding technical experience with ${bName}!`,
        `Really glad we chose ${bName} for ${sName} — thoroughly practical and structured.`,
        `Recently learned with ${bName} for ${sName} and were truly impressed with the mentorship.`,
        `Extremely satisfied with the expertise and placement support at ${bName}.`,
        `Cannot recommend ${bName} enough for anyone looking for hands-on skills in tech!`,
        `Had a very productive and insightful learning journey with ${bName}!`,
        `Top-notch faculty and very responsive guidance from the mentors at ${bName}.`,
        `Best training institute experience — ${bName} exceeded all expectations.`
      ];

      // ── Dental openers ──
      const dentalHighOpeners = [
        `Outstanding dental care at ${bName}!`,
        `Really glad we chose ${bName} for ${sName} — absolutely worth it.`,
        `Recently visited ${bName} for ${sName} and were thoroughly impressed.`,
        `Extremely satisfied with the professionalism and care provided at ${bName}.`,
        `Cannot recommend ${bName} enough for anyone needing quality dental care!`,
        `Had a comfortable and stress-free experience at ${bName}!`,
        `Top-notch dental expertise and a very warm, caring team at ${bName}.`,
        `Best dental clinic experience we've had — ${bName} exceeded all expectations.`
      ];

      // ── Hospitality openers ──
      const hospHighOpeners = [
        `Outstanding experience at ${bName}!`,
        `Honestly one of our best stays and dining experiences at ${bName}!`,
        `Recently visited ${bName} for ${sName} and were truly impressed.`,
        `Extremely satisfied with the hospitality and service provided by ${bName}.`,
        `Cannot recommend ${bName} enough for anyone visiting the area!`,
        `Had a wonderful and memorable time with family at ${bName}!`,
        `Top-notch hospitality, great food, and attentive support from the team at ${bName}.`,
        `Really glad we chose ${bName} for ${sName}.`
      ];

      const highOpeners = isTechOrTraining
        ? techHighOpeners
        : (isDental ? dentalHighOpeners : hospHighOpeners);

      // ── Bodies with themes (shared, theme-driven) ──
      const highBodiesWithThemes = [
        `The focus on ${themesStr.toLowerCase()} was evident throughout our entire visit. Everything was handled seamlessly.`,
        `What really stood out was their attention to ${themesStr.toLowerCase()}. The staff is very courteous, warm, and responsive.`,
        `Their dedication to ${themesStr.toLowerCase()} made our experience extra special. Very comfortable and memorable.`,
        `Prompt coordination and high-standard ${themesStr.toLowerCase()}. They deliver genuine care and quality at every step.`,
        isDental
          ? `From reception to treatment, their ${themesStr.toLowerCase()} was truly remarkable.`
          : (isTechOrTraining
            ? `From course onboarding to live projects, their ${themesStr.toLowerCase()} was truly remarkable.`
            : `From check-in to dining, their ${themesStr.toLowerCase()} was truly remarkable.`)
      ];

      // ── Bodies without themes ──
      const techHighBodiesWithoutThemes = [
        `Clear concepts, real-world live projects, and dedicated doubt resolution. The faculty is extremely supportive and experienced.`,
        `The practical guidance and career placement support exceeded all expectations. A truly dependable learning academy.`,
        `Structured curriculum, hands-on coding sessions, and excellent project-based mentorship.`,
        `Great value for career growth with complete individual attention from mentors.`
      ];

      const dentalHighBodiesWithoutThemes = [
        `Painless procedure, modern equipment, and a very caring team. They made the entire experience completely stress-free.`,
        `The cleanliness, professionalism, and quality of treatment exceeded all expectations. A truly trustworthy clinic.`,
        `Very smooth appointment process, comfortable clinic environment, and a thoroughly patient-focused team.`,
        `Great value, thorough explanations before each procedure, and genuinely caring doctors.`
      ];

      const hospHighBodiesWithoutThemes = [
        `Prompt service, delicious food, and very courteous staff. They made our whole experience completely hassle-free and enjoyable.`,
        `The cleanliness and quality exceeded all expectations. A truly dependable place for family and friends.`,
        `Very smooth coordination, comfortable environment, and a thoroughly guest-focused team.`,
        `Great value for money, wonderful ambiance, and courteous service.`
      ];

      const highBodiesWithoutThemes = isTechOrTraining
        ? techHighBodiesWithoutThemes
        : (isDental ? dentalHighBodiesWithoutThemes : hospHighBodiesWithoutThemes);

      // ── Closers ──
      const techHighClosers = [
        `5 stars well deserved!`,
        `Highly recommended for anyone looking to upskill and build a great tech career!`,
        `Grateful for the entire team and looking forward to applying these skills.`,
        `Keep up the fantastic work! A solid 10/10 training program.`,
        `Gladly giving 5 stars for their exceptional mentorship and support.`,
        `Truly value the learning experience and career guidance provided!`
      ];

      const dentalHighClosers = [
        `5 stars — well deserved!`,
        `Highly recommended to anyone looking for quality, painless dental care!`,
        `Will definitely be returning for all future dental needs.`,
        `Keep up the fantastic work! A solid 10/10 from us.`,
        `Gladly giving 5 stars for their exceptional care and professionalism.`,
        `Looking forward to my next visit with confidence!`
      ];

      const hospHighClosers = [
        `5 stars well deserved!`,
        `Highly recommended to anyone looking for comfort and top hospitality!`,
        `Will definitely visit again with friends and family.`,
        `Keep up the fantastic work! A solid 10/10 from us.`,
        `Gladly giving 5 stars for their exceptional service.`,
        `Looking forward to visiting again soon!`
      ];

      const highClosers = isTechOrTraining
        ? techHighClosers
        : (isDental ? dentalHighClosers : hospHighClosers);

      const highBodies = chips.length > 0 ? highBodiesWithThemes : highBodiesWithoutThemes;
      const opIdx = seed % highOpeners.length;
      const bdIdx = seed % highBodies.length;
      const clIdx = seed % highClosers.length;

      const kwPhrase = activeKwList && activeKwList.length > 0
        ? `Their specialized focus on ${activeKwList.slice(0, 2).join(' & ')} was truly outstanding.`
        : '';
      const baseBody = highBodies[bdIdx];
      const combinedBody = kwPhrase ? `${kwPhrase} ${baseBody}` : baseBody;

      return `${highOpeners[opIdx]} ${combinedBody} ${highClosers[clIdx]}`;
    } else {
      const techLowOpeners = [
        `Sharing constructive feedback regarding our training experience with ${sName} at ${bName}.`,
        `Providing direct feedback for the institute management regarding our course.`,
        `Wanted to highlight a few areas for improvement concerning ${sName} at ${bName}.`,
        `Writing to share our experience directly with the academy management.`
      ];

      const dentalLowOpeners = [
        `Sharing feedback regarding our recent dental experience at ${bName}.`,
        `Providing direct feedback for the management at ${bName}.`,
        `Wanted to highlight a few areas for improvement with ${sName} at ${bName}.`,
        `Writing to share our experience directly with the clinic management.`
      ];

      const hospLowOpeners = [
        `Sharing constructive feedback regarding our recent experience with ${sName} at ${bName}.`,
        `Providing direct feedback for management regarding our visit.`,
        `Wanted to highlight a few areas for improvement concerning ${sName} at ${bName}.`,
        `Writing to share our experience directly with the management.`
      ];

      const lowOpeners = isTechOrTraining
        ? techLowOpeners
        : (isDental ? dentalLowOpeners : hospLowOpeners);

      const lowBodies = chips.length > 0
        ? [
          `While certain aspects were good, specific points regarding ${themesStr.toLowerCase()} did not meet our expectations.`,
          `We encountered issues particularly around ${themesStr.toLowerCase()}, which caused inconvenience.`,
          `There is noticeable room for improvement in ${themesStr.toLowerCase()} and overall coordination.`
        ]
        : isDental
          ? [
            `The waiting time and communication could be improved significantly.`,
            `There were some coordination difficulties during our appointment.`,
            `The experience did not fully meet our expectations for a dental visit.`
          ]
          : (isTechOrTraining
            ? [
              `The pace and topic depth could be improved significantly.`,
              `There were some scheduling and coordination difficulties during the sessions.`,
              `The training did not fully meet standard industry expectations.`
            ]
            : [
              `The service speed and coordination were below what was expected.`,
              `There were service delays and communication difficulties during our visit.`,
              `The experience did not meet standard expectations.`
            ]);

      const lowClosers = [
        `Hoping management takes this feedback positively to address these gaps.`,
        `Appreciate if the team looks into this to improve satisfaction.`,
        `Sharing this directly so necessary adjustments can be made.`
      ];

      const opIdx = seed % lowOpeners.length;
      const bdIdx = seed % lowBodies.length;
      const clIdx = seed % lowClosers.length;

      return `${lowOpeners[opIdx]} ${lowBodies[bdIdx]} ${lowClosers[clIdx]}`;
    }
  };

  // Extension sync helper & persistent draft storage
  const syncDraftToExtension = (text, explicitRating) => {
    const currentRating = explicitRating !== undefined ? explicitRating : rating;
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    // 1. Broadcast window messages to extension content script (multiple event formats supported)
    try {
      const payload = {
        type: 'REDES_STORE_DRAFT',
        text: cleanText,
        rating: currentRating,
        businessName,
        customerName: customerName.trim() || undefined,
        autoSubmit: true,
        updatedAt: Date.now()
      };
      window.postMessage(payload, '*');
      window.postMessage({ ...payload, type: 'REDES_POST_DRAFT' }, '*');
      window.postMessage({
        type: 'REDES_REVIEW_DRAFT_UPDATE',
        payload: {
          draft: cleanText,
          rating: currentRating,
          businessName,
          authorName: customerName.trim() || undefined
        }
      }, '*');
    } catch { }

    // 2. Persist to localStorage for cross-page extension pickup & fallback
    try {
      localStorage.setItem('redes_latest_review_draft', JSON.stringify({
        text: cleanText,
        rating: currentRating,
        businessName,
        customerName: customerName.trim() || undefined,
        updatedAt: Date.now()
      }));
    } catch { }
  };

  // Auto-select initial top trending keyword from 7-day cycle
  useEffect(() => {
    if (campaign?.trending_keywords?.length > 0 && selectedKeywords.length === 0) {
      const topKw = campaign.trending_keywords[0];
      setSelectedKeywords([topKw]);
      if (!hasGeneratedAi) {
        const fresh = generateFreshAiReview(rating, selectedChips, 0, [topKw]);
        setReviewText(fresh);
        syncDraftToExtension(fresh, rating);
      }
    }
  }, [campaign?.trending_keywords]);

  // Initialize review text
  useEffect(() => {
    if (!hasGeneratedAi && reviewText === '') {
      const initialText = generateFreshAiReview(rating, selectedChips, 0, selectedKeywords);
      setReviewText(initialText);
      syncDraftToExtension(initialText, rating);
    }
  }, [rating, selectedChips, hasGeneratedAi, selectedKeywords]);

  // Handler: Generate fresh AI Review
  const handleGenerateAiReview = () => {
    setIsGeneratingAi(true);
    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    setHasGeneratedAi(true);

    setTimeout(() => {
      const freshText = generateFreshAiReview(rating, selectedChips, nextSeed, selectedKeywords);
      setReviewText(freshText);
      syncDraftToExtension(freshText, rating);
      setIsGeneratingAi(false);
    }, 220);
  };

  // Toggle 7-Day Trending Keyword chip
  const toggleKeyword = (kw) => {
    const isSelected = selectedKeywords.includes(kw);
    const newKws = isSelected ? selectedKeywords.filter(k => k !== kw) : [...selectedKeywords, kw];
    setSelectedKeywords(newKws);

    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    const updated = generateFreshAiReview(rating, selectedChips, nextSeed, newKws);
    setReviewText(updated);
    syncDraftToExtension(updated, rating);
  };

  // Toggle highlight theme chip
  const toggleChip = (chip) => {
    const isSelected = selectedChips.includes(chip);
    const newChips = isSelected ? selectedChips.filter(c => c !== chip) : [...selectedChips, chip];
    setSelectedChips(newChips);

    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    const updated = generateFreshAiReview(rating, newChips, nextSeed, selectedKeywords);
    setReviewText(updated);
    syncDraftToExtension(updated, rating);
  };

  // Safe Google Review URL resolver using validated business destination
  const getGoogleReviewUrl = () => {
    const fallbackSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${businessName} ${businessCity}`.trim())}`;
    const rawUrl = campaign?.google_review_url || fallbackSearch;
    const validated = validateGoogleReviewUrl(rawUrl, {
      businessName,
      city: businessCity,
      address: businessAddress
    });
    return validated.url;
  };

  // Safe clipboard copy
  const copyToClipboard = async (text) => {
    if (!text) return false;
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch { }
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
      } catch { }
    }
    return success;
  };

  const handleRatingSelect = (star) => {
    setRating(star);
    const nextSeed = aiVariationSeed + 1;
    setAiVariationSeed(nextSeed);
    const freshText = generateFreshAiReview(star, selectedChips, nextSeed);
    setReviewText(freshText);
    syncDraftToExtension(freshText, star);
  };

  // Record click in campaign analytics & redirect customer to Google Review Page
  const triggerGoogleRedirect = (targetUrl) => {
    const rawUrl = targetUrl || getGoogleReviewUrl();
    const activeText = (reviewText || '').trim() || 'Outstanding experience and wonderful service!';
    const currentRating = rating || 5;

    // Attach review draft to URL hash and query param so content-google.js reads it instantly with 0ms latency
    let finalUrl = rawUrl;
    try {
      const hashParams = new URLSearchParams();
      hashParams.set('redes_text', activeText);
      hashParams.set('redes_rating', String(currentRating));
      hashParams.set('redes_auto', '1');

      const hashStr = hashParams.toString();
      if (finalUrl.includes('#')) {
        finalUrl = `${finalUrl}&${hashStr}`;
      } else {
        finalUrl = `${finalUrl}#${hashStr}`;
      }
    } catch (e) {
      finalUrl = rawUrl;
    }

    // 1. Record click in campaign analytics
    api.trackCampaignEvent(campaign?.id || slug || 'default', 'REVIEW_DESTINATION_CLICKED', {
      rating: currentRating,
      destination: 'google_reviews',
      targetUrl: finalUrl,
      businessId: campaign?.business_id
    }).catch((err) => console.warn('[FEEDBACK_ANALYTICS] Tracking notice:', err));

    // 2. Open Google Review Page
    try {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('[FEEDBACK] Direct redirect notice:', e);
    }
  };

  // Handle primary action button click (directly opens real Google Review page)
  const handlePostReview = async (e) => {
    if (e) e.preventDefault();
    setPosting(true);

    const activeText = reviewText.trim() || 'Outstanding experience and wonderful service!';

    // 1. Copy review text to clipboard
    await copyToClipboard(activeText);
    syncDraftToExtension(activeText, rating);
    setCopied(true);
    setCopySuccessToast(true);
    setTimeout(() => setCopySuccessToast(false), 5000);

    const targetUrl = getGoogleReviewUrl();

    // If already completed once, directly open Google and guide sheet with zero lag
    if (completed && rating >= 4) {
      setShowGuideSheet(true);
      triggerGoogleRedirect(targetUrl);
      return;
    }

    // 2. Track analytics & record review in database
    if (campaign?.id || slug) {
      api.trackCampaignEvent(campaign?.id || slug || 'default', 'REVIEW_DESTINATION_CLICKED', {
        rating,
        destination: rating >= 4 ? 'google_reviews' : 'private_feedback',
        targetUrl: rating >= 4 ? targetUrl : null,
        businessId: campaign?.business_id
      }).catch(() => { });
    }

    try {
      if (rating >= 4) {
        const postRes = await api.autoPostReview({
          campaignId: campaign?.id || slug,
          businessId: campaign?.business_id || campaign?.businessId,
          customerName: customerName.trim() || 'Verified Customer',
          rating,
          reviewText: activeText,
          selectedDraft: activeText,
          themesSelected: selectedChips,
          destination: 'google'
        });
        if (postRes?.reviewId) {
          setSavedReviewId(postRes.reviewId);
        }
        setReviewAdded(true);
      } else {
        await api.submitFeedback({
          campaignId: campaign?.id || slug,
          businessId: campaign?.business_id || campaign?.businessId,
          customerName: customerName.trim() || 'Valued Guest',
          rating,
          feedbackText: activeText,
          themesSelected: selectedChips,
          proceededToGoogle: false
        });
        setReviewAdded(true);
      }
    } catch (err) {
      console.warn('[FEEDBACK] Sync notice:', err);
    } finally {
      setPosting(false);
    }

    // 3. Open the real Google Review Page & Show Guide Sheet
    if (rating >= 4) {
      setShowGuideSheet(true);
      setTimeout(() => {
        triggerGoogleRedirect(targetUrl);
      }, 300);
      setCompleted(true);
    } else {
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#1a73e8] border-t-transparent animate-spin"></div>
          <span className="text-xs font-bold text-slate-600">Loading feedback experience...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-100 text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">

      {/* Toast Notification */}
      {copySuccessToast && (
        <div className="fixed top-5 z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Review text copied! Opening Google review form...</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">


        {/* Header: Business Branding (Left-Aligned per screenshot) */}
        <div className="space-y-3">
          <div className="flex items-start gap-3.5">
            {/* Blue Rounded Business Icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            {/* Business Title & Address */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {businessName}
              </h1>
              {businessAddress && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {businessAddress}
                </p>
              )}
            </div>
          </div>

          {/* Badges: Verified Google Profile, Website, City */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Google Profile</span>
            </div>

            {displayWebsite && (
              <a
                href={businessWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1a73e8] border border-blue-200/80 text-[11px] font-semibold hover:bg-blue-100 transition"
              >
                <Globe className="w-3 h-3 text-[#1a73e8]" />
                <span>{displayWebsite}</span>
                <ExternalLink className="w-2.5 h-2.5 text-[#1a73e8]" />
              </a>
            )}

            {businessCity && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{businessCity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Completed State Confirmation for low ratings */}
        {completed && rating < 4 ? (
          <div className="py-8 px-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-emerald-900 text-base">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              Your feedback has been privately sent directly to the management of <strong>{businessName}</strong>. We value your voice and are committed to continuous improvement.
            </p>
            <button
              type="button"
              onClick={() => {
                setCompleted(false);
                setRating(5);
              }}
              className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          /* Main Interactive Feedback Form */
          <div className="space-y-5">

            {/* Interactive Star Rating Box */}
            <div className="text-center py-4 sm:py-5 px-6 rounded-2xl border border-blue-100/90 bg-blue-50/20 space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                How was your experience?
              </h2>

              <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingSelect(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform transform hover:scale-115 focus:outline-none cursor-pointer"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${(hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-200'
                        }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-xs sm:text-sm font-bold text-slate-700 pt-1">
                {rating === 5 && 'Exceptional (5/5)'}
                {rating === 4 && 'Very Good (4/5)'}
                {rating === 3 && 'Average (3/5)'}
                {rating === 2 && 'Needs Improvement (2/5)'}
                {rating === 1 && 'Disappointing (1/5)'}
              </div>

              {rating <= 3 && (
                <p className="text-[11px] text-amber-700 mt-1 font-medium bg-amber-50 py-1 px-2.5 rounded-lg border border-amber-200/60 inline-block">
                  🔒 Your rating routes directly to private management so we can make this right.
                </p>
              )}
            </div>



            {/* What stood out? Experience Themes */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-900 block">
                What stood out? (Tap 1 or more)
              </label>
              <div className="flex flex-wrap gap-2">
                {quickChips.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-300 ring-1 ring-blue-500/20'
                          : 'bg-blue-50/40 hover:bg-blue-50 text-slate-600 border border-slate-200'
                        }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Top Trending Keywords (Tap to Add) */}
            {(campaign?.trending_keywords?.length > 0 || campaign?.weekly_cycle_info?.topKeywords?.length > 0) && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>7-Day Top Trending Keywords:</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Google 3-Pack Boost</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(campaign?.trending_keywords || campaign?.weekly_cycle_info?.topKeywords || []).map((kw) => {
                    const isSelected = selectedKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleKeyword(kw)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${isSelected
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300 transform scale-102'
                            : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/90'
                          }`}
                      >
                        <Flame className={`w-3 h-3 ${isSelected ? 'text-amber-100' : 'text-amber-500'}`} />
                        <span>{kw}</span>
                        {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Your Review Draft Box with Inline "Write with AI" Button */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1a73e8]" />
                <span>Your Review Draft:</span>
              </label>

              {/* Textarea Container Box */}
              <div className="relative border border-slate-200/90 rounded-2xl bg-white p-3.5 sm:p-4 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition shadow-xs">
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => {
                    setReviewText(e.target.value);
                    syncDraftToExtension(e.target.value);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                  placeholder="The training experience was helpful. The sessions and practical learning supported my understanding..."
                />

                {/* Inline "Write with AI" Pill Button & Google SEO Indicator */}
                <div className="flex items-center justify-between pt-1">
                  {rating >= 4 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Google 3-Pack SEO Optimized</span>
                    </span>
                  ) : (
                    <span></span>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateAiReview}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-60 shadow-xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-[#1a73e8] ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAi ? 'Writing...' : 'Write with AI'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Customer Name */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Your Name (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mahesh Vaishnav"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 space-y-3">
              {rating >= 4 ? (
                <button
                  type="button"
                  disabled={posting}
                  onClick={handlePostReview}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.005] active:scale-98"
                >
                  {posting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      {/* White circular badge with Google multicolor G */}
                      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </span>
                      <span>
                        {completed ? 'Review Copied! Tap to Open Google Again' : `Post Review on Google (${rating}★)`}
                      </span>
                      <ExternalLink className="w-4 h-4 shrink-0 text-white/90" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={posting}
                  onClick={handlePostReview}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Send Private Feedback to Management</span>
                </button>
              )}

              {completed && rating >= 4 && (
                <div className="space-y-2 animate-in fade-in duration-200 pt-1">
                  <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Review text copied & Google opened!</span>
                    </div>
                    <p className="text-[11px] text-blue-600 leading-relaxed">
                      Google Review dialog open hone par 5★ chunein, paste karein aur <strong>Post</strong> karein!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGuideSheet(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>💡 Open 3-Step Visual Guide</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 3-Step Visual Guidance Bottom Sheet & Modal (Mobile + Desktop) */}
      <ReviewGuideBottomSheet
        isOpen={showGuideSheet}
        onClose={() => setShowGuideSheet(false)}
        businessName={businessName}
        reviewText={reviewText}
        rating={rating}
        googleUrl={getGoogleReviewUrl()}
        onOpenGoogle={() => triggerGoogleRedirect()}
        onCopyAgain={() => copyToClipboard(reviewText)}
      />
    </div>
  );
};

export default CustomerFeedbackPage;
