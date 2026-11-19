# 万岁山 · Wansuishan Open

A walkable web theme park where performances run in every corner, all the time. You are a little visitor. Wander, stop, and watch.

This is an experimental, offline-first project. It does **not** call paid APIs and does not need API keys. Shows, crowds, and animation are procedural or authored as local scores.

**Approach:** this repo deliberately starts from public research (Generative Agents / AI Town, crowd simulation, web theater and puppetry, theme-park sims) rather than from earlier sibling prototypes. See [docs/RESEARCH.md](docs/RESEARCH.md) and [docs/CREDITS.md](docs/CREDITS.md).

The name is inspired by the idea of 万岁山 — a Chinese theme park known for having performances almost everywhere a visitor walks. Characters, scripts, logos and show titles here are original. This is not an official or licensed recreation.

## Run locally

```bash
npm install
npm run dev
```

Vite is pinned to `http://127.0.0.1:5199/` (`strictPort`). Open that URL. There is no API key and no `.env`. After the page loads, the park runs offline.

- Move: WASD or arrow keys
- Look: drag the mouse
- Sprint: Shift
- Stand inside a lot for about a second and the camera eases into the show. Walk to cancel.
- Subtitles are always on for the show you are nearest. Speech synthesis is not used.
- **声音** in the corner starts a quiet Web Audio bed (drums and murmur). It stays muted until you turn it on.
- Debug hook: `window.__park` (`ready`, `time` / `setTime`, `lots`, `teleport`, `watch`, `listShows`, `fps`, `player`, `face`, `frame`, `inspect`)

Screenshots for a running dev server: `node tools/shots.mjs --round 1`.

## Status

Round 1 is playable: a park you can walk, three shows looping on the clock (戏台《夜雨刀》, 茶棚《三杯茶》, 市井街《鼓边书》), guests, subtitles, and a bill that also lists later lots. See [docs/ROUND_1.md](docs/ROUND_1.md). Rounds 2 and 3 add the remaining show types, crowds, phone controls, and a diagnostics overlay.

This repository is not deployed. GitHub Pages is intentionally off.
