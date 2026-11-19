# Round 3 — polish, performance, phone

## Commit

Recorded in the following docs commit after this change lands on `main`.

## What shipped

- Narrow screens (under 820px, including a 390×844 phone) get a left joystick and drag-to-look. The bill collapses to a “现在演出 / 正在看” line. Subtitles sit above the stick, beside the minimap.
- Visitors spawn at the gate, facing in.
- From 16:00 to 19:00 the sky goes gold and the lanterns brighten. After 19:00 and before 06:00 the park is dusk and the lanterns carry the light.
- Watching a show ducks the audio bed.
- Distant guests skip the full puppet and draw as an instanced body and head. Still scenery that shares a flat color is merged. Show spots and fills stay on for the show you are watching, and for nearby shows on med/high.
- Quality starts at med. `?q=low|med|high` pins it. If fps stays under 16, it drops to low on its own.
- `?diag=1` prints fps, live show count, draw calls, triangles, LOD counts, and the quality step.

## Checks

`npx tsc --noEmit` is clean. Playwright (SwiftShader Chromium, muted, no page exceptions) wrote:

- `/workspace/wansuishan-shots/c9-r3-overview.png`
- `/workspace/wansuishan-shots/c9-r3-diag.png`
- `/workspace/wansuishan-shots/c9-r3-stage.png`
- `/workspace/wansuishan-shots/c9-r3-shadow.png`
- `/workspace/wansuishan-shots/c9-r3-mobile.png`

Headless SwiftShader, 1280×800, quality med, `?diag=1`: the overview (0 full guests, 20 instanced) logged about 50 fps, ~500 draw calls, ~27k triangles. A show camera, where the nearby crowd is still full puppets, settled around 20 fps (stage ~21 fps / ~240 draws, shadow booth ~20 fps / ~330 draws).

The phone check moved the visitor with the joystick, dragged the view, then opened 市井街. The subtitle, joystick, and minimap sit in separate bands.

## Known issues

- Performers are still full puppets, so a close crowd is the remaining cost. The far LOD does not help while you are standing in a show.
- Guests on the main path can still pass close to each other. They no longer share a single point, but the path is narrow.
- The parade float does not collide, so a visitor can walk through it.
- Draw calls stay in the hundreds because each performer’s face is many small meshes.
