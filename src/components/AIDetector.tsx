import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { detectAI, extractContent } from "~lib/detection"
import { useStore } from "~lib/store"

const HOVER_THRESHOLD_S = 2.0
const RATING_DECAY = 0.92

export function AIDetector() {
  const lastEl = useRef<Element | null>(null)
  const enteredAt = useRef(0)
  const detectedFor = useRef<WeakSet<Element>>(new WeakSet())
  const inFlight = useRef(false)

  useFrame(({ clock }) => {
    const state = useStore.getState()
    if (!state.powered) {
      if (state.aiRating !== 0) {
        const next = state.aiRating * RATING_DECAY
        state.setAiRating(next < 0.005 ? 0 : next)
      }
      return
    }

    const el = state.highlighted
    const t = clock.getElapsedTime()

    if (el !== lastEl.current) {
      lastEl.current = el
      enteredAt.current = t
      return
    }

    if (!el) {
      if (state.aiRating !== 0) {
        const next = state.aiRating * RATING_DECAY
        state.setAiRating(next < 0.005 ? 0 : next)
      }
      return
    }

    if (inFlight.current) return
    if (detectedFor.current.has(el)) return
    if (t - enteredAt.current < HOVER_THRESHOLD_S) return

    const content = extractContent(el)
    if (!content) {
      console.log("[slop] empty content, skipping", el.tagName)
      detectedFor.current.add(el)
      return
    }

    detectedFor.current.add(el)
    inFlight.current = true
    console.log(
      `[slop] dispatch detect | <${el.tagName.toLowerCase()}> | ${content.slice(0, 60)}…`
    )
    detectAI(content)
      .then((rating) => {
        if (rating === null) {
          console.warn("[slop] could not parse rating")
          return
        }
        console.log(
          `[slop] rating: ${rating.toFixed(2)} | <${el.tagName.toLowerCase()}> | ${content.slice(0, 80)}`
        )
        useStore.getState().setAiRating(rating)
      })
      .catch((err) => {
        console.error("[slop] detection failed:", err?.message || err, err)
      })
      .finally(() => {
        inFlight.current = false
      })
  })

  return null
}
