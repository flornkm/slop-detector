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
        <PowerGlyph color={color} />
        <div
          className="mt-2 text-[12px] lowercase"
          style={{ color, letterSpacing: "0.04em" }}>
          {enabled ? "on" : "off"}
        </div>
      </button>
    </div>
  )
}

function PowerGlyph({ color }: { color: string }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      fill="none"
      className="block mx-auto transition-colors"
      aria-hidden>
      <path
        d="M32 8 C 30 8 28.5 9.5 28.5 11.5 L 28.5 27 C 28.5 29 30 30.5 32 30.5 C 34 30.5 35.5 29 35.5 27 L 35.5 11.5 C 35.5 9.5 34 8 32 8 Z M 21 14.5 C 13 19 8 27 8 36 C 8 49 18.7 59.5 32 59.5 C 45.3 59.5 56 49 56 36 C 56 27 51 19 43 14.5 C 41.5 13.5 39.5 14 38.5 15.5 C 37.5 17 38 19 39.5 20 C 45.5 23.5 49 29.5 49 36 C 49 45.4 41.4 53 32 53 C 22.6 53 15 45.4 15 36 C 15 29.5 18.5 23.5 24.5 20 C 26 19 26.5 17 25.5 15.5 C 24.5 14 22.5 13.5 21 14.5 Z"
        fill={color}
      />
    </svg>
  )
}
