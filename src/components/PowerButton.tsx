import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useStore } from "~lib/store"

const PRESS_DEPTH = 0.0009

export function PowerButton({ node }: { node: THREE.Object3D }) {
  const { camera, gl } = useThree()
  const togglePower = useStore((s) => s.togglePower)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const restY = useRef(node.position.y)
  const press = useRef(0)

  useEffect(() => {
    restY.current = node.position.y
  }, [node])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObject(node, true)
      if (hits.length === 0) return
      e.stopPropagation()
      e.preventDefault()
      togglePower()
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [camera, gl, node, raycaster, ndc, togglePower])

  useFrame(() => {
    const target = useStore.getState().powered ? 1 : 0
    press.current += (target - press.current) * 0.18
    node.position.y = restY.current - press.current * PRESS_DEPTH
  })

  return null
}
