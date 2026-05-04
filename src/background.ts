// Per-tab activation. The content script auto-injects on every page (via
// host_permissions) but mounts hidden. Clicking the toolbar icon sends a
// TOGGLE message to the active tab; the script flips its own visibility and
// reports back via VISIBILITY_CHANGED so we can update the per-tab badge.
// Background holds no state, so service-worker dormancy doesn't lose anything.

async function setBadgeForTab(tabId: number, visible: boolean) {
  await chrome.action.setBadgeText({ tabId, text: visible ? "" : "OFF" })
  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#1a1a1d" })
  await chrome.action.setTitle({
    tabId,
    title: visible
      ? "AI Slop Detector — scanning this tab"
      : "AI Slop Detector — click to scan this tab"
  })
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE" }).catch(() => {})
})

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "VISIBILITY_CHANGED" && sender.tab?.id) {
    void setBadgeForTab(sender.tab.id, !!msg.visible)
  }
})

// Eagerly reset to OFF the moment a page begins loading — stops the badge
// from showing the previous page's state until the new content script reports.
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") {
    void setBadgeForTab(tabId, false)
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Default to OFF first to avoid showing a stale badge during the round-trip.
  await setBadgeForTab(tabId, false)
  try {
    const reply = (await chrome.tabs.sendMessage(tabId, {
      type: "GET_STATE"
    })) as { visible?: boolean } | undefined
    if (reply?.visible) await setBadgeForTab(tabId, true)
  } catch {
    // Content script not loaded (chrome:// page, still loading, etc.) — OFF it stays.
  }
})
