import { useEffect } from "react"
import { useStore } from "~lib/store"

const PAD = 120
const FADE_MS = 220
const PARTICLE_COUNT = 6000
const FLOW_DIR: [number, number] = [0.94, 0.34]

const WRAP_MASK =
  "radial-gradient(ellipse 95% 95% at center, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.25) 88%, rgba(0,0,0,0) 100%)"

const MOSS_RGB: [number, number, number] = [81 / 255, 159 / 255, 130 / 255]

const VERT_300 = `#version 300 es
in vec2 a_base;
in vec4 a_drift;
in vec2 a_phase;
in vec2 a_meta;
uniform float u_time;
uniform float u_dpr;
uniform vec2 u_flow;
out float v_alpha;
void main() {
  float speed = a_drift.x;
  vec2 base = a_base + u_flow * u_time * speed;
  float cx = sin(base.y * 7.3 + u_time * 0.32 + a_phase.x) * a_drift.z;
  float cy = cos(base.x * 5.7 + u_time * 0.27 + a_phase.y) * a_drift.w;
  float swirl = sin(u_time * 0.18 + a_phase.x * 0.5);
  vec2 p = base + vec2(cx + swirl * a_drift.y * 0.4, cy);
  p = fract(p);
  vec2 clip = p * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_meta.x * u_dpr;
  v_alpha = a_meta.y;
}
`

const FRAG_300 = `#version 300 es
precision mediump float;
in float v_alpha;
uniform vec3 u_color;
out vec4 outColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  float a = smoothstep(0.5, 0.0, d) * v_alpha;
  outColor = vec4(u_color * a, a);
}
`

const VERT_100 = `
attribute vec2 a_base;
attribute vec4 a_drift;
attribute vec2 a_phase;
attribute vec2 a_meta;
uniform float u_time;
uniform float u_dpr;
uniform vec2 u_flow;
varying float v_alpha;
void main() {
  float speed = a_drift.x;
  vec2 base = a_base + u_flow * u_time * speed;
  float cx = sin(base.y * 7.3 + u_time * 0.32 + a_phase.x) * a_drift.z;
  float cy = cos(base.x * 5.7 + u_time * 0.27 + a_phase.y) * a_drift.w;
  float swirl = sin(u_time * 0.18 + a_phase.x * 0.5);
  vec2 p = base + vec2(cx + swirl * a_drift.y * 0.4, cy);
  p = fract(p);
  vec2 clip = p * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_meta.x * u_dpr;
  v_alpha = a_meta.y;
}
`

const FRAG_100 = `
precision mediump float;
varying float v_alpha;
uniform vec3 u_color;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  float a = smoothstep(0.5, 0.0, d) * v_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`Shader compile failed: ${log}`)
  }
  return sh
}

function makeProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string
) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Link failed: ${gl.getProgramInfoLog(prog)}`)
  }
  return prog
}

function buildParticleData(): Float32Array {
  const STRIDE = 10
  const data = new Float32Array(PARTICLE_COUNT * STRIDE)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const o = i * STRIDE
    const depth = Math.pow(Math.random(), 1.6)
    const speed = 0.012 + depth * 0.06
    const swirlAmp = 0.005 + Math.random() * 0.015
    const curlX = 0.008 + Math.random() * 0.022
    const curlY = 0.006 + Math.random() * 0.018
    data[o + 0] = Math.random()
    data[o + 1] = Math.random()
    data[o + 2] = speed
    data[o + 3] = swirlAmp
    data[o + 4] = curlX
    data[o + 5] = curlY
    data[o + 6] = Math.random() * Math.PI * 2
    data[o + 7] = Math.random() * Math.PI * 2
    data[o + 8] = 0.7 + depth * 2.6
    data[o + 9] = 0.12 + depth * 0.42
  }
  return data
}

type Renderer = {
  resize: (cw: number, ch: number) => void
  draw: (t: number, dpr: number) => void
  destroy: () => void
}

function makeWebGLRenderer(canvas: HTMLCanvasElement): Renderer | null {
  let gl: WebGL2RenderingContext | WebGLRenderingContext | null =
    canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: false
    }) as WebGL2RenderingContext | null

  let isWebGL2 = !!gl

  if (!gl) {
    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: false
    }) as WebGLRenderingContext | null
  }

  if (!gl) return null

  let prog: WebGLProgram
  try {
    prog = makeProgram(
      gl,
      isWebGL2 ? VERT_300 : VERT_100,
      isWebGL2 ? FRAG_300 : FRAG_100
    )
  } catch (err) {
    console.warn("[slob-detector] particle shader failed:", err)
    return null
  }

  gl.useProgram(prog)

  const data = buildParticleData()
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  const STRIDE_BYTES = 10 * 4
  const bind = (name: string, size: number, byteOffset: number) => {
    const loc = gl!.getAttribLocation(prog, name)
    if (loc < 0) return
    gl!.enableVertexAttribArray(loc)
    gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, STRIDE_BYTES, byteOffset)
  }
  bind("a_base", 2, 0)
  bind("a_drift", 4, 2 * 4)
  bind("a_phase", 2, 6 * 4)
  bind("a_meta", 2, 8 * 4)

  const uTime = gl.getUniformLocation(prog, "u_time")
  const uColor = gl.getUniformLocation(prog, "u_color")
  const uDpr = gl.getUniformLocation(prog, "u_dpr")
  const uFlow = gl.getUniformLocation(prog, "u_flow")
  gl.uniform3f(uColor, MOSS_RGB[0], MOSS_RGB[1], MOSS_RGB[2])
  gl.uniform2f(uFlow, FLOW_DIR[0], FLOW_DIR[1])

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  return {
    resize(cw, ch) {
      gl!.viewport(0, 0, cw, ch)
    },
    draw(t, dpr) {
      gl!.uniform1f(uTime, t)
      gl!.uniform1f(uDpr, dpr)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      gl!.drawArrays(gl!.POINTS, 0, PARTICLE_COUNT)
    },
    destroy() {
      gl!.deleteBuffer(buf)
      gl!.deleteProgram(prog)
    }
  }
}

type Particle2D = {
  bx: number
  by: number
  speed: number
  swirl: number
  curlX: number
  curlY: number
  phx: number
  phy: number
  size: number
  alpha: number
}

function make2DRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  const particles: Particle2D[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const depth = Math.pow(Math.random(), 1.6)
    particles.push({
      bx: Math.random(),
      by: Math.random(),
      speed: 0.012 + depth * 0.06,
      swirl: 0.005 + Math.random() * 0.015,
      curlX: 0.008 + Math.random() * 0.022,
      curlY: 0.006 + Math.random() * 0.018,
      phx: Math.random() * Math.PI * 2,
      phy: Math.random() * Math.PI * 2,
      size: 0.7 + depth * 2.6,
      alpha: 0.12 + depth * 0.42
    })
  }
  let cw = 0,
    ch = 0
  const fract = (x: number) => x - Math.floor(x)
  return {
    resize(w, h) {
      cw = w
      ch = h
    },
    draw(t, dpr) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = cw / dpr
      const h = ch / dpr
      ctx.clearRect(0, 0, w, h)
      const [r, g, b] = MOSS_RGB
      const cr = Math.round(r * 255)
      const cg = Math.round(g * 255)
      const cb = Math.round(b * 255)
      const fx = FLOW_DIR[0]
      const fy = FLOW_DIR[1]
      for (const p of particles) {
        const baseX = p.bx + fx * t * p.speed
        const baseY = p.by + fy * t * p.speed
        const cxOff = Math.sin(baseY * 7.3 + t * 0.32 + p.phx) * p.curlX
        const cyOff = Math.cos(baseX * 5.7 + t * 0.27 + p.phy) * p.curlY
        const swirl = Math.sin(t * 0.18 + p.phx * 0.5) * p.swirl * 0.4
        const x = fract(baseX + cxOff + swirl) * w
        const y = fract(baseY + cyOff) * h
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    destroy() {}
  }
}

export function HighlightOverlay() {
  useEffect(() => {
    const wrap = document.createElement("div")
    wrap.style.cssText = [
      "position: fixed",
      "left: 0",
      "top: 0",
      "width: 0",
      "height: 0",
      "pointer-events: none",
      "z-index: 2147483646",
      "opacity: 0",
      "overflow: hidden",
      `transition: opacity ${FADE_MS}ms ease`,
      "will-change: opacity",
      `mask-image: ${WRAP_MASK}`,
      `-webkit-mask-image: ${WRAP_MASK}`
    ].join(";")

    const canvas = document.createElement("canvas")
    canvas.style.cssText = [
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      "opacity: 0.8"
    ].join(";")
    wrap.appendChild(canvas)
    document.body.appendChild(wrap)

    let renderer: Renderer | null = null
    try {
      renderer = makeWebGLRenderer(canvas)
    } catch (err) {
      console.warn("[slob-detector] WebGL renderer failed, falling back:", err)
    }
    if (!renderer) {
      renderer = make2DRenderer(canvas)
    }

    if (!renderer) {
      return () => {
        wrap.remove()
      }
    }

    let raf = 0
    const start = performance.now()

    const tick = () => {
      const el = useStore.getState().highlighted

      if (!el) {
        if (wrap.style.opacity !== "0") wrap.style.opacity = "0"
        raf = requestAnimationFrame(tick)
        return
      }

      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        if (wrap.style.opacity !== "0") wrap.style.opacity = "0"
        raf = requestAnimationFrame(tick)
        return
      }

      const w = rect.width + PAD * 2
      const h = rect.height + PAD * 2
      wrap.style.left = `${rect.left - PAD}px`
      wrap.style.top = `${rect.top - PAD}px`
      wrap.style.width = `${w}px`
      wrap.style.height = `${h}px`
      if (wrap.style.opacity !== "1") wrap.style.opacity = "1"

      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const cw = Math.round(w * dpr)
      const ch = Math.round(h * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
        renderer!.resize(cw, ch)
      }

      const t = (performance.now() - start) * 0.001
      renderer!.draw(t, dpr)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      renderer?.destroy()
      wrap.remove()
    }
  }, [])

  return null
}
