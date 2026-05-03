// TODO: plug in real AI-detection model here (WebLLM, vision API, etc.)
// For now this offscreen worker is a stub that returns random ratings so the
// UI pipeline still works end-to-end while we figure out the actual model.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "SLOP_DETECT_RUN") return
  const rating = Math.random()
  sendResponse({ rating })
  return true
})

export default function Offscreen() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      Slop Detector inference worker (stub)
    </div>
  )
}
