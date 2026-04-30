import {
  Environment,
  Lightformer,
  OrthographicCamera
} from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import * as THREE from "three"
import { GeigerCounter } from "./GeigerCounter"
import { SoundManager } from "./SoundManager"

export function Scene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.NoToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: "low-power"
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        filter:
          "drop-shadow(0 4px 10px rgba(20,30,35,0.10)) " +
          "drop-shadow(12px 22px 40px rgba(20,30,35,0.14))"
      }}>
      <OrthographicCamera
        makeDefault
        position={[0, 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        zoom={3400}
        near={0.01}
        far={3}
      />

      <hemisphereLight args={["#eef0f2", "#1c1d1a", 0.32]} />

      <Suspense fallback={null}>
        <Environment frames={1} resolution={128} background={false}>
          <Lightformer
            form="rect"
            intensity={1.1}
            color="#f5f7fa"
            position={[-0.4, 1.2, -0.2]}
            scale={[3, 1.6, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.35}
            color="#dde7f0"
            position={[1.0, 0.6, 0.3]}
            scale={[1.6, 0.9, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <Lightformer
            form="circle"
            intensity={5.5}
            color="#ffffff"
            position={[-0.18, 0.8, -0.1]}
            scale={0.32}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={2.0}
            color="#ffffff"
            position={[0.25, 0.7, -0.15]}
            scale={[0.28, 0.1, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </Environment>
        <GeigerCounter />
        <SoundManager />
      </Suspense>
    </Canvas>
  )
}
