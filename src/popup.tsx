import { useStorage } from "@plasmohq/storage/hook"

import "./style.compiled.css"

export default function Popup() {
  const [enabled, setEnabled] = useStorage<boolean>("enabled", true)

  return (
    <div className="w-[220px] bg-cream text-ink p-3.5 font-sans">
      <div className="text-[13px] font-semibold mb-2.5">SLOB DETECTOR</div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={[
          "w-full px-3 py-2.5 text-xs font-bold tracking-widest border-0 rounded-md cursor-pointer",
          enabled ? "bg-slob text-ink" : "bg-ink text-cream"
        ].join(" ")}>
        {enabled ? "ACTIVE" : "OFF"}
      </button>
      <div className="mt-2 text-[11px] text-muted">
        Toggles the overlay on every page.
      </div>
    </div>
  )
}
