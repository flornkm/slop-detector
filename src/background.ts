import { Storage } from "@plasmohq/storage"

// The toolbar icon has no popup. Clicking it toggles the `enabled` flag in
// extension storage; content scripts mounted on every page subscribe to that
// flag (via @plasmohq/storage hook) and mount/unmount the 3D device + overlay
// accordingly. The badge below the icon shows OFF when disabled.

const storage = new Storage()

async function setBadge(enabled: boolean) {
  await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" })
  await chrome.action.setBadgeBackgroundColor({ color: "#1a1a1d" })
  await chrome.action.setTitle({
    title: enabled
      ? "AI Slop Detector — click to disable"
      : "AI Slop Detector — click to enable"
  })
}

// Initialise badge state on service worker startup.
;(async () => {
  const v = await storage.get<boolean>("enabled")
  await setBadge(v ?? true)
})()

// Keep the badge in sync if the value changes from anywhere (e.g. another tab
// or the storage hook running in a content script).
storage.watch({
  enabled: ({ newValue }) => {
    void setBadge(Boolean(newValue ?? true))
  }
})

chrome.action.onClicked.addListener(async () => {
  const current = await storage.get<boolean>("enabled")
  const next = !(current ?? true)
  await storage.set("enabled", next)
  await setBadge(next)
})
