import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm"

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC"
const MAX_CONTENT_LEN = 1500
const MAX_TOKENS = 16
const TEMPERATURE = 0.1

const SYSTEM_PROMPT =
  "You are an AI content detector. Reply with exactly one line in the format 'rating: X' where X is a number from 0 to 1. 0 = clearly human-written, 1 = clearly AI-generated. No prose, no explanation."

let engine: MLCEngine | null = null
let loading: Promise<MLCEngine> | null = null

export function isModelReady(): boolean {
  return engine !== null
}

export async function getEngine(): Promise<MLCEngine> {
  if (engine) return engine
  if (loading) return loading
  loading = CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (p) => {
      console.log("[slob] model loading:", p.progress.toFixed(2), p.text)
    }
  })
    .then((e) => {
      engine = e
      loading = null
      console.log("[slob] model ready:", MODEL_ID)
      return e
    })
    .catch((err) => {
      loading = null
      console.error("[slob] model load failed:", err)
      throw err
    })
  return loading
}

function parseRating(reply: string): number | null {
  const match = reply.match(/(0?\.[0-9]+|0|1(?:\.0+)?)/)
  if (!match) return null
  const v = parseFloat(match[1])
  if (isNaN(v)) return null
  return Math.max(0, Math.min(1, v))
}

export async function detectAI(content: string): Promise<number | null> {
  if (!content) return null
  const trimmed = content.slice(0, MAX_CONTENT_LEN)
  const e = await getEngine()
  const reply = await e.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed }
    ],
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS
  })
  const text = reply.choices[0]?.message?.content ?? ""
  return parseRating(text)
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
