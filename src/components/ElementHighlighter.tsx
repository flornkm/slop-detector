import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useStore } from "~lib/store"

const TARGET_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "IMG",
  "PICTURE",
  "FIGURE",
  "SVG",
  "VIDEO",
  "UL",
  "OL",
  "LI",
  "A",
  "CODE",
  "PRE",
  "BLOCKQUOTE",
  "BUTTON"
])

const SKIP_TAGS = new Set(["HTML", "BODY", "MAIN", "ARTICLE", "SECTION"])

function hasBackgroundImage(el: Element): boolean {
  const bg = window.getComputedStyle(el).backgroundImage
  return bg !== "none" && bg !== ""
}

function findInnerImage(el: Element): Element | null {
  const img = el.querySelector("img, picture, svg, video")
  return img
}
const STYLE_ID = "slob-highlight-style"
const HIGHLIGHT_CLASS = "slob-highlight-target"
const POLL_S = 0.08

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid #00ff66 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 14px rgba(0, 255, 102, 0.45) !important;
      transition: outline-color 60ms linear, box-shadow 60ms linear !important;
    }
  `
  document.head.appendChild(style)
}

export function ElementHighlighter({
  probeTip
}: {
  probeTip: THREE.Object3D | null
}) {
  const { camera, gl } = useThree()
  const wp = useMemo(() => new THREE.Vector3(), [])
  const lastT = useRef(0)
  const current = useRef<Element | null>(null)

  useEffect(() => {
    ensureStyle()
    return () => {
      if (current.current) current.current.classList.remove(HIGHLIGHT_CLASS)
      current.current = null
    }
  }, [])

  useFrame(({ clock }) => {
    if (!probeTip) return
    const powered = useStore.getState().powered

    if (!powered) {
      if (current.current) {
        current.current.classList.remove(HIGHLIGHT_CLASS)
        current.current = null
      }
      return
    }

    const t = clock.getElapsedTime()
    if (t - lastT.current < POLL_S) return
    lastT.current = t

    probeTip.getWorldPosition(wp)
    wp.project(camera)
    const rect = gl.domElement.getBoundingClientRect()
    const x = (wp.x + 1) * 0.5 * rect.width + rect.left
    const y = (1 - wp.y) * 0.5 * rect.height + rect.top

    if (
      x < 0 ||
      y < 0 ||
      x > window.innerWidth ||
      y > window.innerHeight
    ) {
      if (current.current) {
        current.current.classList.remove(HIGHLIGHT_CLASS)
        current.current = null
      }
      return
    }

    let el: Element | null = document.elementFromPoint(x, y)
    let resolved: Element | null = null
    while (el && el !== document.documentElement) {
      if (SKIP_TAGS.has(el.tagName)) break
      if (TARGET_TAGS.has(el.tagName)) {
        resolved = el
        break
      }
      const inner = findInnerImage(el)
      if (inner) {
        resolved = inner
        break
      }
      if (hasBackgroundImage(el)) {
        resolved = el
        break
      }
      el = el.parentElement
    }

    if (resolved !== current.current) {
      if (current.current) current.current.classList.remove(HIGHLIGHT_CLASS)
      if (resolved) resolved.classList.add(HIGHLIGHT_CLASS)
      current.current = resolved
    }
  })

  return null
}
