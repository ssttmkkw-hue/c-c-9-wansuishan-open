# Round 2 — show variety, crowds, expressiveness

## Commit

Recorded in the following docs commit after this change lands on `main`.

## What shipped

The three round-1 scores still loop. The park mix now also performs:

- 皮影棚《灯下鹤》 — glowing cloth, original silhouette crane and boatman, a side lamp, narrator and lamp-keeper, a short score with alternate lines.
- 校场《试刃》 — three performers, lunge / block / slash blocking on the dirt ring.
- 巡游道《河灯巡游》 — a float, three performers, and a trailing or watching crew. It runs at park 11:00 and 15:00 for 36 park minutes (about 36 real seconds) and loops its lines twice during that window. `window.__park.setTime(11 * 3600 + 12 * 60)` puts the float mid-route.

Crowds stand in spaced slots at the five grounded shows, clap or raise a hand on cue, and keep a wider personal radius so they stack less. Five guests are reserved to trail or line the parade while it is moving.

Expressiveness, on the existing puppets:

- Extra gestures: lunge, block, kneel, present, hush, stamp, flourish, nod, sway.
- Follow spot and a face fill that move to the speaker, with a warmer or cooler gel.
- Clearer mouth shapes, brows, cheeks, and pupils. Gaze sticks to the look target.
- Listen poses differ by puppet and add an occasional nod.
- A speaker who is not locked onto a partner may glance at a visitor in the front row.

## Checks

`npx tsc --noEmit`. Playwright (SwiftShader, 1280×800, muted) writes:

- `/workspace/wansuishan-shots/c9-r2-face.png`
- `/workspace/wansuishan-shots/c9-r2-shadow.png`
- `/workspace/wansuishan-shots/c9-r2-field.png`
- `/workspace/wansuishan-shots/c9-r2-crowd.png`
- `/workspace/wansuishan-shots/c9-r2-parade.png`

## Known issues

- Every guest is still a full puppet. That remains the main SwiftShader cost.
- Parade guests can clip the float; the float has no collider.
- A close camera can still sit near a post if the speaker is backed into scenery. The nudge only pushes out of the coarse boxes.
- Phone controls, `?diag=1`, and a quality ladder are not in this round.
