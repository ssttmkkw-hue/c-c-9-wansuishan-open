# Round 1 — walkable park, three live shows

## Commit

- `894f384` feat: walkable park with three looping shows

## What shipped

A Vite + TypeScript + three.js `0.170.0` park at `http://127.0.0.1:5199/`.

- Third-person visitor. WASD / arrows, drag to look, Shift to sprint, collision against stalls, the stage, the tea table, the pond, trees, and the courtyard walls.
- Park clock faster than real time (one real second = one park minute), starting at 巳时 09:00. The HUD lists what is on now and what is only scheduled.
- Three scores loop at once:
  - 戏台《夜雨刀》— two fighters and a drummer, follow spot, swords, blocking marks.
  - 茶棚《三杯茶》— three people taking turns around a table.
  - 市井街《鼓边书》— storyteller and gong player.
- Each score can swap a line every loop from a small reaction table, so a repeat is not a single frozen sentence.
- Procedural puppets: spine, neck, head, two-bone arms and legs, walk and idle, gesture phrasing (fast attack, held pose, ease back), blink, brows, mouth, look-at, listen pose, prop sockets (sword, fan, drum stick).
- Guests walk a waypoint loop or steer into spectator slots, clap on cue, and vendors glance at the player.
- Lingering in a lot eases a show camera (wide / three-quarter / close on whoever is speaking). Walking or a real look-drag cancels it. Subtitles in Chinese with an English line.
- Web Audio stays muted until the 声音 button. No `speechSynthesis`.
- `window.__park` is set once the first frame has rendered.

皮影棚, 校场, and 巡游道 are built and listed on the bill as later calls. They do not perform yet.

## Architecture

Simulation and rendering share one frame, but the show clock is derived from park time (`parkTime / 60`), so `setTime` scrubs every score. Scores are data (`src/shows/scores.ts`). `ActorShow` places puppets in a lot-local group, picks the active line, and aims a spot at the speaker. The crowd only learns about shows through focus points and clap pulses.

Steering is original (see the note in `docs/RESEARCH.md`). No network, no API key, no `.env`.

## Checks

`npx tsc --noEmit` is clean. Playwright (SwiftShader Chromium, 1280×800) reported no page errors. `window.__park.ready` is true. Teleport / `watch` reached 戏台, 茶棚, and 市井街 with subtitles. Headless frame rate settled around 20 fps with the full puppet crowd; a fresh load can spike higher before the scene fills.

Screenshots (outside the repo):

- `/workspace/wansuishan-shots/c9-r1-overview.png`
- `/workspace/wansuishan-shots/c9-r1-stage.png`
- `/workspace/wansuishan-shots/c9-r1-tea.png`
- `/workspace/wansuishan-shots/c9-r1-market.png`
- `/workspace/wansuishan-shots/c9-r1-face.png`
- `/workspace/wansuishan-shots/c9-r1-walk.png`

## Known issues

- Puppets are deliberately blocky. Faces read at a close camera; from the back of a lot the eyes are small.
- Guests can still bunch when several of them choose the same show, and a spectator can overlap a stall.
- The show camera can sit near a stage post.
- Only three shows actually perform. The parade, shadow booth, and martial field are scenery plus billboard text.
- Every guest is a full puppet. Instancing is used for stones and trees, not for people. That is the main cost on SwiftShader.
- Phone controls and `?diag=1` are not in this round.
