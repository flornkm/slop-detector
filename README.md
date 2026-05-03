![AI Slop detector](assets/readme-banner.webp)

# AI Slop Detector

This repository is WIP and just a public version of an experiment I've been working on.

## How it works (in plain English)

It's a Chrome extension. When you turn it on, a tiny 3D Geiger counter slides into the corner of every page you visit. You drag the probe over things on the page — text, images, tweets — and it tells you how AI-slop-y they look.

### The detector

There's no AI model running. Just a list of tells.

For **text**, it counts the things real LLMs and LinkedIn-poisoned humans actually do:

- Buzzwords like *delve, tapestry, navigate, testament to, leverage, paradigm*
- Phrases like *"It's not just X, it's Y"* and *"In today's fast-paced world…"*
- Em-dashes everywhere
- Sentences that are all the same length
- Three sentences in a row starting with the same word
- The brain-rot lexicon (*cooked, mogged, gyatt, no cap, delulu*)

It adds those up into a number between 0 and 1.

For **images**, it checks the URL against a list of known AI-generator hosts (OpenAI, Midjourney, Replicate, Firefly, Leonardo, etc.). On Twitter and LinkedIn, it also reads the post text next to the image and folds that score in too.

For **videos and embeds**, same idea — host fingerprinting plus any title metadata.

That score drives the geiger needle, the clicking sound, and the colour the particles around the element turn:

- 0.0–0.3 → **green** (looks human)
- 0.3–0.7 → **yellow** (suspicious)
- 0.7–1.0 → **red** (probably slop)

### What's actually happening on the page

The whole thing runs locally in your browser. Nothing gets sent to a server. The extension has two parts:

1. A **content script** that mounts on every page — that's the 3D device, the probe tracking your cursor, and the particle overlay around whatever element you're hovering.
2. A **background worker** that just listens for the toolbar icon click and toggles the extension on or off.

The 3D device is built with three.js / react-three-fiber. The particles around the highlighted element are raw WebGL (one draw call, ~150k point sprites tops). The "sticker" on the device body is a flat plane whose vertices are individually raycast onto the body mesh so it conforms to the shape.

### What it's not

Not a real AI classifier. Heuristics catch obvious slop, miss subtle slop, and will need updating as LLMs change. That's the trade — it's something you can ship in a weekend that's right most of the time, instead of nothing while you wait for a real model.

### The paradox

This whole thing was built in a weekend, with Claude. The 3D Geiger counter — body, probe, cable, screen, buttons — was modelled in Blender via Claude's [Blender MCP](https://github.com/ahujasid/blender-mcp), pose-by-pose. The code was written almost entirely in [Claude Code](https://claude.com/claude-code): the WebGL particle system, the heuristic scorer, the Twitter/LinkedIn DOM extraction, the sticker-conformance raycasting, all of it.

So yeah — an AI-slop detector, made by AI. Take that as you will.
