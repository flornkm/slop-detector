import { useStorage } from "@plasmohq/storage/hook"
import type { PlasmoCSConfig } from "plasmo"
import cssText from "data-text:~style.compiled.css"
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

export default function Overlay() {
  const [enabled] = useStorage<boolean>("enabled", true)
  if (!enabled) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[2147483647]">
      <Scene />
      <HighlightOverlay />
    </div>
  )
}
