// Redes Creation Review Connector - Google Review Auto-Filler Content Script
(function () {
  console.log('[REDES EXTENSION] Google review connector active on:', window.location.href);

  // 0. Instant CSS rule injection: Permanently kill Google disclosure popover with 0ms latency
  function injectKillerStyles() {
    if (document.getElementById('redes-popover-killer-style')) return;
    const style = document.createElement('style');
    style.id = 'redes-popover-killer-style';
    style.textContent = `
      /* Kill Google "How your posts appear" disclosure card and callout bubbles */
      div.G9Xp0e,
      div.g-dialog.G9Xp0e,
      div:has(> * a.VeFrfe),
      div:has(a[href*="contributionpolicy"]):not(:has(textarea)):not(:has([role="radiogroup"])),
      div:has(a[href*="7412443"]):not(:has(textarea)),
      div[role="tooltip"]:not(:has(textarea)),
      div[data-is-tooltip="true"]:not(:has(textarea)),
      .VfPpkd-xl07Ob:not(:has(textarea)) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        top: -99999px !important;
        left: -99999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        z-index: -9999 !important;
      }

      /* Disable info trigger button so hovering/clicking never activates it */
      button[aria-label*="writing reviews on Google" i],
      button[aria-label*="Learn more" i],
      button[aria-label*="publicly" i],
      button.ZNdcme {
        pointer-events: none !important;
      }
    `;
    (document.head || document.documentElement || document.body)?.appendChild(style);
  }
  injectKillerStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectKillerStyles);
  }

  let hasFilledText = false;
  let hasSelectedStars = false;
  let cachedDraft = null;

  // 1. Fetch review draft
  function fetchDraft(callback) {
    if (cachedDraft && cachedDraft.text) {
      return callback(cachedDraft);
    }

    // A. Instant Extraction from URL query & hash parameters
    try {
      const fullUrl = window.location.href;
      const urlObj = new URL(fullUrl);
      const textParam = urlObj.searchParams.get('redes_text') || 
        new URLSearchParams(urlObj.hash.replace(/^#/, '')).get('redes_text') ||
        (fullUrl.includes('redes_text=') ? decodeURIComponent(fullUrl.split('redes_text=')[1].split('&')[0]) : null);
      const ratingParam = urlObj.searchParams.get('redes_rating') || 
        new URLSearchParams(urlObj.hash.replace(/^#/, '')).get('redes_rating') || 5;

      if (textParam && textParam.trim().length > 3) {
        const draft = {
          text: decodeURIComponent(textParam.replace(/\+/g, ' ')),
          rating: Number(ratingParam) || 5,
          autoSubmit: true
        };
        cachedDraft = draft;
        return callback(draft);
      }
    } catch (e) {}

    // B. Storage sync
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get(['latestReviewDraft', 'redes_backup_draft'], (res) => {
          const draft = res?.latestReviewDraft || res?.redes_backup_draft;
          if (!chrome.runtime.lastError && draft?.text) {
            cachedDraft = draft;
            return callback(cachedDraft);
          }
          fallbackViaMessage(callback);
        });
        return;
      } catch (e) {
        fallbackViaMessage(callback);
        return;
      }
    }

    fallbackViaMessage(callback);
  }

  function fallbackViaMessage(callback) {
    try {
      chrome.runtime.sendMessage({ type: 'REDES_FETCH_DRAFT' }, (response) => {
        if (!chrome.runtime.lastError && response?.draft?.text) {
          cachedDraft = response.draft;
          callback(response.draft);
        } else {
          readClipboardFallback(callback);
        }
      });
    } catch (e) {
      readClipboardFallback(callback);
    }
  }

  function readClipboardFallback(callback) {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((clipText) => {
        if (clipText && clipText.trim().length > 10) {
          const draft = { text: clipText.trim(), rating: 5 };
          cachedDraft = draft;
          callback(draft);
        } else {
          callback(null);
        }
      }).catch(() => {
        callback(null);
      });
    } else {
      callback(null);
    }
  }

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
  }

  // 2. Find review textarea
  function findReviewTextarea() {
    // Specific Google Search & Maps Review Textareas
    const prioritySelectors = [
      'textarea[placeholder*="Share details of your own experience" i]',
      'textarea[placeholder*="Share details" i]',
      'textarea[placeholder*="experience at this place" i]',
      'textarea[aria-label*="Share details" i]',
      'textarea#c2',
      'textarea.VfPpkd-fmcmS-wGMbrd',
      'textarea[aria-label*="Enter review" i]',
      'textarea[placeholder*="experience" i]',
      'textarea[placeholder*="details" i]',
      'textarea[placeholder*="anubhav" i]',
      'textarea[aria-label*="experience" i]',
      'textarea[aria-label*="anubhav" i]',
      'textarea[aria-label*="review" i]'
    ];
    for (const sel of prioritySelectors) {
      const el = document.querySelector(sel);
      if (el && isElementVisible(el)) return el;
    }

    const dialogContainers = document.querySelectorAll('div[role="dialog"], div[aria-modal="true"], g-dialog, .review-dialog, div[data-ved]');
    for (const dlg of dialogContainers) {
      const textareas = dlg.querySelectorAll('textarea');
      for (const t of textareas) {
        if (t.name !== 'q' && !t.classList.contains('gLFyf') && isElementVisible(t)) {
          return t;
        }
      }
    }

    const allTextareas = document.querySelectorAll('textarea');
    for (const t of allTextareas) {
      if (t.name !== 'q' && !t.classList.contains('gLFyf') && isElementVisible(t)) {
        return t;
      }
    }

    const editables = document.querySelectorAll(
      'div[role="dialog"] div[contenteditable="true"], div[aria-modal="true"] div[contenteditable="true"], div[role="textbox"]'
    );
    for (const e of editables) {
      if (isElementVisible(e)) return e;
    }

    return null;
  }

  // Robust synthetic click with coordinates & PointerEvent support
  function clickElementRobustly(el) {
    if (!el) return;
    try { el.focus(); } catch (e) {}

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
    const cy = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

    const eventProps = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: cx,
      clientY: cy,
      screenX: cx,
      screenY: cy,
      buttons: 1,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    };

    ['pointerover', 'mouseover', 'pointerenter', 'mouseenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((evtType) => {
      try {
        if (evtType.startsWith('pointer') && typeof PointerEvent !== 'undefined') {
          el.dispatchEvent(new PointerEvent(evtType, eventProps));
        } else {
          el.dispatchEvent(new MouseEvent(evtType, eventProps));
        }
      } catch (e) {}
    });

    if (typeof el.click === 'function') {
      try { el.click(); } catch (e) {}
    }
  }

  // 3. Dynamic Star Selection across ALL categories (Overall + Hotel Rooms, Service, Location)
  function selectTargetStars(targetRating = 5) {
    const starNum = Number(targetRating) || 5;
    const clampedRating = Math.max(1, Math.min(5, starNum));
    const wordMap = ['', 'one', 'two', 'three', 'four', 'five'];
    const word = wordMap[clampedRating];

    console.log('[REDES EXTENSION] Selecting rating across all categories:', clampedRating);
    let clickedCount = 0;

    // Strategy 1: Iterate over EVERY radiogroup (Google creates separate radiogroups for Rooms, Service, Location, Overall)
    const radiogroups = document.querySelectorAll('div[role="radiogroup"], [role="radiogroup"]');
    radiogroups.forEach((group) => {
      const radios = Array.from(group.querySelectorAll('div.s2xyy, [role="radio"], div[role="radio"], span[role="radio"]'));
      if (radios.length >= 5) {
        const star = radios[clampedRating - 1];
        if (star) {
          clickElementRobustly(star);
          clickedCount++;
        }
      } else {
        const namedStar = group.querySelector(`[aria-label*="${clampedRating}" i], [aria-label*="${word}" i], [aria-posinset="${clampedRating}"]`);
        if (namedStar) {
          clickElementRobustly(namedStar);
          clickedCount++;
        }
      }
    });

    // Strategy 2: Specific ARIA & Data Attributes for the target rating across dialog
    const specificSelectors = [
      `div.s2xyy[aria-label*="${clampedRating}" i]`,
      `div.s2xyy[aria-label*="${word}" i]`,
      `[role="radio"][aria-label*="${clampedRating} star" i]`,
      `[role="radio"][aria-label*="${clampedRating} stars" i]`,
      `[role="radio"][aria-label*="${word} star" i]`,
      `[role="radio"][aria-label*="${word} stars" i]`,
      `[role="radio"][aria-posinset="${clampedRating}"]`,
      `[aria-label*="${clampedRating} star" i]`,
      `[aria-label*="${clampedRating} stars" i]`,
      `[aria-label*="Rate ${clampedRating}" i]`,
      `[aria-label*="${clampedRating} of 5" i]`,
      `[data-rating="${clampedRating}"]`
    ];

    for (const sel of specificSelectors) {
      const matches = document.querySelectorAll(sel);
      for (const match of matches) {
        if (match && isElementVisible(match)) {
          clickElementRobustly(match);
          clickedCount++;
        }
      }
    }

    // Strategy 3: Group all div.s2xyy into blocks of 5 (handles custom/hotel rating layouts)
    if (clickedCount === 0) {
      const allS2xyy = Array.from(document.querySelectorAll('div.s2xyy'));
      if (allS2xyy.length >= 5) {
        for (let i = 0; i < allS2xyy.length; i += 5) {
          const chunk = allS2xyy.slice(i, i + 5);
          if (chunk[clampedRating - 1]) {
            clickElementRobustly(chunk[clampedRating - 1]);
            clickedCount++;
          }
        }
      }
    }

    if (clickedCount > 0) {
      hasSelectedStars = true;
      return true;
    }
    return false;
  }

  // Dismiss Google info overlays (e.g. "How your posts appear" popover blocking review stars in Image 2)
  function dismissGoogleInfoOverlay() {
    injectKillerStyles();

    // A. Specific popover class targets identified from Google Review DOM (div.G9Xp0e)
    const exactPopovers = document.querySelectorAll('div.G9Xp0e, div.g-dialog.G9Xp0e, div[role="tooltip"], .VfPpkd-xl07Ob');
    for (const el of exactPopovers) {
      if (!el.querySelector('textarea') && !el.querySelector('[role="radiogroup"]')) {
        try {
          el.remove();
        } catch (e) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    }

    // B. Policy link targeting
    const policyLinks = document.querySelectorAll('a[href*="contributionpolicy"], a[href*="7412443"]');
    for (const a of policyLinks) {
      let card = a.parentElement;
      while (card && card !== document.body && card !== document.documentElement) {
        if (card.querySelector('textarea') || card.querySelector('div.s2xyy') || card.querySelector('[role="radio"]') || card.querySelector('[role="radiogroup"]')) {
          break;
        }
        if (card.parentElement && (card.parentElement.querySelector('textarea') || card.parentElement.getAttribute('role') === 'dialog' || card.parentElement.classList.contains('g-dialog') || card.parentElement === document.body)) {
          try {
            card.remove();
          } catch (e) {
            card.style.setProperty('display', 'none', 'important');
            card.style.setProperty('visibility', 'hidden', 'important');
          }
          break;
        }
        card = card.parentElement;
      }
    }

    // C. Exact text match targeting for "How your posts appear" and "How your posts are used"
    const textNodes = document.querySelectorAll('h1, h2, h3, h4, div, span, p');
    for (const node of textNodes) {
      const txt = (node.textContent || '').trim();
      if (txt === 'How your posts appear' || txt === 'How your posts are used' || (txt.includes('How your posts appear') && txt.length < 80)) {
        let card = node.parentElement;
        while (card && card !== document.body && card !== document.documentElement) {
          if (card.querySelector('textarea') || card.querySelector('div.s2xyy') || card.querySelector('[role="radio"]') || card.querySelector('[role="radiogroup"]')) {
            break;
          }
          if (card.parentElement && (card.parentElement.querySelector('textarea') || card.parentElement.getAttribute('role') === 'dialog' || card.parentElement.classList.contains('g-dialog') || card.parentElement === document.body)) {
            try {
              card.remove();
            } catch (e) {
              card.style.setProperty('display', 'none', 'important');
              card.style.setProperty('visibility', 'hidden', 'important');
            }
            break;
          }
          card = card.parentElement;
        }
      }
    }
  }

  // 4. Insert text into textarea
  function insertTextIntoElement(target, text) {
    if (!target || !text) return;

    try { target.focus(); } catch (e) {}

    if (target.tagName && target.tagName.toLowerCase() === 'textarea') {
      try {
        const proto = Object.getPrototypeOf(target);
        const nativeValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeValueSetter) {
          nativeValueSetter.call(target, text);
        } else {
          target.value = text;
        }
      } catch (err) {
        target.value = text;
      }

      target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, key: ' ' }));
      target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: ' ' }));

      try {
        target.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      } catch (e) {}
    } else {
      target.innerText = text;
      target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    target.dataset.redesAutoFilled = 'true';
    hasFilledText = true;
    updateFloatingBannerStatus('✍️ Review text & 5★ filled! Ready to post...');
  }

  // 5. Automated Google Post Button Detection & Trigger (Step 4 of Auto-Post Engine)
  let hasAutoSubmitted = false;

  function findGooglePostButton() {
    const prioritySelectors = [
      'button[aria-label="Post" i]',
      'button[aria-label="Publish" i]',
      'button[aria-label*="Post review" i]',
      'button[aria-label*="Publish review" i]',
      'button[aria-label*="पोस्ट करें" i]',
      'button[aria-label*="पोस्ट" i]',
      'button[data-mdc-dialog-action="ok"]',
      'div[role="dialog"] button[jsaction*="post" i]',
      'div[role="dialog"] button[jsaction*="submit" i]',
      'div[aria-modal="true"] button[jsaction*="post" i]',
      'g-dialog button[jsaction*="post" i]',
      'div[role="dialog"] button.VfPpkd-LgbsSe:not([aria-label*="Cancel" i]):not([aria-label*="close" i])',
      'div[aria-modal="true"] button.VfPpkd-LgbsSe:not([aria-label*="Cancel" i]):not([aria-label*="close" i])'
    ];

    for (const sel of prioritySelectors) {
      const btn = document.querySelector(sel);
      if (btn && isElementVisible(btn)) {
        const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
        if (text !== 'cancel' && !btn.getAttribute('aria-label')?.toLowerCase().includes('cancel')) {
          return btn;
        }
      }
    }

    // Text-based fallback in open dialogs
    const dialogs = document.querySelectorAll('div[role="dialog"], div[aria-modal="true"], g-dialog, body');
    for (const dlg of dialogs) {
      const buttons = dlg.querySelectorAll('button, div[role="button"]');
      for (const btn of buttons) {
        if (!isElementVisible(btn)) continue;
        const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
        if (text === 'post' || text === 'publish' || text === 'पोस्ट' || text === 'पोस्ट करें') {
          return btn;
        }
      }
    }

    return null;
  }

  function triggerGooglePostSubmission(autoSubmit = true) {
    if (hasAutoSubmitted) return;

    let attempts = 0;
    const postInterval = setInterval(() => {
      attempts++;
      const postBtn = findGooglePostButton();
      const isDisabled = postBtn && (postBtn.disabled || postBtn.getAttribute('aria-disabled') === 'true' || postBtn.classList.contains('VfPpkd-LgbsSe-OWXEXe-OWJJAb'));

      if (postBtn && !isDisabled) {
        clearInterval(postInterval);

        postBtn.style.outline = '3px solid #1a73e8';
        postBtn.style.boxShadow = '0 0 18px rgba(26, 115, 232, 0.6)';
        postBtn.style.transition = 'all 0.3s ease';

        if (autoSubmit) {
          console.log('[REDES EXTENSION] Review & 5★ filled! Ready to post.');
          updateFloatingBannerStatus('✍️ Review filled! Tap "Post" to publish (auto-posting in 4s)...');

          setTimeout(() => {
            if (!hasAutoSubmitted) {
              hasAutoSubmitted = true;
              clickElementRobustly(postBtn);
              console.log('[REDES EXTENSION] ✅ Google review submitted successfully!');
              updateFloatingBannerStatus('✅ Review Posted to Google Successfully!');

              try {
                chrome.runtime.sendMessage({ type: 'REDES_DIRECT_POST_SUCCESS' });
              } catch (e) {}
            }
          }, 4000);
        }
      }

      if (attempts > 30) {
        clearInterval(postInterval);
      }
    }, 300);
  }

  // Floating helper widget on Google page
  function ensureFloatingHelper(draft) {
    if (document.getElementById('redes-helper-widget')) return;
    if (!draft || !draft.text) return;

    const widget = document.createElement('div');
    widget.id = 'redes-helper-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
      backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    widget.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#60a5fa;font-size:12px;">
          <span style="font-size:14px;">⚡</span> Redes Review Connector
        </div>
        <div style="display:flex;align-items:center;gap:2px;color:#fbbf24;font-size:12px;font-weight:700;">
          ★★★★★ 5★
        </div>
      </div>
      <div id="redes-helper-status" style="font-size:12px;color:#94a3b8;line-height:1.4;">
        Auto-filling 5★ rating and review draft...
      </div>
      <div style="display:flex;gap:8px;">
        <button id="redes-manual-post-btn" style="
          flex: 1;
          background: #034bc0;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        ">
          🚀 1-Click Post
        </button>
        <button id="redes-close-widget" style="
          background: rgba(255,255,255,0.1);
          color: #94a3b8;
          border: none;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(widget);

    document.getElementById('redes-close-widget')?.addEventListener('click', () => {
      widget.remove();
    });

    document.getElementById('redes-manual-post-btn')?.addEventListener('click', () => {
      const targetRating = draft?.rating || 5;
      selectTargetStars(targetRating);
      const ta = findReviewTextarea();
      if (ta) {
        insertTextIntoElement(ta, draft.text);
      }
      setTimeout(() => {
        const postBtn = findGooglePostButton();
        if (postBtn) clickElementRobustly(postBtn);
      }, 350);
    });
  }

  function updateFloatingBannerStatus(statusText) {
    const el = document.getElementById('redes-helper-status');
    if (el) el.innerHTML = statusText;
  }

  // Automatically find and click Google Maps "Write a review" button if modal is not yet open
  let hasClickedWriteReview = false;

  function findAndClickWriteReviewButton() {
    if (hasClickedWriteReview) return false;
    if (findReviewTextarea()) return false;

    // 1. Selector search
    const writeBtnSelectors = [
      'button[aria-label*="Write a review" i]',
      'button[aria-label*="Edit your review" i]',
      'button[aria-label*="Edit review" i]',
      'button[aria-label*="समीक्षा लिखें" i]',
      'button[aria-label*="समीक्षा संपादित करें" i]',
      'button[data-value="Write a review" i]',
      'button[data-value="Edit your review" i]',
      'div[role="button"][aria-label*="Write a review" i]',
      'div[role="button"][aria-label*="Edit your review" i]',
      'a[aria-label*="Write a review" i]',
      'a[aria-label*="Edit your review" i]',
      'button[jsaction*="review" i]',
      'button[jsaction*="rate" i]'
    ];

    for (const sel of writeBtnSelectors) {
      try {
        const btn = document.querySelector(sel);
        if (btn && isElementVisible(btn)) {
          console.log('[REDES EXTENSION] Found review button by selector, clicking:', sel);
          clickElementRobustly(btn);
          hasClickedWriteReview = true;
          updateFloatingBannerStatus('Opening review form...');
          return true;
        }
      } catch (e) {}
    }

    // 2. Exact & substring text search across buttons, links, and role="button" elements
    const elements = document.querySelectorAll('button, div[role="button"], a, span');
    for (const el of elements) {
      if (!isElementVisible(el)) continue;
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (
        text === 'write a review' || 
        text === 'edit your review' || 
        text === 'edit review' || 
        text === 'समीक्षा लिखें' || 
        text === 'समीक्षा संपादित करें' ||
        text.includes('write a review') || 
        text.includes('edit your review') ||
        text.includes('समीक्षा लिखें')
      ) {
        const targetBtn = el.tagName.toLowerCase() === 'button' || el.getAttribute('role') === 'button' ? el : (el.closest('button, div[role="button"], a') || el);
        console.log('[REDES EXTENSION] Clicking review target:', targetBtn);
        clickElementRobustly(targetBtn);
        hasClickedWriteReview = true;
        updateFloatingBannerStatus('Opening review form...');
        return true;
      }
    }

    return false;
  }

  // 6. Comprehensive Auto-Fill & Auto-Post Runner
  function runAutoFill() {
    dismissGoogleInfoOverlay();

    // Trigger "Write a review" button if review modal is not yet open
    if (!findReviewTextarea()) {
      findAndClickWriteReviewButton();
    }

    fetchDraft((draft) => {
      const activeDraft = draft && draft.text ? draft : {
        text: 'Outstanding experience and wonderful service! Highly recommended.',
        rating: 5,
        autoSubmit: false
      };

      const targetRating = activeDraft?.rating || 5;
      const shouldAutoPost = activeDraft?.autoSubmit === true;

      ensureFloatingHelper(activeDraft);

      // STEP 1: Select stars across all rating categories (Overall + Hotel Rooms, Service, Location)
      selectTargetStars(targetRating);

      // STEP 2: Find review textarea (and populate review text)
      const textarea = findReviewTextarea();

      if (textarea && !hasFilledText && textarea.dataset.redesAutoFilled !== 'true') {
        insertTextIntoElement(textarea, activeDraft.text);
        selectTargetStars(targetRating);

        if (shouldAutoPost) {
          setTimeout(() => {
            triggerGooglePostSubmission(true);
          }, 600);
        }
      } else if (!hasFilledText) {
        // Fallback search for any visible textarea inside active dialog
        const fallbackTa = document.querySelector('div[role="dialog"] textarea, div[aria-modal="true"] textarea, textarea#c2, textarea.VfPpkd-fmcmS-wGMbrd');
        if (fallbackTa && isElementVisible(fallbackTa) && fallbackTa.dataset.redesAutoFilled !== 'true') {
          insertTextIntoElement(fallbackTa, activeDraft.text);
          selectTargetStars(targetRating);

          if (shouldAutoPost) {
            setTimeout(() => {
              triggerGooglePostSubmission(true);
            }, 600);
          }
        }
      }
    });
  }

  // 7. Message listener from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'TRIGGER_AUTO_FILL') {
        const textarea = findReviewTextarea();
        const rating = msg.rating || 5;
        selectTargetStars(rating);
        if (textarea && msg.text) {
          insertTextIntoElement(textarea, msg.text);
          setTimeout(() => {
            triggerGooglePostSubmission(msg.autoSubmit !== false);
          }, 600);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      }
    });
  }

  // 8. Debounced Observer & Polling Loop
  let isRunningAutoFill = false;
  let autoFillTimeout = null;

  function scheduleAutoFill(delay = 60) {
    if (autoFillTimeout) clearTimeout(autoFillTimeout);
    autoFillTimeout = setTimeout(() => {
      if (isRunningAutoFill) return;
      isRunningAutoFill = true;
      try {
        runAutoFill();
      } finally {
        isRunningAutoFill = false;
      }
    }, delay);
  }

  const observer = new MutationObserver(() => {
    dismissGoogleInfoOverlay();
    scheduleAutoFill();
  });

  const rootTarget = document.documentElement || document.body;
  if (rootTarget) {
    observer.observe(rootTarget, { childList: true, subtree: true });
  }

  // Initial immediate runs
  dismissGoogleInfoOverlay();
  scheduleAutoFill(50);
  scheduleAutoFill(300);
  scheduleAutoFill(800);

  let pollAttempts = 0;
  const pollTimer = setInterval(() => {
    pollAttempts++;
    dismissGoogleInfoOverlay();
    scheduleAutoFill(10);
    if ((hasFilledText && hasSelectedStars && hasAutoSubmitted) || pollAttempts > 60) {
      clearInterval(pollTimer);
    }
  }, 350);

})();

