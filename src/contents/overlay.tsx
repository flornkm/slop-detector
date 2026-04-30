import { useStorage } from "@plasmohq/storage/hook"
import type { PlasmoCSConfig } from "plasmo"
import { HighlightOverlay } from "~components/HighlightOverlay"
import { Scene } from "~components/Scene"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    :host { all: initial; }
    .slob-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
    }
  `
  return style
}

export default function Overlay() {
  const [enabled] = useStorage<boolean>("enabled", true)
  if (!enabled) return null
  return (
    <div className="slob-root">
      <Scene />
      <HighlightOverlay />
    </div>
  )
}
