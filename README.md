# slop-detector

Chrome extension that drops a Geiger-counter overlay onto every page. The probe is draggable; the body sits in the bottom-right corner.

## Stack

- [Plasmo](https://www.plasmo.com/) for the MV3 scaffold
- [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) + `@react-three/drei` for the scene
- `zustand` for the readings store
- A pre-built `assets/geiger.glb` model (TE-style body + probe + cable anchors)

## Develop

```sh
bun install
bun run dev
```

Then load the unpacked extension from `build/chrome-mv3-dev` in `chrome://extensions` (Developer mode → Load unpacked).

## Build

```sh
bun run build
# → build/chrome-mv3-prod
```

## Layout

```
src/
├── popup.tsx              toolbar popup with on/off toggle
├── contents/overlay.tsx   content-script CSUI mounted bottom-right
└── components/
    ├── Scene.tsx          R3F canvas + camera + lights
    ├── GeigerCounter.tsx  loads the GLB, wires named nodes
    ├── Probe.tsx          drag handler + reach clamp + spring follow
    ├── Cable.tsx          dynamic line between anchor empties
    ├── Display.tsx        canvas-as-texture for the screen mesh
    └── Triangle.tsx       rotates the body triangle by reading
```

The reading is derived from probe lift (vs rest position) plus jitter; everything else is downstream of `useStore`.
