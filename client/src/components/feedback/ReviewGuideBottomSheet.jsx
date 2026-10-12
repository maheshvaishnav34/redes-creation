import React, { useState } from 'react';
import {
  Star,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Smartphone,
  Send,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

/**
 * ReviewGuideBottomSheet
 * 
 * Interactive 3-step visual guidance bottom sheet & modal that guides customers
 * to select 5-stars, paste their pre-copied review, and tap Post on Google.
 * Works seamlessly across mobile (Android/iOS) and desktop.
 */
export const ReviewGuideBottomSheet = ({
  isOpen,
  onClose,
  businessName = 'Business',
  reviewText = '',
  rating = 5,
  googleUrl = '',
  onOpenGoogle,
  onCopyAgain
}) => {
  const [justCopied, setJustCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyClick = async (e) => {
    if (e) e.stopPropagation();
    if (onCopyAgain) {
      await onCopyAgain();
    }
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2500);
  };

  const handleLaunchGoogle = (e) => {
    if (e) e.stopPropagation();
    if (onOpenGoogle) {
      onOpenGoogle();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Click outside to close backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close guide backdrop"
      />

      {/* Sheet Container: Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-guide-title"
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 id="review-guide-title" className="text-sm font-black text-slate-900 leading-tight">
                Quick 3-Step Google Post Guide
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">
                {businessName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Review Copied Banner + Snippet Card */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-blue-50/50 to-indigo-50/40 border border-emerald-200/80 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Review Copied to Clipboard!</span>
              </div>
              <button
                type="button"
                onClick={handleCopyClick}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                {justCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy Again</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed font-sans">
              "{reviewText}"
            </p>
          </div>

          {/* 3 Step Visual Cards */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-1">
              Follow These 3 Steps on Google:
            </div>

            {/* Step 1 Card: 5 Star Rating */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Select 5 Stars</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400 animate-pulse" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Google Maps khulne par 5th star par tap karein.
                </p>
              </div>
            </div>

            {/* Step 2 Card: Paste Review */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Paste Your Review</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[10px] font-bold text-blue-800">
                    1-Tap Paste
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Review box par tap karein aur keyboard ke upar <strong>[Paste]</strong> ya <strong>Ctrl+V</strong> dabayein.
                </p>
              </div>
            </div>

            {/* Step 3 Card: Tap Post */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Tap "Post" Button</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1a73e8] text-[10px] font-black text-white shadow-xs">
                    Post
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Neela <strong>Post</strong> button dabakar review submit karein!
                </p>
              </div>
            </div>

          </div>

          {/* Device Smart Note */}
          <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-700">
            <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span>Mobile par Gboard keyboard ke upar automatic <strong>Paste</strong> bubble aayega!</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button
            type="button"
            onClick={handleLaunchGoogle}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Open Google Maps & Post Review</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Direct Location Link
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              Done / Close Guide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReviewGuideBottomSheet;
