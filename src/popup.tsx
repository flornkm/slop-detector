import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import fontUrl from "data-base64:../assets/fonts/CommitMono-400-Regular.otf"

import "./style.compiled.css"

let fontPromise: Promise<void> | null = null
function ensureFont() {
  if (fontPromise) return fontPromise
  const ff = new FontFace("CommitMono", `url(${fontUrl})`)
  fontPromise = ff.load().then((loaded) => {
    document.fonts.add(loaded)
  })
  return fontPromise
}

export default function Popup() {
  const [enabled, setEnabled] = useStorage<boolean>("enabled", true)
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let alive = true
    ensureFont().then(() => alive && setFontReady(true))
    return () => {
      alive = false
    }
  }, [])

  const color = enabled ? "#ff5e10" : "rgba(19,35,26,0.28)"

  return (
    <div
      className="flex items-center justify-center w-[160px] h-[160px] bg-cream"
      style={{
        fontFamily: fontReady
          ? "CommitMono, ui-monospace, monospace"
          : "ui-monospace, monospace"
      }}>
      <button
        onClick={() => setEnabled(!enabled)}
        aria-pressed={enabled}
        className="flex flex-col items-center justify-center cursor-pointer transition-colors">
        <PowerGlyph color={color} on={enabled} />
        <div
          className="mt-2 text-[12px] lowercase"
          style={{ color, letterSpacing: "0.04em" }}>
          {enabled ? "on" : "off"}
        </div>
      </button>
    </div>
  )
}

function PowerGlyph({ color, on }: { color: string; on: boolean }) {
  const path = on
    ? "M 2 24 L 16 24 L 20 24 L 24 10 L 28 38 L 32 6 L 36 32 L 40 22 L 44 26 L 48 24 L 62 24"
    : "M 2 24 L 62 24"

  const tickColor = on ? color : "rgba(19,35,26,0.18)"

  return (
    <svg
      width="80"
      height="44"
      viewBox="0 0 64 48"
      fill="none"
      className="block mx-auto transition-colors"
      aria-hidden>
      <line x1="2" y1="6" x2="2" y2="42" stroke={tickColor} strokeWidth="1" />
      <line
        x1="62"
        y1="6"
        x2="62"
        y2="42"
        stroke={tickColor}
        strokeWidth="1"
      />
      <line
        x1="2"
        y1="24"
        x2="62"
        y2="24"
        stroke={tickColor}
        strokeWidth="0.6"
        strokeDasharray="2 3"
      />
      <path
        d={path}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
