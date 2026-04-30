import { Text } from "@react-three/drei"
import { CABLE_ORANGE } from "~lib/palette"
import fontUrl from "url:~assets/fonts/CommitMono-400-Regular.otf"

const Y = 0.0188
const DARK = "#13231a"

type Label = {
  text: string
  pos: [number, number, number]
  size?: number
  color?: string
}

const LABELS: Label[] = [
  { text: "slob detector", pos: [-0.025, Y, -0.0245], size: 0.0023 },
  { text: "speaker", pos: [0.020, Y, -0.0265], size: 0.0017 },
  { text: "scan · radiation", pos: [-0.025, Y, -0.0048], size: 0.00135 },
  { text: "slop / h", pos: [-0.025, Y, +0.005], size: 0.00135, color: CABLE_ORANGE },
  { text: "pwr", pos: [-0.030, Y, +0.0205], size: 0.00185 },
  { text: "scan", pos: [-0.012, Y, +0.0205], size: 0.00185 },
  { text: "amp +", pos: [0.008, Y, +0.0205], size: 0.00185 },
  { text: "amp −", pos: [0.026, Y, +0.0205], size: 0.00185 },
  { text: "model zero · mk i", pos: [0, Y, +0.0277], size: 0.00128, color: CABLE_ORANGE },
  { text: "no. 001", pos: [-0.043, Y, +0.0277], size: 0.00115 },
  { text: "ai grade", pos: [0.041, Y, +0.0277], size: 0.00115 }
]

export function Labels() {
  return (
    <>
      {LABELS.map((l, i) => (
        <Text
          key={i}
          font={fontUrl}
          fontSize={l.size ?? 0.00185}
          position={l.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          color={l.color ?? DARK}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          renderOrder={2}
          castShadow={false}
          receiveShadow={false}
        >
          {l.text}
        </Text>
      ))}
    </>
  )
}
