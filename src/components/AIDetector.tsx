import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { useStore } from "~lib/store"

const HOVER_THRESHOLD_S = 2.0
const RATING_DECAY = 0.92

export function AIDetector() {
  const lastEl = useRef<Element | null>(null)
  const enteredAt = useRef(0)
  const detectedFor = useRef<WeakSet<Element>>(new WeakSet())

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
      if (state.aiRating !== 0) state.setAiRating(0)
      return
    }

    if (!el) {
      if (state.aiRating !== 0) {
        const next = state.aiRating * RATING_DECAY
        state.setAiRating(next < 0.005 ? 0 : next)
      }
      return
    }

    if (detectedFor.current.has(el)) return
    if (t - enteredAt.current < HOVER_THRESHOLD_S) return
    detectedFor.current.add(el)

    // TODO: replace this random rating with real AI-detection logic
    // (vision model for images, text classifier for text, etc.)
    const rating = Math.random()
    console.log(
      `[slop] random rating: ${rating.toFixed(2)} | <${el.tagName.toLowerCase()}>`
    )
    useStore.getState().setAiRating(rating)
  })

  return null
}
