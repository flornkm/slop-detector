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
  const fill = on ? color : "none"
  const stroke = color
  const sw = 2.4
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 64 64"
      className="block mx-auto transition-colors"
      aria-hidden>
      <circle
        cx="32"
        cy="14"
        r="7"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <rect
        x="23"
        y="25"
        width="18"
        height="14"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="miter"
      />
      <polygon
        points="32,43 43,57 21,57"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="miter"
      />
    </svg>
  )
}
