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

Then open the URL Vite prints (default `http://localhost:5199/`).

- Move: WASD or arrow keys, or the on-screen stick on a phone
- Look: mouse drag / touch drag
- Sprint: Shift
- Stop near a show to watch (the camera eases toward the stage)
- `?diag=1` opens a small diagnostics overlay

## Status

Work is iterated in rounds. Notes live in `docs/ROUND_1.md`, `docs/ROUND_2.md`, `docs/ROUND_3.md` as they land.

This repository is not deployed. GitHub Pages is intentionally off.
