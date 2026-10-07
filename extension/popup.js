document.addEventListener('DOMContentLoaded', () => {
  const reviewTextInput = document.getElementById('reviewTextInput');
  const fillGoogleBtn = document.getElementById('fillGoogleBtn');
  const pasteClipBtn = document.getElementById('pasteClipBtn');
  const copyBtn = document.getElementById('copyBtn');
  const statusTag = document.getElementById('statusTag');
  const statusMessage = document.getElementById('statusMessage');

  // Load existing draft
  chrome.storage.local.get(['latestReviewDraft'], (res) => {
    if (res?.latestReviewDraft?.text) {
      reviewTextInput.value = res.latestReviewDraft.text;
      statusTag.textContent = 'Synced from App';
    } else {
      // Auto-check clipboard
      navigator.clipboard.readText().then((clipText) => {
        if (clipText && clipText.length > 10) {
          reviewTextInput.value = clipText.trim();
          statusTag.textContent = 'From Clipboard';
          saveToStorage(clipText.trim());
        } else {
          reviewTextInput.value = 'Outstanding experience! High quality curriculum, practical live training, and supportive faculty. Highly recommended!';
          statusTag.textContent = 'Default Draft';
        }
      }).catch(() => {
        reviewTextInput.value = 'Outstanding experience! High quality curriculum, practical live training, and supportive faculty. Highly recommended!';
        statusTag.textContent = 'Default Draft';
      });
    }
  });

  function saveToStorage(text) {
    chrome.storage.local.set({
      latestReviewDraft: {
        text,
        rating: 5,
        updatedAt: Date.now()
      }
    });
  }

  reviewTextInput.addEventListener('input', () => {
    saveToStorage(reviewTextInput.value);
    statusTag.textContent = 'Custom Edited';
  });

  pasteClipBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        reviewTextInput.value = text.trim();
        saveToStorage(text.trim());
        statusTag.textContent = 'Pasted';
      }
    } catch (e) {
      statusMessage.textContent = '⚠️ Clipboard permission needed. Press Ctrl+V in the box above.';
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(reviewTextInput.value);
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyBtn.textContent = '📄 Copy Text'; }, 2000);
    } catch (e) {}
  });

  fillGoogleBtn.addEventListener('click', async () => {
    const textToFill = reviewTextInput.value.trim();
    if (!textToFill) {
      alert('Please enter or paste review text first!');
      return;
    }

    fillGoogleBtn.innerHTML = '<span>⏳ Filling Google Review...</span>';

    // 1. Find all tabs to locate Google Search or Maps tab
    chrome.tabs.query({}, (tabs) => {
      const googleTabs = tabs.filter(t => t.url && (t.url.includes('google.com') || t.url.includes('google.co.in')));
      const activeTab = tabs.find(t => t.active);

      const targetTab = (activeTab && activeTab.url && activeTab.url.includes('google.')) ? activeTab : googleTabs[0];

      if (!targetTab) {
        fillGoogleBtn.innerHTML = '<span>⚠️ No Google Tab Open</span>';
        statusMessage.innerHTML = '❌ <strong>Google Review tab open nahi mila:</strong> Pehle Redes Creation se Google Review ka link kholein, fir ye button dabayein!';
        setTimeout(() => {
          fillGoogleBtn.innerHTML = '<span>⚡ Auto-Fill in Open Google Tab</span>';
        }, 3000);
        return;
      }

      // Activate Google tab
      chrome.tabs.update(targetTab.id, { active: true }, () => {
        // Send fill message
        chrome.tabs.sendMessage(targetTab.id, {
          type: 'TRIGGER_AUTO_FILL',
          text: textToFill,
          rating: 5
        }, (resp) => {
          fillGoogleBtn.innerHTML = '<span>✅ Filled Successfully!</span>';
          statusMessage.innerHTML = '🎉 <strong>Google Review Box me text aur 5 stars fill ho gaye hain!</strong> Bas Google tab par <strong>Post</strong> dabayein.';
          setTimeout(() => {
            fillGoogleBtn.innerHTML = '<span>⚡ Auto-Fill in Open Google Tab</span>';
          }, 3000);
        });
      });
    });
  });
});
