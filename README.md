# House Behind the Trees

An animated ink drawing of a house, drawn from street photos. A beagle and a white cat
wander past, the wind follows the pointer, and day turns to night.

Live: https://raz-zeevy.github.io/house-drawing/

## Run it

```sh
npm install
npm run dev        # http://localhost:5173/house-drawing/
npm run typecheck
npm run build      # dist/
```

Every push to `main` is typechecked, built and published by `.github/workflows/pages.yml`.

URL flags: `?tau=0.5` pins the time of day (0 midnight, 0.5 noon), `?start=0.6` sets the
starting time, `?day=180` the seconds per day, `?debug` steps time by hand (`window.__step(s)`).

## Layout

| | |
|---|---|
| `lib/` | Drawing, gait, motion and day/night modules from [line-art-animation](https://github.com/JDhruv14/line-art-animation) (MIT, see `lib/LICENSE`). |
| `src/kit.ts` | Street scale, the `Part` contract (`step` each frame, `paint` when the time of day moves), the `Ctx` a house draws into, and shared helpers: bowed boxes, leaves, foliage clumps, hanging strands, windows. |
| `src/home.ts` | The house as a lot: `home(ctx, x0, drop)` draws it at any x on the street. |
| `src/street.ts` | Pavement, kerb and road under all houses. |
| `src/beagle.ts` | The beagle and the cat, each at their own pace. |
| `src/sky.ts`, `src/camera.ts`, `src/clock.ts`, `src/falls.ts` | Sky with sun and moon, the phone window (swipe, pinch), the time slider, falling leaves. |
| `src/main.ts` | Builds the street and runs the loop. |

To add a house, write another lot function with the same shape as `home()` and place
it at the next x in `main.ts`.
