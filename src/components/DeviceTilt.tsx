import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"
import { bodyState } from "~lib/bodyState"
import { useStore } from "~lib/store"

const TILT_Z = 0.045
const TILT_Y = -0.012
const TILT_X_REST = -0.025
const PUSH_MAX = 0.04
const SPRING_K = 0.06
const DAMPING = 0.92
const PUSH_IMPULSE = -0.55

// Auto slide-in (softer + slower for a smoother entrance)
const INITIAL_OFFSET_X = 0.1 // off to the right (world units) — only a small sliver peeks
const DOCK_SPRING_K = 0.028
const DOCK_DAMPING = 0.9
const DOCKED_THRESHOLD = 0.0025

// Offset-driven rotation so the device shows its sides during the slide-in
const YAW_PER_OFFSET_X = 6.5
const PITCH_PER_OFFSET_Z = -5.5
const MAX_YAW = 0.55
const MAX_OFFSET_PITCH = 0.4

export function DeviceTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)

  const wasPowered = useRef(false)
  const x = useRef(0)
  const v = useRef(0)

  // Auto slide-in offsets
  const offX = useRef(INITIAL_OFFSET_X)
  const offZ = useRef(0)
  const velX = useRef(0)
  const velZ = useRef(0)
  const docked = useRef(false)

  // Probe is "released" the moment the body starts moving in
  bodyState.dragStarted = true

  useFrame(() => {
    // Power-on bounce
    const powered = useStore.getState().powered
    if (powered !== wasPowered.current) {
      wasPowered.current = powered
      v.current = PUSH_IMPULSE
    }
    v.current += -x.current * SPRING_K
    v.current *= DAMPING
    x.current += v.current

    // Auto slide toward (0, 0)
    if (!docked.current) {
      velX.current += (0 - offX.current) * DOCK_SPRING_K
      velX.current *= DOCK_DAMPING
      offX.current += velX.current
      velZ.current += (0 - offZ.current) * DOCK_SPRING_K
      velZ.current *= DOCK_DAMPING
      offZ.current += velZ.current

      if (
        Math.abs(offX.current) < DOCKED_THRESHOLD &&
        Math.abs(offZ.current) < DOCKED_THRESHOLD &&
        Math.abs(velX.current) < 0.0008 &&
        Math.abs(velZ.current) < 0.0008
      ) {
        offX.current = 0
        offZ.current = 0
        velX.current = 0
        velZ.current = 0
        docked.current = true
        useStore.getState().setBodyDocked(true)
      }
    }

    // Publish offsets so other components (Probe) can attach to the body's current position.
    bodyState.offsetX = offX.current
    bodyState.offsetZ = offZ.current

    if (ref.current) {
      const yawFromOffset = THREE.MathUtils.clamp(
        offX.current * YAW_PER_OFFSET_X,
        -MAX_YAW,
        MAX_YAW
      )
      const pitchFromOffset = THREE.MathUtils.clamp(
        offZ.current * PITCH_PER_OFFSET_Z,
        -MAX_OFFSET_PITCH,
        MAX_OFFSET_PITCH
      )

      ref.current.position.x = offX.current
      ref.current.position.z = offZ.current
      ref.current.rotation.x =
        TILT_X_REST + x.current * PUSH_MAX + pitchFromOffset
      ref.current.rotation.y = TILT_Y + yawFromOffset
      ref.current.rotation.z = TILT_Z
    }
  })

  return (
    <group
      ref={ref}
      position={[INITIAL_OFFSET_X, 0, 0]}
      rotation={[TILT_X_REST, TILT_Y, TILT_Z]}>
      {children}
    </group>
  )
}
