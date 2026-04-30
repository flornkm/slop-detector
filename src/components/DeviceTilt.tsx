import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"
import { useStore } from "~lib/store"

const TILT_Z = 0.045
const TILT_Y = -0.012
const TILT_X_REST = -0.025
const PUSH_MAX = 0.04
const SPRING_K = 0.06
const DAMPING = 0.92
const PUSH_IMPULSE = -0.55

export function DeviceTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  const wasPowered = useRef(false)
  const x = useRef(0)
  const v = useRef(0)

  useFrame(() => {
    const powered = useStore.getState().powered
    if (powered !== wasPowered.current) {
      wasPowered.current = powered
      v.current = PUSH_IMPULSE
    }
    v.current += -x.current * SPRING_K
    v.current *= DAMPING
    x.current += v.current
    if (ref.current) {
      ref.current.rotation.x = TILT_X_REST + x.current * PUSH_MAX
    }
  })

  return (
    <group ref={ref} rotation={[TILT_X_REST, TILT_Y, TILT_Z]}>
      {children}
    </group>
  )
}
