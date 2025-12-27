// background.js

let currentDomain = null;
let startTime = null;
const IDLE_THRESHOLD = 60; // seconds

// Initialize tracking
function updateTime() {
  if (currentDomain && startTime) {
    const domainToSave = currentDomain;
    const now = Date.now();
    const duration = now - startTime;
    startTime = now;

    // Get today's date key YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    chrome.storage.local.get([today], (result) => {
      let data = result[today] || {};
      if (data[domainToSave]) {
        data[domainToSave] += duration;
      } else {
        data[domainToSave] = duration;
      }

      let storageUpdate = {};
      storageUpdate[today] = data;
      chrome.storage.local.set(storageUpdate);
    });
  }
}

function handleTabChange(tabId) {
  // If we were tracking something, update its time first
  updateTime();

  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) {
      currentDomain = null;
      startTime = null;
      return;
    }

    // Ignore chrome:// and other internal pages if desired, but for now let's just parse host
    try {
      const url = new URL(tab.url);
      if (url.protocol.startsWith('http')) {
        currentDomain = url.hostname;
        startTime = Date.now();
      } else {
        currentDomain = null;
        startTime = null;
      }
    } catch (e) {
      currentDomain = null;
      startTime = null;
    }
  });
}

// 1. Tab Activated (Switched to a different tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// 2. Tab Updated (Navigated to a different URL in same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    handleTabChange(tabId);
  }
});

// 3. Window Focus Changed
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User minimized chrome or switched to another app
    updateTime();
    currentDomain = null;
    startTime = null;
  } else {
    // User came back to chrome, find active tab in this window
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs && tabs.length > 0) {
        handleTabChange(tabs[0].id);
      }
    });
  }
});

// 4. Idle State Detection
chrome.idle.setDetectionInterval(IDLE_THRESHOLD);
chrome.idle.onStateChanged.addListener((newState) => {
  console.log("Idle state changed:", newState);
  if (newState === 'active') {
    // Resume tracking if window is focused
    chrome.windows.getLastFocused((window) => {
      if (window && window.focused) {
        chrome.tabs.query({ active: true, windowId: window.id }, (tabs) => {
          if (tabs && tabs.length > 0) {
            handleTabChange(tabs[0].id);
          }
        });
      }
    });
  } else {
    // User went idle or locked
    updateTime();
    currentDomain = null;
    startTime = null;
  }
});

// Save periodically (e.g. every minute) or just rely on events?
// Reliance on events is good, but if user stays on one page for 1 hour without switching, verify we capture it.
// We capture it when they finally switch. But if browser crashes?
// Let's add an interval to save state every 1 minute just in case.
setInterval(() => {
  if (currentDomain && startTime) {
    // Just call updateTime, it resets startTime to now
    updateTime();
  }
}, 60 * 1000);
