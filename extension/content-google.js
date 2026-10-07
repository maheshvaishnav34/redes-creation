// Redes Creation Review Connector - Google Review Auto-Filler Content Script
(function () {
  console.log('[REDES EXTENSION] Google review connector active on:', window.location.href);

  let hasFilledText = false;
  let hasSelectedStars = false;
  let cachedDraft = null;

  // 1. Fetch review draft
  function fetchDraft(callback) {
    if (cachedDraft && cachedDraft.text) {
      return callback(cachedDraft);
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get(['latestReviewDraft'], (res) => {
          if (!chrome.runtime.lastError && res?.latestReviewDraft?.text) {
            cachedDraft = res.latestReviewDraft;
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
    const prioritySelectors = [
      'textarea[placeholder*="experience" i]',
      'textarea[placeholder*="details" i]',
      'textarea[placeholder*="anubhav" i]',
      'textarea[aria-label*="experience" i]',
      'textarea[aria-label*="anubhav" i]',
      'textarea[aria-label*="review" i]',
      'textarea[aria-label*="Share details" i]'
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

  // 3. Dynamic Star Selection (Handles exact rating chosen by user: 1, 2, 3, 4, 5 stars)
  function selectTargetStars(targetRating = 5) {
    const starNum = Number(targetRating) || 5;
    const clampedRating = Math.max(1, Math.min(5, starNum));
    const wordMap = ['', 'one', 'two', 'three', 'four', 'five'];
    const word = wordMap[clampedRating];

    console.log('[REDES EXTENSION] Selecting rating:', clampedRating);

    // Strategy A: Specific ARIA & Data Attributes for the target rating
    const specificSelectors = [
      `[aria-label*="${clampedRating} star" i]`,
      `[aria-label*="${clampedRating} stars" i]`,
      `[aria-label*="${word} star" i]`,
      `[aria-label*="${word} stars" i]`,
      `[aria-label*="Rate ${clampedRating}" i]`,
      `[aria-label*="${clampedRating} of 5" i]`,
      `[aria-label*="${clampedRating} सितारे" i]`,
      `[data-rating="${clampedRating}"]`,
      `[data-star-index="${clampedRating}"]`,
      `[data-star-index="${clampedRating - 1}"]`,
      `[aria-posinset="${clampedRating}"]`
    ];

    for (const sel of specificSelectors) {
      const match = document.querySelector(sel);
      if (match && isElementVisible(match)) {
        clickElementRobustly(match);
        hasSelectedStars = true;
        return true;
      }
    }

    // Strategy B: Radio buttons inside dialog
    const dialogs = document.querySelectorAll('div[role="dialog"], div[aria-modal="true"], g-dialog, body');
    for (const dlg of dialogs) {
      const radios = Array.from(dlg.querySelectorAll('[role="radio"]'));
      if (radios.length === 5) {
        // Standard order (1, 2, 3, 4, 5) -> target star is index (clampedRating - 1)
        const targetRadio = radios[clampedRating - 1];
        if (targetRadio) {
          clickElementRobustly(targetRadio);
          hasSelectedStars = true;
          return true;
        }
      }
    }

    // Strategy C: Geometric Detection (Row of 5 stars directly above the review textarea)
    const textarea = findReviewTextarea();
    if (textarea) {
      const taRect = textarea.getBoundingClientRect();
      const modal = textarea.closest('div[role="dialog"], div[aria-modal="true"], g-dialog') || document.body;

      const candidateStars = [];
      const allElements = modal.querySelectorAll('span, div, svg, button');

      for (const el of allElements) {
        const r = el.getBoundingClientRect();
        if (r.width >= 16 && r.width <= 60 && r.height >= 16 && r.height <= 60) {
          if (r.bottom <= taRect.top + 10 && r.top >= taRect.top - 180) {
            candidateStars.push({ el, left: r.left, top: r.top });
          }
        }
      }

      const rows = {};
      for (const item of candidateStars) {
        const roundedY = Math.round(item.top / 10) * 10;
        if (!rows[roundedY]) rows[roundedY] = [];
        rows[roundedY].push(item);
      }

      for (const y in rows) {
        const rowItems = rows[y];
        const uniqueByX = [];
        rowItems.sort((a, b) => a.left - b.left);
        for (const item of rowItems) {
          if (!uniqueByX.some(u => Math.abs(u.left - item.left) < 10)) {
            uniqueByX.push(item);
          }
        }

        if (uniqueByX.length >= 5) {
          // Target star index is clampedRating - 1 (e.g. 4 stars -> index 3, 5 stars -> index 4)
          const targetIndex = clampedRating - 1;
          const targetStar = uniqueByX[targetIndex]?.el;
          if (targetStar) {
            clickElementRobustly(targetStar);
            hasSelectedStars = true;
            return true;
          }
        }
      }
    }

    return false;
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
        document.execCommand('insertText', false, text);
      } catch (e) {}
    } else {
      target.innerText = text;
      target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    target.dataset.redesAutoFilled = 'true';
    hasFilledText = true;
  }

  // 5. Comprehensive Auto-Fill Runner
  function runAutoFill() {
    const textarea = findReviewTextarea();

    fetchDraft((draft) => {
      const targetRating = draft?.rating || 5;

      // Fill stars whenever modal is open
      if (textarea && !hasSelectedStars) {
        selectTargetStars(targetRating);
      }

      // Fill text if not filled yet
      if (textarea && !hasFilledText && textarea.dataset.redesAutoFilled !== 'true') {
        if (draft && draft.text) {
          insertTextIntoElement(textarea, draft.text);
          selectTargetStars(targetRating);
        }
      }
    });
  }

  // 6. Message listener from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'TRIGGER_AUTO_FILL') {
        const textarea = findReviewTextarea();
        const rating = msg.rating || 5;
        selectTargetStars(rating);
        if (textarea && msg.text) {
          insertTextIntoElement(textarea, msg.text);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      }
    });
  }

  // 7. Observer & Polling Loop
  const observer = new MutationObserver(() => {
    runAutoFill();
  });

  const rootTarget = document.documentElement || document.body;
  if (rootTarget) {
    observer.observe(rootTarget, { childList: true, subtree: true });
  }

  let pollAttempts = 0;
  const pollTimer = setInterval(() => {
    pollAttempts++;
    runAutoFill();
    if ((hasFilledText && hasSelectedStars) || pollAttempts > 35) {
      clearInterval(pollTimer);
    }
  }, 300);

})();
