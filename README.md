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

- Move: WASD or arrow keys. On a narrow screen, the left joystick does the same thing.
- Look: drag the view. On a phone, drag the right side of the screen.
- Sprint: Shift
- You start at the gate, facing into the park.
- Stand inside a lot for about a second and the camera eases into the show. Walk to cancel. The bed ducks while that camera is on.
- Subtitles are always on for the show you are nearest. The corner line says what is on now. Speech synthesis is not used.
- **声音** in the corner starts a quiet Web Audio bed (drums and murmur). It stays muted until you turn it on.
- `?diag=1` shows fps, live shows, draw calls, triangles, and how many guests are full puppets versus the far stand-in.
- `?q=low`, `?q=med`, or `?q=high` pins the quality ladder. With no pin, a stretch under 16 fps drops to low.
- Debug hook: `window.__park` (`ready`, `time` / `setTime`, `lots`, `teleport`, `watch`, `listShows`, `fps`, `quality`, `draws`, `tris`, `lod`, `player`, `face`, `frame`, `inspect`)

Screenshots for a running dev server: `node tools/shots.mjs --round 1`, `--round 2`, or `--round 3`.

## Status

Round 1 is playable: a park you can walk, with guests, subtitles, and a show camera. See [docs/ROUND_1.md](docs/ROUND_1.md).

Round 2 adds the rest of the park mix. Five scores loop all day — 戏台《夜雨刀》, 茶棚《三杯茶》, 市井街《鼓边书》, 皮影棚《灯下鹤》, 校场《试刃》 — and 巡游道《河灯巡游》 runs at 午时 11:00 and 申时 15:00 (park clock). `setTime` jumps the parade. Guests gather, clap, and trail the float. See [docs/ROUND_2.md](docs/ROUND_2.md).

Round 3 is the phone HUD, a minimap, dusk tint, ducked audio, `?diag=1`, and a cheaper crowd: distant guests become two instanced shapes, still scenery shares meshes, and show lights turn off when they are far away. See [docs/ROUND_3.md](docs/ROUND_3.md).

This repository is not deployed. GitHub Pages is intentionally off.
