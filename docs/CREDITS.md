# Credits and licenses

This project is MIT-licensed (see `/LICENSE`). Third-party code and assets may only be used if they are permissively licensed (MIT, Apache-2.0, BSD, CC0, CC-BY, SIL OFL, or equivalent). Non-commercial or no-redistribution licenses are not used.

The implementation round should extend this file whenever a dependency or asset is added.

## Dependencies

| Work | URL | License | How it is used |
| --- | --- | --- | --- |
| three.js 0.170.0 | https://github.com/mrdoob/three.js | MIT | Renderer, scene graph, lights, and math. |
| @types/three 0.170.0 | https://github.com/three-types/three-ts-types | MIT | TypeScript declarations for the pinned three.js release. Not shipped to the browser. |
| Vite 6.0.3 | https://github.com/vitejs/vite | MIT | Dev server and bundler. |
| TypeScript 5.6.3 | https://github.com/microsoft/TypeScript | Apache-2.0 | Typecheck only. |

Yuka is not imported. Guest steering is a small original seek / arrive / separation loop, written for this repo. Playwright is used from a local tool install and is not a dependency of this package.

No font files are vendored. The UI asks for Noto Sans / Noto Serif CJK when the operating system already has them (SIL Open Font License), and falls back to generic sans-serif.

## Inspiration (ideas only, no code copied)

See [RESEARCH.md](RESEARCH.md). Notable public projects: Generative Agents / Smallville (Apache-2.0 research code), a16z AI Town (MIT), Yuka, recast-navigation-js, Wonderlandia write-up, OpenCoaster, Parkwright, various MIT web-puppet and theater experiments.

## Original content

Park layout, procedural puppets, scores, dialogue, music, the shadow-play cloth, parade float, and textures authored for this repository are original. No outside character art or audio files are shipped. The name "万岁山" refers to the *idea* of a park where performances run in every corner; this is not an official product of any real park operator.
