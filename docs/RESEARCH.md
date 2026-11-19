# Research notes — Wansuishan Open

This document records what we looked at on GitHub and the web before choosing an architecture. The goal is a **walkable park full of simultaneous performances**, with **expressiveness** as the top priority, running **entirely offline** in a browser (no API keys).

The park idea is inspired by the real 万岁山 in Kaifeng — a place people describe as having shows in every corner, all day — but we are not copying official intellectual property. Names, scripts, characters and art in this repo are original.

We did **not** start from the author's earlier English-sim or stage-play repositories. Those are a useful reminder that "a stage with talking models" is not enough; this project should feel like walking into a living fairground.

## 1. AI-driven NPC towns

### Generative Agents / Smallville
- Paper: [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) (Park, O'Brien, Cai, Morris, Liang, Bernstein, 2023)
- Code: [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) — Apache-2.0
- Ideas worth borrowing:
  - A **memory stream** of observations (even a tiny, non-LLM one).
  - A **daily plan** that can be interrupted when something interesting happens nearby (a parade, a fight scene, a crowd gasp).
  - Agents that can **watch** each other, not only perform.
- What we will not borrow: a cloud LLM loop. The paper's believability comes from GPT-3.5/4, which we cannot require at runtime.

### AI Town (a16z)
- [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) — MIT
- Architecture notes: [ARCHITECTURE.md](https://github.com/a16z-infra/ai-town/blob/main/ARCHITECTURE.md)
- Live/demo context: [convex.dev/ai-town](https://convex.dev/ai-town)
- Ideas worth borrowing:
  - A clean split: **simulation tick** vs **renderer**.
  - Agents submit *inputs* (walk here, start talking) rather than writing the world directly.
  - Conversations have start / continue / leave phases.
  - Pixel-town presentation is charming, but too flat for "standing in a crowd watching a fight".
- What we will not borrow: Convex backend, Clerk, vector DBs, or any hosted model. AI Town is a starting kit for LLM towns; we need a theme park that works with the tab closed to the network (after the page loads).

**Takeaway:** keep a scheduled, tick-based society (who is supposed to be on which stage at what park-minute), plus a lightweight "notice and react" layer. Replace the LLM with authored **scores** and a small procedural improviser (templates, beat grammar, reaction tables).

## 2. Theme-park simulations

### Wonderlandia
- Write-up and demo: [Wonderlandia — open-to-close day at a 3D theme park](https://kody-w.github.io/learnwithkody/examples/theme-park-day/)
- Ideas worth borrowing:
  - One scene, many **sub-locations** (gate, street, hub, rides, food, meet-and-greet).
  - An **open-to-close act cycle** (rope drop, morning, noon parade, afternoon, golden hour, night, close).
  - **InstancedMesh** crowds wandering between anchors.
  - A **parade** as a first-class scheduled event, not a decoration.
  - A camera "director" that can cut for a trailer — useful when the player stands still to watch.
- Caveat: the published example is a cinematic day-cycle more than a playable walker. We need a player avatar that can actually stroll and stop.

### OpenCoaster
- [tilework-tech/opencoaster](https://github.com/tilework-tech/opencoaster) (see README)
- Ideas worth borrowing:
  - Simulation in a **Web Worker** so thousands of guests do not hitch the frame.
  - Guests with needs and opinions who **choose** what to watch or ride.
  - Deterministic sim, everything local, procedural or original art.
- What we will not borrow: a tycoon builder loop. We are visitors, not managers.

### Parkwright
- [lopeselio/parkwright](https://github.com/lopeselio/parkwright) — MIT, three.js park builder with simulated visitors
- Useful as proof that a path + stall + visitor sim can live in three.js. We will not take the blockchain/TEE manager layer.

**Takeaway:** design the park as a clock. Shows have call times. Crowds walk, queue, gather, and react. The player is one more body in that clock.

## 3. Crowd simulation and pathfinding on the web

- [Mugen87/yuka](https://github.com/mugen87/yuka) — MIT. Engine-agnostic game AI: steering (seek, arrive, separation, flocking, obstacle avoidance), state/goal machines, navmesh, vision/memory. Examples use three.js. Docs: [mugen87.github.io/yuka](https://mugen87.github.io/yuka/).
- [isaac-mason/recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js) — MIT. WASM port of Recast/Detour, with `@recast-navigation/three` and a `Crowd` (Detour crowd / corridor following). Strong, but heavier than we need on day one.
- [charles-masse/portfolio](https://github.com/charles-masse/portfolio) — three.js + Yuka crowd portfolio: InstancedMesh characters, pedestrian / spectator / flock behaviours.
- Classic references: Reynolds steering, RVO/ORCA. We can start with separation + arrive-at-anchor + "become a spectator when a show is loud/nearby".

**Takeaway:** start with a waypoint graph on park paths and Yuka-style steering (either the library or a thin reimplementation). Use InstancedMesh (or a two-LOD scheme: expressive puppets near the camera / instanced billboards or capsules in the distance). Revisit recast if path quality becomes the bottleneck.

Round 1 chose the thin reimplementation: seek, arrive, and separation on a hand-authored waypoint loop, plus fixed spectator slots in front of each live lot. That keeps the runtime dependency list to three.js. Yuka remains a fine later swap if navigation gets more complicated than the park paths. Instanced meshes are used for path stones and trees; guests are still individual puppets until the performance pass.

## 4. Web theater, puppetry, and expressiveness

Earlier stage-play attempts felt stiff: bodies frozen on the last gesture, faces that do not listen, cameras that do not care who is speaking. These projects point at better habits.

- [rhmoller/virtual-puppet-theater](https://github.com/rhmoller/virtual-puppet-theater) — MIT, three.js puppet stage. Hand tracking + an AI partner. We cannot depend on a cloud model or ElevenLabs, but the *stage craft* (a puppet that clearly emotes) is the bar.
- [GLAMhack26-theatre/puppetshow](https://github.com/GLAMhack26-theatre/puppetshow) — MIT. Rigged marionette, Rapier strings, **a lighting rig designed with a theatre lighting person**, scene changes behind a curtain, follow spots. Lighting and curtains are cheap, high-leverage expressiveness.
- [AquiGorka/puppets](https://github.com/AquiGorka/puppets) — Three.js + oimo.js ragdoll marionette. Physics-y motion reads as alive even when the script is simple.
- [orbitalfoundation/orbital-puppet](https://github.com/orbitalfoundation/orbital-puppet) — visemes, **gaze**, blink, emotion on a 3D rig. The face loop (look-at, blink, lip shapes, brows) is more important than a high-poly model.
- [Furkiozknn/karagoz](https://github.com/Furkiozknn/karagoz) — MIT. A 3D coffee house whose *show* is a shadow-puppet cloth, with procedural Web Audio. Proof that a park can have a **shadow-play booth** as one of several always-on attractions, using technique not assets.

**Takeaway:** every performer needs a face (eyes, brows, lids, mouth shapes), a look-at, a listen pose, gesture phrasing (attack / hold / release), and lighting that follows the action. When the player stops, a small **show camera** may ease in (two-shot, 3/4, close-up) without stealing control entirely.

## 5. Characters, animation, and licensing landmines

Expressiveness tempts us to drop in Mixamo or a marketplace VRM. For a public, key-free repo that is the wrong default.

| Source | License | Use here? |
| --- | --- | --- |
| [three.js](https://github.com/mrdoob/three.js) | MIT | Yes, core renderer. |
| [pixiv/three-vrm](https://github.com/pixiv/three-vrm) | MIT (library) | Optional later. The *library* is fine; many VRM *files* are not. |
| Adobe Mixamo | Proprietary (use in games, limited redistribution of raw files) | **Do not vendor** FBX/CLIPs. |
| Ready Player Me avatars | Typically CC BY-NC-SA for site-created avatars | **Skip** (non-commercial share-alike). |
| Kenney asset packs (e.g. [Animated Characters](https://kenney.nl)) | CC0 | Optional props / trees / kits. Attribution still goes in CREDITS. |
| Older Quaternius packs | Often CC0; newer packs use a tighter QAL that forbids redistributing the raw assets | Only use a pack after reading that pack's license. Prefer CC0 or original. |
| Kenney / CC0 UI fonts and textures | CC0 or SIL OFL | Fine. |

**Preferred character approach:** original **procedural puppets** with a simple humanoid rig we fully own:

- Low-poly body (boxes / capsules / toon meshes) generated in code.
- Spine, neck, head; two-bone arms; two-bone legs.
- Procedural walk (sine + pelvis bob + optional foot planting), idle breathing and weight shift.
- Analytic or CCD IK for gestures (point, bow, juggle, sword line, drum, lion-dance).
- A face card or small 3D face with blink, brow, viseme / mouth shapes, and eye look-at.
- Prop sockets (fans, drums, balls, spears, lanterns).
- Near-field puppets are unique meshes; far-field guests are instanced and cheaper.

This is bolder than "load a glTF and play a clip", and it stays offline and redistributable.

## 6. Rendering stack for a walkable web park

- **three.js + Vite + TypeScript** is the obvious default: huge examples corpus, instancing, lights, postprocessing if we stay careful, easy Playwright testing.
- Babylon.js is equally capable; we would pick it only if we leaned hard on its animation/crowd kits. three.js plus a small sim layer is enough and easier to keep tiny.
- Phaser / pixi-style 2D (as in AI Town) is faster, but earlier work already showed that a flat stage under-sells a "stop and watch" park. 3D, even stylized and low-poly, is the point.
- Stylized / toon shading, banners, lanterns, and a modest day-night grade will do more than extra polygons.
- Phone: virtual joystick, drag-to-look, a readable show title when you approach, and a quality ladder (pixel ratio, instance count, lights).

## 7. Architecture we intend to try

This is the starting bet. Implementation may tighten it, but should not quietly become "one stage, four actors, one script".

1. **Park clock + score engine.** A park-time clock (faster than real time) and JSON **scores**: roles, blocking marks, lines, gestures, lights, prop cues, optional camera beats. Several scores run at once in different lots. A schedule decides which score is live in which lot.
2. **Procedural improviser.** When a score allows it, fill gaps from reaction tables (heckle, gasp, bow to the player, delay a cue if the crowd has not gathered). No network model.
3. **Expressive puppets** as in §5, plus a **listen** state so non-speakers are alive.
4. **Guests** (including the player) walk paths with steering. Guests become spectators at the nearest loud or scheduled show, face the stage, clap or lean.
5. **Show types (target mix):**
   - Open-air stage play (combat or opera-like blocking, follow spot).
   - Teahouse / street conversation skit (two or three people, clearly taking turns).
   - Street acrobat / juggler (props, rhythm).
   - Shadow-play booth (cloth + silhouettes + lamp).
   - Storyteller or drum/song circle.
   - A scheduled **parade** on the main path (floats + performers + trailing crowd).
6. **Watch mode.** If the player lingers in a lot, ease a show camera and raise subtitle / title cards. Movement cancels it.
7. **Audio.** Web Audio: murmur, drums, cymbals, footsteps, a simple motif. `speechSynthesis` is optional and must be mutable/skippable in tests; **subtitles always exist**.
8. **Debug hook** `window.__park` for Playwright: clock, teleport, force a show, list lots, camera, quality.

Runtime rule: **no API keys, no `.env`, works after a static `npm run dev` / `npm run build`.**

## 8. Round plan

- **R1 — walkable park, several always-running shows, a schedule.** Gate, paths, two or more lots plus a street pitch, a visible clock / "now showing" list, a player that can walk up and watch, puppets that already have faces and listen poses.
- **R2 — variety, crowds, expressiveness.** More show types (parade, shadow booth, another skit), denser guests who gather and react, richer gestures and lighting, clearer lip/brow/gaze.
- **R3 — polish, performance, phone.** LOD / instancing, quality ladder, touch stick, readable UI on a narrow screen, fewer hitching lights, a diagnostics flag.

## 9. Sources (quick list)

- https://arxiv.org/abs/2304.03442
- https://github.com/joonspk-research/generative_agents
- https://github.com/a16z-infra/ai-town
- https://github.com/a16z-infra/ai-town/blob/main/ARCHITECTURE.md
- https://kody-w.github.io/learnwithkody/examples/theme-park-day/
- https://github.com/tilework-tech/opencoaster
- https://github.com/lopeselio/parkwright
- https://github.com/Mugen87/yuka
- https://github.com/isaac-mason/recast-navigation-js
- https://github.com/charles-masse/portfolio
- https://github.com/pixiv/three-vrm
- https://github.com/rhmoller/virtual-puppet-theater
- https://github.com/GLAMhack26-theatre/puppetshow
- https://github.com/AquiGorka/puppets
- https://github.com/orbitalfoundation/orbital-puppet
- https://github.com/Furkiozknn/karagoz
- https://kenney.nl
- https://github.com/mrdoob/three.js
