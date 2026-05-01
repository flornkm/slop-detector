import { CreateMLCEngine, type MLCEngineInterface } from "@mlc-ai/web-llm"

const MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC"
const MAX_CONTENT_LEN = 1200
const TOP_LOGPROBS = 5

const SYSTEM_PROMPT =
  "You rate text on a 0-9 scale for how AI-generated it sounds. 0 = clearly written by a real human. 9 = clearly AI-generated or LinkedIn slop. Reply with exactly one digit and nothing else."

const FEW_SHOT = `Text: "yo the new safari cache invalidation is buggy af, anyone else hitting this?"
Rating: 0

Text: "I shipped the migration today. Took maybe an hour, mostly debugging a weird foreign key constraint on the legacy table."
Rating: 1

Text: "Just got back from a great chat with Sarah about the q3 numbers. We're behind on revenue but customer churn is way down which I think matters more long term."
Rating: 2

Text: "Some thoughts on prompt engineering. People overcomplicate it. The right framing matters more than any specific technique."
Rating: 5

Text: "Last 24 hours have been crazy. 📈 🔥
1. launched an open-source tool
2. got featured in a newsletter
3. closed our seed round

The future is bright. 🚀"
Rating: 8

Text: "🚀 Excited to share we've delivered yet another industry-leading solution!

Here are 3 key insights from this incredible journey:
✨ Innovation never sleeps
✨ Customer-centricity wins
✨ Bold visions create impact

What's your take? Drop a comment below! #leadership #growth #ai"
Rating: 9

Text: "Hot take: AI is going to fundamentally transform how we work. Are you ready to leverage these game-changing tools? Let's unpack this. 🧵"
Rating: 9
`

const USER_PROMPT = (text: string) =>
  `${FEW_SHOT}\nText: """${text}"""\nRating:`

let engine: MLCEngineInterface | null = null
let loading: Promise<MLCEngineInterface> | null = null

async function getEngine(): Promise<MLCEngineInterface> {
  if (engine) return engine
  if (loading) return loading
  console.log("[slop offscreen] loading model", MODEL_ID)
  loading = CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (p) => {
      console.log(
        `[slop offscreen] ${(p.progress * 100).toFixed(1)}%`,
        p.text
      )
    }
  })
    .then((e) => {
      engine = e
      loading = null
      console.log("[slop offscreen] ready")
      return e
    })
    .catch((err) => {
      loading = null
      console.error("[slop offscreen] load failed:", err)
      throw err
    })
  return loading
}

function digitFromToken(raw: string): number | null {
  const t = raw.replace(/[^0-9]/g, "")
  if (t.length !== 1) return null
  const d = parseInt(t, 10)
  if (isNaN(d) || d < 0 || d > 9) return null
  return d
}

const ANY_EMOJI = /\p{Extended_Pictographic}/gu
const BUZZWORDS =
  /\b(delve|leverage|robust|synergy|ecosystem|navigate|unlock|game[\s-]?changer|deep dive|unpack|paradigm|holistic|seamless|cutting[\s-]?edge|state[\s-]?of[\s-]?the[\s-]?art|revolutionize|disrupt|elevate|empower|optimize|streamline|innovate|transform|inflection point|embrace|aesthetic|ultimate)\b/gi
const HOOKS =
  /\b(here'?s the thing|hot take|let me share|i'?ll be honest|fun fact|plot twist|story time|quick story|true story|why .* is the ultimate)/i
const NUMBERED_INSIGHT =
  /\b\d+\s+(things?|lessons?|insights?|takeaways?|tips?|reasons?|ways?|truths?|principles?|rules?)\s+(i\s+)?(learned|from|to|about|for)\b/i
const CTA =
  /\b(what'?s your take|drop a comment|let me know in the comments?|share your thoughts|thoughts\??$|agree\??$|am i wrong\??)/i
const GENERIC_CONCLUSION =
  /\b(future is bright|just the beginning|sky'?s the limit|next level|change the world|stay tuned|trust the process|onward and upward)\b/i
const HUMBLE_BRAG =
  /\b(humbled|grateful|honored|blessed|thrilled|proud to (announce|share))\b/i
const COLON_HOOK = /^[\w'’\s\-]{2,40}:\s+\S/

function heuristicScore(text: string): number {
  if (!text) return 0
  let score = 0

  const emojis = text.match(ANY_EMOJI) || []
  if (emojis.length >= 1) score = Math.max(score, 0.7)
  if (emojis.length >= 2) score = Math.max(score, 0.78)
  if (emojis.length >= 3) score = Math.max(score, 0.85)
  if (emojis.length >= 5) score = Math.max(score, 0.92)

  const hashtags = text.match(/#\w+/g) || []
  if (hashtags.length >= 1) score = Math.max(score, 0.55)
  if (hashtags.length >= 3) score = Math.max(score, 0.78)

  let extras = 0
  const buzzMatches = text.match(BUZZWORDS) || []
  if (buzzMatches.length >= 1) extras += 0.18
  if (buzzMatches.length >= 3) extras += 0.12

  if (HOOKS.test(text)) extras += 0.18
  if (NUMBERED_INSIGHT.test(text)) extras += 0.22
  if (CTA.test(text)) extras += 0.18
  if (GENERIC_CONCLUSION.test(text)) extras += 0.18
  if (HUMBLE_BRAG.test(text)) extras += 0.15
  if (COLON_HOOK.test(text)) extras += 0.1

  const arrowLines =
    text.match(/^\s*[•→✨\u{1F539}\u{1F538}\-\*]\s/gmu) || []
  if (arrowLines.length >= 2) extras += 0.12
  if (arrowLines.length >= 4) extras += 0.08

  const emDashes = (text.match(/—/g) || []).length
  if (emDashes >= 3) extras += 0.08

  return Math.min(1, score + extras)
}

async function llmScore(content: string): Promise<number | null> {
  const e = await getEngine()
  const reply = await e.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(content) }
    ],
    max_tokens: 1,
    temperature: 0.4,
    logprobs: true,
    top_logprobs: TOP_LOGPROBS
  })
  const top = reply.choices?.[0]?.logprobs?.content?.[0]?.top_logprobs
  if (!top || top.length === 0) return null
  let totalProb = 0
  let weightedSum = 0
  for (const item of top) {
    const digit = digitFromToken(item.token)
    if (digit === null) continue
    const prob = Math.exp(item.logprob)
    weightedSum += digit * prob
    totalProb += prob
  }
  if (totalProb === 0) return null
  return Math.max(0, Math.min(1, weightedSum / totalProb / 9))
}

async function detect(content: string): Promise<number | null> {
  if (!content) return null
  const trimmed = content.slice(0, MAX_CONTENT_LEN)
  const heur = heuristicScore(trimmed)
  const llm = await llmScore(trimmed)
  if (llm === null) {
    console.log(`[slop offscreen] heur=${heur.toFixed(2)} llm=null`)
    return heur
  }
  const final = Math.max(heur, llm)
  console.log(
    `[slop offscreen] heur=${heur.toFixed(2)} llm=${llm.toFixed(2)} → ${final.toFixed(2)}`
  )
  return final
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "SLOP_DETECT_RUN") return
  detect(msg.content)
    .then((rating) => sendResponse({ rating }))
    .catch((err) =>
      sendResponse({ error: String(err?.message || err) })
    )
  return true
})

export default function Offscreen() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      Slop Detector inference worker
    </div>
  )
}
