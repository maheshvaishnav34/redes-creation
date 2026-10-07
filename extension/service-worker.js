// Redes Creation Review Connector - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('[REDES EXTENSION] Extension installed and active.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REDES_STORE_DRAFT') {
    const draftData = {
      text: message.text || '',
      rating: message.rating || 5,
      customerName: message.customerName || '',
      businessName: message.businessName || '',
      url: message.url || '',
      updatedAt: Date.now()
    };

    chrome.storage.local.set({ latestReviewDraft: draftData }, () => {
      console.log('[REDES EXTENSION] Saved review draft:', draftData.text.substring(0, 30));
      sendResponse({ success: true, draft: draftData });
    });
    return true;
  }

  if (message.type === 'REDES_FETCH_DRAFT') {
    chrome.storage.local.get(['latestReviewDraft'], (result) => {
      sendResponse({ draft: result.latestReviewDraft || null });
    });
    return true;
  }

  if (message.type === 'TRIGGER_FILL_GOOGLE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TRIGGER_AUTO_FILL',
          text: message.text,
          rating: message.rating || 5
        }, (res) => {
          sendResponse(res || { success: true });
        });
      } else {
        sendResponse({ success: false, reason: 'No active tab found' });
      }
    });
    return true;
  }
});
