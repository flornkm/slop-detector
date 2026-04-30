import { useStorage } from "@plasmohq/storage/hook"

export default function Popup() {
  const [enabled, setEnabled] = useStorage<boolean>("enabled", true)

  return (
    <div
      style={{
        width: 220,
        padding: 14,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        background: "#f0eae0",
        color: "#1a1a1d"
      }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        SLOB DETECTOR
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: enabled ? "#ff5b1a" : "#1a1a1d",
          color: enabled ? "#1a1a1d" : "#f0eae0",
          fontWeight: 700,
          letterSpacing: 1,
          fontSize: 12,
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}>
        {enabled ? "ACTIVE" : "OFF"}
      </button>
      <div style={{ fontSize: 11, color: "#5a5040", marginTop: 8 }}>
        Toggles the overlay on every page.
      </div>
    </div>
  )
}
