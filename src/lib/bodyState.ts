// Shared, non-reactive body offset (mutated each frame by DeviceTilt,
// read by Probe so the probe can sit on top of the body while it's
// being dragged into place).
export const bodyState = {
  offsetX: 0.1,
  offsetZ: 0,
  dragStarted: false
}
