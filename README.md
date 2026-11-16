# 💾 NEON TRASH ORACLE — The Corruption Laboratory

A free, static, mobile-first psychedelic shader studio based on the artist's **Neon Trash Oracle** and **Prismatic Tape Oracle** collections.

**Source of truth:** [myspace_glitch](https://github.com/merrypranxter/shaderslop_designs/tree/main/myspace_glitch) and [by_math](https://github.com/merrypranxter/shaderslop_designs/tree/main/by_math).

## Start

Open `index.html` through a static HTTP server. **No Netlify, no build step, no billing, no npm dependencies.**

To publish for free on an iPhone with GitHub Pages:
1. In this repository open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select `main`, `/(root)`, and **Save**.
4. Then visit **https://merrypranxter.github.io/neon_trash_oracle/** when GitHub Pages finishes publishing.

GitHub Pages is not enabled or deployed by this source-code commit. The main app loads its 22-source manifest from `catalog.json`, so don't expect the program to work by opening `index.html` directly as a `file://` URL on an iPhone.

## What is in here

- **7 Neon Trash Oracle** canonical originals, from `myspace_glitch`.
- **15 Prismatic Tape Oracle** canonical originals, from `by_math`.
- **Exact Original** mode fetches each original self-contained HTML sketch from the artist's GitHub repository and displays it in an isolated frame. The legacy global Three.js script URL is swapped for a compatible CDN location; the actual artwork logic isn't rewritten. Requires an internet connection and can inherit any quirks of each historical original.
- **Live Remix** mode is a **new separate, parameterized WebGL2 engine**. It does not pretend to be a perfect parameter extraction of the 22 original codebases.
- Animated topologies: Oracle Eye, Cuttlefish Foam, Quasicrystal Star, Dream Tape Ribbons, Runic Halation, Compression Cathedral, Prismatic Tunnel.
- Genuine GPU **reaction–diffusion state** and **ping-pong feedback memory**, with sliders for chemistry, cell size, moiré pressure, geometry warp, chromatic aberration, tape damage, feedback strength, glow, color, and more.
- **SURPRISE**, **NEW** (confirm), **RESEED**, **MUTATE THIS**, and 2-parent **BREED NEW MONSTER**. Mutated results remain editable.
- Twelve starter palette sets with five editable color stops, palette shuffle, and color-cycle controls.
- Touch-and-drag injection into cellular state, slim header, scrollable tabs, and resizable top artwork viewport.
- PNG screenshot export with optional high-resolution re-render; MP4 via browser MediaRecorder when supported, WebM fallback. Feedback effects are **not yet guaranteed seamless loops**.
- Save and restore one preset locally in the current browser.

## Files

- `index.html` — mobile UI and controls.
- `engine.js` — custom standalone WebGL2 shader and feedback pipeline.
- `app.js` — controls, source switching, palettes, breeding, export.
- `catalog.json` — direct links to the 22 canonical original files and code; kept separate from live-remix engine.

## Known limitations / next steps

- **Verify rendering on iPhone Safari:** code was committed and its JavaScript parsed, but end-to-end WebGL rendering and MediaRecorder behavior have not yet been exercised on the target phone.
- The source HTMLs were created as standalone historical experiments; each may have independent WebGL2 and GLSL quirks. Exact Original mode is isolated so a broken vintage source can't crash the live remix.
- Audio-reactive modes, deterministic seamless export, high-bitrate MP4 transcoding for browsers that can't produce MP4, and crossbreeding of **internal original source functions** are future phases, not finished features.
- Future integration: import all saved Merrypranxter palettes and expose more original shader internals as control uniforms.

## Provenance

The originals remain in `merrypranxter/shaderslop_designs`; they were neither modified nor deleted. This project links directly to the archived code. The new live engine is a distinct mathematical reinterpretation rather than a silent replacement.

**No Netlify deployments or GitHub Actions are triggered by this project.**
