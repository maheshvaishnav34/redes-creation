// Redes Creation Review Connector - Universal Draft Capture Content Script
(function () {
  const isGoogle = window.location.hostname.includes('google.');
  if (isGoogle) return; // Google is handled by content-google.js

  console.log('[REDES EXTENSION] Universal draft listener active on:', window.location.href);

  // Broadcast to page that extension is active
  window.__REDES_EXTENSION_ACTIVE__ = true;
  window.postMessage({ type: 'REDES_EXTENSION_READY' }, '*');
  if (document.documentElement) {
    document.documentElement.setAttribute('data-redes-extension-active', 'true');
  }

  function saveDraftToExtension(text, rating = 5, meta = {}) {
    if (!text || text.trim().length < 5) return;
    const cleanText = text.trim();
    
    const draftData = {
      text: cleanText,
      rating: rating || 5,
      url: window.location.href,
      updatedAt: Date.now(),
      ...meta
    };

    // 1. Direct storage sync (fastest & works even if background worker is asleep)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ 
          latestReviewDraft: draftData,
          redes_backup_draft: draftData
        }, () => {
          console.log('[REDES EXTENSION] Direct storage sync succeeded:', cleanText.substring(0, 30));
          window.postMessage({ type: 'REDES_DRAFT_SYNCED', success: true }, '*');
        });
      } catch (e) {}
    }

    // 2. Also send runtime message to service worker
    try {
      chrome.runtime.sendMessage({
        type: 'REDES_STORE_DRAFT',
        ...draftData
      }, (resp) => {
        if (chrome.runtime.lastError) {
          // Ignore context errors
        } else {
          console.log('[REDES EXTENSION] Review draft successfully synced:', cleanText.substring(0, 40) + '...');
        }
      });
    } catch (e) {
      console.warn('[REDES EXTENSION] Storage sync notice:', e);
    }
  }

  // 1. Listen for window messages from Redes web app
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'REDES_POST_DRAFT' || event.data.type === 'REDES_STORE_DRAFT') {
      const { text, rating, autoSubmit, customerName, businessName } = event.data;
      saveDraftToExtension(text, rating, { autoSubmit: autoSubmit !== false, customerName, businessName });
    } else if (event.data.type === 'REDES_REVIEW_DRAFT_UPDATE' && event.data.payload) {
      const { draft, rating, authorName, businessName } = event.data.payload;
      saveDraftToExtension(draft, rating, { autoSubmit: true, customerName: authorName, businessName });
    } else if (event.data.text && typeof event.data.text === 'string' && event.data.text.length > 5) {
      saveDraftToExtension(event.data.text, event.data.rating || 5, event.data);
    }
  });

  // Check and sync from localStorage immediately
  function syncFromLocalStorage() {
    try {
      const rawSaved = localStorage.getItem('redes_latest_review_draft');
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (parsed?.text) {
          saveDraftToExtension(parsed.text, parsed.rating, { customerName: parsed.customerName, businessName: parsed.businessName });
        }
      }
    } catch (e) {}
  }
  syncFromLocalStorage();

  // 2. Listen for clipboard copy events anywhere on feedback pages
  document.addEventListener('copy', () => {
    // Check if user copied from textarea or selection
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 15) {
      saveDraftToExtension(selection);
      return;
    }
    syncFromLocalStorage();
  });

  // 3. Scan DOM on feedback pages for existing drafts (handles existing Vercel deployments!)
  function scanPageForReviewDraft() {
    if (!window.location.href.includes('/feedback') && !window.location.href.includes('stack-code')) {
      return;
    }

    // Look for selected draft buttons or textareas
    const activeDraftCard = document.querySelector('button[class*="border-[#034bc0]"] p, [class*="ring-2"] p, [class*="ring-[#034bc0]"] p');
    if (activeDraftCard && activeDraftCard.innerText) {
      saveDraftToExtension(activeDraftCard.innerText);
      return;
    }

    // Look for editable review textarea
    const textarea = document.querySelector('textarea');
    if (textarea && textarea.value && textarea.value.length > 15) {
      saveDraftToExtension(textarea.value);
      return;
    }

    // Look for copied draft monospace quote block
    const monoQuote = document.querySelector('div[class*="font-mono"]');
    if (monoQuote && monoQuote.innerText) {
      saveDraftToExtension(monoQuote.innerText.replace(/^"|"$/g, ''));
    }
  }

  // Monitor clicks on draft cards and copy buttons
  document.addEventListener('click', (e) => {
    setTimeout(scanPageForReviewDraft, 100);
  }, true);

  // Initial scan and periodic check
  scanPageForReviewDraft();
  setInterval(scanPageForReviewDraft, 2000);
})();
