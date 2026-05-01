import { spawn } from "bun"
import { watch } from "node:fs"

const TW_OUT = "./src/style.tw.css"

const tw = spawn({
  cmd: ["bunx", "tailwindcss", "-i", "./src/style.css", "-o", TW_OUT, "--watch"],
  stdout: "inherit",
  stderr: "inherit"
})

let pending = false
let running = false
const flatten = async () => {
  if (running) {
    pending = true
    return
  }
  running = true
  const proc = spawn({
    cmd: ["bun", "run", "css:flatten"],
    stdout: "inherit",
    stderr: "inherit"
  })
  await proc.exited
  running = false
  if (pending) {
    pending = false
    flatten()
  }
}

const watcher = watch("./src", { persistent: true }, (_event, filename) => {
  if (filename === "style.tw.css") flatten()
})

const shutdown = () => {
  watcher.close()
  tw.kill()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

await tw.exited
