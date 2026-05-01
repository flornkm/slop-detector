const MAX_CONTENT_LEN = 1200

type DetectResponse = { rating?: number | null; error?: string }

export async function detectAI(content: string): Promise<number | null> {
  if (!content) return null
  const trimmed = content.slice(0, MAX_CONTENT_LEN)
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SLOP_DETECT", content: trimmed },
      (response: DetectResponse | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response) {
          reject(new Error("no response from background"))
          return
        }
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        resolve(response.rating ?? null)
      }
    )
  })
}

export function extractContent(el: Element): string {
  const tag = el.tagName
  if (tag === "IMG") {
    const img = el as HTMLImageElement
    return `[image] alt="${img.alt || ""}" src=${img.src.slice(0, 200)}`
  }
  if (tag === "A") {
    const a = el as HTMLAnchorElement
    const text = a.textContent?.trim().slice(0, 400) ?? ""
    return `[link] "${text}" -> ${a.href}`
  }
  if (tag === "PICTURE" || tag === "FIGURE" || tag === "VIDEO" || tag === "SVG") {
    return `[${tag.toLowerCase()}] ${el.textContent?.trim().slice(0, 400) ?? ""}`
  }
  return el.textContent?.trim() ?? ""
}
