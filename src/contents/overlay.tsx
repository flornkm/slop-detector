import type { PlasmoCSConfig } from "plasmo"
import cssText from "data-text:~style.compiled.css"
import { useSyncExternalStore } from "react"
import { HighlightOverlay } from "~components/HighlightOverlay"
import { Scene } from "~components/Scene"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `${cssText}\n:host { all: initial; }`
  return style
}

// Module-level state: per-page, defaults hidden. The toolbar icon click flips
// it via a TOGGLE message; the background queries it via GET_STATE on tab
// switches to keep the badge in sync.
let visible = false
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getSnapshot = () => visible

const setVisible = (next: boolean) => {
  if (next === visible) return
  visible = next
  listeners.forEach((fn) => fn())
  chrome.runtime
    .sendMessage({ type: "VISIBILITY_CHANGED", visible })
    .catch(() => {})
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "TOGGLE") {
    setVisible(!visible)
  } else if (msg?.type === "GET_STATE") {
    sendResponse({ visible })
  }
})

export default function Overlay() {
  const v = useSyncExternalStore(subscribe, getSnapshot, () => false)
  if (!v) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[2147483647]">
      <Scene />
      <HighlightOverlay />
    </div>
  )
}
