import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ThumbsUp,
  Globe,
  Phone,
  MapPin,
  Send,
  Building2,
  Sparkles,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import { api } from '../services/api.js';

export const CustomerFeedbackPage = () => {
  const { slug } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [serviceExperienced, setServiceExperienced] = useState('');
  const [customServiceMode, setCustomServiceMode] = useState(false);
  const [customService, setCustomService] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [themes, setThemes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftOptions, setDraftOptions] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await api.getPublicCampaign(slug || 'default');
        const camp = res.campaign || null;
        setCampaign(camp);

        // Normalize services array
        let initialServices = [];
        if (Array.isArray(camp?.services) && camp.services.length > 0) {
          initialServices = camp.services;
        } else if (typeof camp?.services === 'string') {
          try {
            initialServices = JSON.parse(camp.services);
          } catch {
            initialServices = camp.services.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        if (initialServices && initialServices.length > 0) {
          setServiceExperienced(initialServices[0]);
        }
      } catch (err) {
        console.error('[FEEDBACK] Error loading campaign details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  const toggleTheme = (themeName) => {
    setThemes(prev =>
      prev.includes(themeName) ? prev.filter(t => t !== themeName) : [...prev, themeName]
    );
  };

  const businessName = campaign?.business_name || campaign?.name || 'Redes Creation';

  // Smart drafts generator: Prioritizes whatever the user added!
  const generateDraftOptions = (rawFeedback, bName, srv, thms) => {
    const hasUserText = rawFeedback && rawFeedback.trim().length > 0;
    const userTextClean = hasUserText ? rawFeedback.trim() : '';

    if (hasUserText) {
      return [
        {
          title: 'Option 1 • Your Words (Direct & Authentic)',
          badge: 'Your Exact Review',
          text: userTextClean
        },
        {
          title: 'Option 2 • AI Polished & Detailed',
          badge: 'Recommended',
          text: `${userTextClean.replace(/[.!?]+$/, '')}. I had an excellent experience with ${bName}${srv ? ` for ${srv}` : ''}.${thms && thms.length > 0 ? ` Really appreciated their ${thms.join(' and ')}.` : ''} Highly recommended!`
        },
        {
          title: 'Option 3 • 5-Star Local Recommendation',
          badge: 'Google Ranking Boost',
          text: `5/5 stars for ${bName}! ${userTextClean.replace(/[.!?]+$/, '')}. Professional team, prompt communication, and high quality service. Will definitely recommend them to others.`
        }
      ];
    } else {
      return [
        {
          title: 'Option 1 • Concise & Direct',
          badge: 'Quick & Simple',
          text: `Great experience with ${bName}! Their ${thms && thms.length > 0 ? thms.join(' and ') : 'service'} was top-notch. Highly recommended for ${srv || 'quality work'}.`
        },
        {
          title: 'Option 2 • Detailed & Balanced',
          badge: 'Recommended',
          text: `I recently visited ${bName} for ${srv || 'their service'}. Really impressed by their ${thms && thms.length > 0 ? thms.slice(0, 2).join(' and ') : 'professional staff and timely assistance'}. Everything was smooth, transparent, and high quality!`
        },
        {
          title: 'Option 3 • Friendly & Warm',
          badge: '5-Star Praise',
          text: `Super happy with my experience at ${bName}! The team is attentive, polite, and great at what they do (${(thms && thms[0]) || 'excellent service'}). 5 stars well deserved!`
        }
      ];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const finalService = customServiceMode && customService.trim() ? customService.trim() : serviceExperienced;

    try {
      await api.submitFeedback({
        campaignId: campaign?.id || slug,
        customerName: customerName.trim() || 'Valued Client',
        customerPhone: customerPhone.trim() || null,
        referenceId: referenceId.trim() || null,
        rating,
        serviceExperienced: finalService,
        feedbackText: feedbackText.trim(),
        themesSelected: themes,
        proceededToGoogle: rating >= 4
      });

      // Generate personalized drafts that guarantee the user's text is featured
      const drafts = generateDraftOptions(feedbackText, businessName, finalService, themes);
      setDraftOptions(drafts);
      setSelectedDraft(drafts[0].text);
      setSubmitted(true);
    } catch (err) {
      console.error('[FEEDBACK] Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulletproof clipboard copy with synchronous fallback
  const copyToClipboard = async (text) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn('[CLIPBOARD] navigator.clipboard error:', err);
      }
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
      } catch (err) {
        console.warn('[CLIPBOARD] fallback error:', err);
      }
    }
    return success;
  };

  const handleCopyAndRedirect = async () => {
    const textToCopy = selectedDraft || feedbackText.trim();
    if (textToCopy) {
      await copyToClipboard(textToCopy);
      setCopiedDraft(true);
    }

    const targetUrl =
      campaign?.google_review_url ||
      (campaign?.google_place_id
        ? `https://search.google.com/local/writereview?placeid=${campaign.google_place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`);

    window.open(targetUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#034bc0] border-t-transparent animate-spin"></div>
          <span className="text-xs font-bold text-slate-600">Loading verified feedback portal...</span>
        </div>
      </div>
    );
  }

  // Derive business details priority: Campaign specific > business location > fallback
  const campaignTitle = campaign?.name && campaign?.name !== businessName ? campaign.name : null;
  const rawWebsite = campaign?.website || campaign?.business_website || 'https://redescreation.in';
  const businessWebsite = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
  const displayWebsite = businessWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const businessPhone = campaign?.phone || campaign?.business_phone || '+91 79 4890 5500';
  const businessCity = campaign?.city || 'Ahmedabad, India';

  // Services list
  let servicesList = [];
  if (Array.isArray(campaign?.services) && campaign.services.length > 0) {
    servicesList = campaign.services;
  } else if (typeof campaign?.services === 'string' && campaign.services.trim()) {
    try {
      servicesList = JSON.parse(campaign.services);
    } catch {
      servicesList = campaign.services.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const lowerBiz = `${businessName} ${campaign?.name || ''}`.toLowerCase();
  const isTrainingOrTech = lowerBiz.includes('training') || lowerBiz.includes('code') || lowerBiz.includes('institute') || lowerBiz.includes('tech') || lowerBiz.includes('academy') || lowerBiz.includes('software');
  const isHospitality = lowerBiz.includes('dine') || lowerBiz.includes('restaurant') || lowerBiz.includes('cafe') || lowerBiz.includes('food');
  const isDental = lowerBiz.includes('dental') || lowerBiz.includes('clinic') || lowerBiz.includes('teeth');

  if (!servicesList || servicesList.length === 0) {
    if (isTrainingOrTech) {
      servicesList = [
        'Full Stack Web Development',
        'Python Programming',
        'MERN Stack Development',
        'React & Node.js Training',
        'Software Testing & QA',
        'IT Placement Assistance'
      ];
    } else if (isDental) {
      servicesList = [
        'Dental Consultation',
        'Teeth Whitening',
        'Root Canal Treatment',
        'Dental Implants',
        'Orthodontic Aligners'
      ];
    } else if (isHospitality) {
      servicesList = [
        'A La Carte Dining',
        'Banquet Catering',
        'Family Dinners',
        'Private Parties',
        'Special Events'
      ];
    } else {
      servicesList = [
        'Website Designing & Development',
        'Custom Web Applications',
        'SEO & Google Review Optimization',
        'Digital Marketing Support',
        'Technical Maintenance'
      ];
    }
  }

  // Highlight tags tailored to niche
  const highlightTags = isTrainingOrTech
    ? ['Practical Training', 'Expert Faculty', 'Live Project Work', 'Doubt Clearing', 'Placement Support', 'Course Curriculum']
    : isHospitality
      ? ['Food Quality', 'Attentive Staff', 'Ambiance & Music', 'Quick Service', 'Cleanliness', 'Hospitality']
      : isDental
        ? ['Painless Treatment', 'Modern Equipment', 'Caring Doctors', 'Hygiene & Cleanliness', 'Clear Explanation']
        : ['Quality of Work', 'Clear Communication', 'Fast Turnaround', 'Creative Design', 'Support & Guidance', 'Professionalism'];

  const targetGoogleUrl =
    campaign?.google_review_url ||
    (campaign?.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${campaign.google_place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <img 
              src="/redes-logo.png" 
              alt="Redes Creation" 
              className="h-10 sm:h-12 w-auto object-contain mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div>
            {campaignTitle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#034bc0] border border-blue-200 mb-2">
                <Sparkles className="w-3 h-3 text-[#034bc0]" />
                <span>{campaignTitle}</span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {businessName}
            </h1>
            
            {/* Clickable Verified Official Website Link */}
            {businessWebsite && (
              <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                <a
                  href={businessWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-bold transition-all shadow-xs cursor-pointer group"
                  title={`Visit official website: ${businessWebsite}`}
                >
                  <Globe className="w-3.5 h-3.5 text-[#034bc0]" />
                  <span>{displayWebsite}</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>

                {businessCity && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {businessCity}
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            We value your genuine feedback. Your review directly helps{' '}
            <strong className="text-slate-900 font-bold">{businessName}</strong> continually maintain the highest standards of quality and service.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Thank You, {customerName || 'Valued Client'}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                {rating >= 4
                  ? `Your feedback has been saved! Take 15 seconds to share it on Google. It directly helps our business grow.`
                  : `Thank you for sharing your candid thoughts. Your remarks have been sent directly to executive management.`}
              </p>
            </div>

            {rating >= 4 ? (
              <div className="pt-2 space-y-4 text-left">
                {/* AI Review Writing Assistant Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#034bc0] uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-[#034bc0]" />
                      <span>Review Draft Options</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                      Based on what you wrote
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select your preferred draft below or edit it before posting to Google:
                  </p>

                  {/* 3 AI Draft Options */}
                  <div className="space-y-2">
                    {draftOptions.map((draft, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDraft(draft.text)}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                          selectedDraft === draft.text
                            ? 'bg-white border-[#034bc0] ring-2 ring-[#034bc0]/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-[#034bc0] text-[11px] mb-1 flex items-center justify-between">
                          <span>{draft.title}</span>
                          {selectedDraft === draft.text ? (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">Click to use</span>
                          )}
                        </div>
                        <p className="text-slate-800 leading-relaxed font-normal">{draft.text}</p>
                      </button>
                    ))}
                  </div>

                  {/* Editable Review Draft Box */}
                  <div className="pt-1 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-[#034bc0]" />
                        <span>Edit your review before copying:</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">You can modify anything here</span>
                    </label>
                    <textarea
                      rows={3}
                      value={selectedDraft}
                      onChange={(e) => setSelectedDraft(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 leading-relaxed font-medium"
                      placeholder="Your review text..."
                    />
                  </div>
                </div>

                {/* Clear Step-by-Step Guidance Banner When Copied */}
                {copiedDraft && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2.5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Review Draft Copied to Clipboard!</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Google Review page is open in the other tab. Simply <strong>PASTE (Ctrl+V / Long-Press → Paste)</strong> in the review box, select 5 stars, and click <strong>Post</strong>.
                    </p>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-xs font-mono text-slate-800 line-clamp-3">
                      "{selectedDraft}"
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(selectedDraft);
                          setCopiedDraft(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text Again</span>
                      </button>
                      <a
                        href={targetGoogleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Google Tab Again</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="space-y-2 pt-1">
                  {campaign?.post_review_enabled !== false && (
                    <button
                      type="button"
                      onClick={handleCopyAndRedirect}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{copiedDraft ? 'Copied! Tap to Open Google Again' : `Copy Draft & Post for ${businessName} on Google`}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  {businessWebsite && (
                    <a
                      href={businessWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#034bc0]" />
                      <span>Visit Official Website ({displayWebsite})</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 font-medium space-y-2">
                <p>A senior manager has received your remarks. If you'd like to talk directly:</p>
                {businessPhone && (
                  <a
                    href={`tel:${businessPhone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-800" />
                    <span>Call Direct: {businessPhone}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Interactive 1-5 Star Rating */}
            <div className="text-center space-y-2 py-3 bg-slate-50/80 rounded-2xl border border-slate-200 p-4">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                How was your overall experience?
              </label>
              
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-xs sm:text-sm font-black text-slate-900 block mt-1">
                {rating === 5 && '⭐⭐⭐⭐⭐ Outstanding Experience!'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good Service'}
                {rating === 3 && '⭐⭐⭐ Average / Mixed Experience'}
                {rating === 2 && '⭐⭐ Needs Improvement'}
                {rating === 1 && '⭐ Disappointing Experience'}
              </span>
            </div>

            {/* Service Selection with Custom Input Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">Service Experienced</label>
                <button
                  type="button"
                  onClick={() => setCustomServiceMode(!customServiceMode)}
                  className="text-[11px] font-bold text-[#034bc0] hover:underline cursor-pointer"
                >
                  {customServiceMode ? '← Pick from list' : '+ Enter custom service'}
                </button>
              </div>

              {customServiceMode ? (
                <input
                  type="text"
                  placeholder="e.g. Full Stack Web Development or Python Course"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20"
                />
              ) : (
                <select
                  value={serviceExperienced}
                  onChange={(e) => setServiceExperienced(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20"
                >
                  {servicesList.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Experience Highlight Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">What stood out to you?</label>
              <div className="flex flex-wrap gap-2">
                {highlightTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTheme(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      themes.includes(tag)
                        ? 'bg-blue-100 text-[#034bc0] border border-blue-300 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Feedback Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Tell us more about your experience:
              </label>
              <textarea
                rows={3}
                required
                placeholder="Share details of your experience with us (what you loved, faculty/staff, results)..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium leading-relaxed"
              />
              <span className="text-[10px] text-slate-500 block">
                Whatever you type here will directly form your Google Review draft!
              </span>
            </div>

            {/* Customer Details: Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Phone / WhatsApp (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !feedbackText.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-sm font-black transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Preparing Google Review Draft...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Experience & Get Google Draft</span>
                    <ThumbsUp className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Trust & Verification Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
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
