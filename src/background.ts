const OFFSCREEN_PATH = "tabs/offscreen.html"

let creating: Promise<void> | null = null

async function ensureOffscreen(): Promise<void> {
  const has = await chrome.offscreen.hasDocument?.()
  if (has) return
  if (creating) return creating
  creating = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "Run WebLLM inference for AI content detection"
    })
    .finally(() => {
      creating = null
    })
  return creating
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "SLOP_DETECT") return
  ;(async () => {
    try {
      await ensureOffscreen()
      const result = await chrome.runtime.sendMessage({
        type: "SLOP_DETECT_RUN",
        content: msg.content
      })
      sendResponse(result)
    } catch (err) {
      sendResponse({ error: String((err as Error)?.message || err) })
    }
  })()
  return true
})
