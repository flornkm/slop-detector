import { useEffect } from "react"
import { useStore } from "~lib/store"

const PAD = 56
const GRADIENT_BLUR_PX = 42
const DOT_BLUR_PX = 0
const FADE_MS = 180

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

const MASK_IMAGE =
  "radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0) 100%)"

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
      `transition: opacity ${FADE_MS}ms ease`,
      "will-change: transform, opacity"
    ].join(";")

    const gradientCanvas = document.createElement("canvas")
    gradientCanvas.style.cssText = [
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      `filter: blur(${GRADIENT_BLUR_PX}px) saturate(1.3)`,
      `mask-image: ${MASK_IMAGE}`,
      `-webkit-mask-image: ${MASK_IMAGE}`
    ].join(";")

    const dotCanvas = document.createElement("canvas")
    dotCanvas.style.cssText = [
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      DOT_BLUR_PX > 0 ? `filter: blur(${DOT_BLUR_PX}px)` : "",
      `mask-image: ${MASK_IMAGE}`,
      `-webkit-mask-image: ${MASK_IMAGE}`
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
