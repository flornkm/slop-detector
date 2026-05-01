import { useEffect } from "react"
import { useStore } from "~lib/store"

const PAD = 84
const GRADIENT_BLUR_PX = 38
const DOT_BLUR_PX = 0
const FADE_MS = 180

const WRAP_MASK =
  "radial-gradient(ellipse 90% 90% at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)"

const GRADIENT_MASK = [
  "radial-gradient(ellipse 80% 85% at 38% 42%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 22%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.12) 78%, rgba(0,0,0,0) 100%)",
  "radial-gradient(ellipse 78% 82% at 64% 58%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 22%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 78%, rgba(0,0,0,0) 100%)"
].join(",")

const DOT_MASK = [
  "radial-gradient(ellipse 75% 80% at 42% 46%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 78%, rgba(0,0,0,0) 100%)",
  "radial-gradient(ellipse 80% 78% at 60% 56%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 22%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.12) 78%, rgba(0,0,0,0) 100%)"
].join(",")

const DOT_GRID_SPACING = 9
const DOT_RADIUS = 1.1
const DOT_COLOR = "rgba(255, 255, 255, 1)"
const DOT_MAX_OPACITY = 0.85
const WAVE_DURATION_S = 1.5
const WAVE_PEAK = 0.28

const GRAD_STOPS: { offset: number; color: string }[] = [
  { offset: 0, color: "rgba(81, 159, 130, 0.55)" },
  { offset: 0.5, color: "rgba(110, 190, 160, 0.5)" },
  { offset: 1, color: "rgba(70, 145, 120, 0.55)" }
]

function waveOpacity(localT: number) {
  let phase = (localT % WAVE_DURATION_S) / WAVE_DURATION_S
  if (phase < 0) phase += 1
  if (phase < WAVE_PEAK) return phase / WAVE_PEAK
  return Math.max(0, 1 - (phase - WAVE_PEAK) / (1 - WAVE_PEAK))
}

export function HighlightOverlay() {
  useEffect(() => {
    const wrap = document.createElement("div")
    wrap.style.cssText = [
      "position: fixed",
      "left: 0",
      "top: 0",
      "width: 0",
      "height: 0",
      "pointer-events: none",
      "z-index: 2147483646",
      "opacity: 0",
      "overflow: hidden",
      `transition: opacity ${FADE_MS}ms ease`,
      "will-change: transform, opacity",
      `mask-image: ${WRAP_MASK}`,
      `-webkit-mask-image: ${WRAP_MASK}`
    ].join(";")

    const gradientCanvas = document.createElement("canvas")
    gradientCanvas.style.cssText = [
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      `filter: blur(${GRADIENT_BLUR_PX}px) saturate(1.3)`,
      `mask-image: ${GRADIENT_MASK}`,
      `-webkit-mask-image: ${GRADIENT_MASK}`
    ].join(";")

    const dotCanvas = document.createElement("canvas")
    dotCanvas.style.cssText = [
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      DOT_BLUR_PX > 0 ? `filter: blur(${DOT_BLUR_PX}px)` : "",
      `mask-image: ${DOT_MASK}`,
      `-webkit-mask-image: ${DOT_MASK}`
    ]
      .filter(Boolean)
      .join(";")

    wrap.appendChild(gradientCanvas)
    wrap.appendChild(dotCanvas)
    document.body.appendChild(wrap)

    const gctx = gradientCanvas.getContext("2d")!
    const dctx = dotCanvas.getContext("2d")!

    let lastEl: Element | null = null
    let raf = 0

    const tick = (time: number) => {
      const el = useStore.getState().highlighted

      if (!el) {
        if (wrap.style.opacity !== "0") wrap.style.opacity = "0"
        raf = requestAnimationFrame(tick)
        return
      }

      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        if (wrap.style.opacity !== "0") wrap.style.opacity = "0"
        raf = requestAnimationFrame(tick)
        return
      }

      const w = rect.width + PAD * 2
      const h = rect.height + PAD * 2
      wrap.style.left = `${rect.left - PAD}px`
      wrap.style.top = `${rect.top - PAD}px`
      wrap.style.width = `${w}px`
      wrap.style.height = `${h}px`
      if (wrap.style.opacity !== "1") wrap.style.opacity = "1"

      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const cw = Math.round(w * dpr)
      const ch = Math.round(h * dpr)
      const sizeChanged =
        gradientCanvas.width !== cw || gradientCanvas.height !== ch
      if (sizeChanged) {
        gradientCanvas.width = cw
        gradientCanvas.height = ch
        dotCanvas.width = cw
        dotCanvas.height = ch
      }
      if (lastEl !== el) lastEl = el

      gctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      gctx.clearRect(0, 0, w, h)
      const grad = gctx.createLinearGradient(0, 0, w, h)
      for (const stop of GRAD_STOPS) grad.addColorStop(stop.offset, stop.color)
      gctx.fillStyle = grad
      gctx.fillRect(PAD * 0.4, PAD * 0.4, w - PAD * 0.8, h - PAD * 0.8)

      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dctx.clearRect(0, 0, w, h)
      dctx.fillStyle = DOT_COLOR

      const cols = Math.max(1, Math.floor(w / DOT_GRID_SPACING))
      const rows = Math.max(1, Math.floor(h / DOT_GRID_SPACING))
      const offsetX = (w - cols * DOT_GRID_SPACING) / 2 + DOT_GRID_SPACING / 2
      const offsetY = (h - rows * DOT_GRID_SPACING) / 2 + DOT_GRID_SPACING / 2
      const t = time * 0.001

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const offset = ((col * 397 + row * 197) % 1000) / 1000
          const localT = t - offset * WAVE_DURATION_S
          const opacity = waveOpacity(localT) * DOT_MAX_OPACITY
          if (opacity <= 0.01) continue
          dctx.globalAlpha = opacity
          dctx.beginPath()
          dctx.arc(
            offsetX + col * DOT_GRID_SPACING,
            offsetY + row * DOT_GRID_SPACING,
            DOT_RADIUS,
            0,
            Math.PI * 2
          )
          dctx.fill()
        }
      }
      dctx.globalAlpha = 1

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      wrap.remove()
    }
  }, [])

  return null
}
