// Builds the street (sky, pavement and road, the houses, the animals), then runs one
// loop: time of day, wind, every part's step, palette repaints only when the time has
// moved, and the phone camera. URL flags: ?tau=0.5 pins the time of day, ?start=0.6
// sets the starting time, ?day=180 the seconds per day, ?t and ?debug as in lib/ink.
import { el, inkDefs, run, PAPER } from '../lib/ink.ts';
import { pointerWind, seeded } from '../lib/motion.ts';
import { palette, applyPalette } from '../lib/daynight.ts';
import { type Ctx, type Part, LAYERS, GROUND } from './kit.ts';
import { home } from './home.ts';
import { street } from './street.ts';
import { falls } from './falls.ts';
import { sky } from './sky.ts';
import { camera } from './camera.ts';
import { clock } from './clock.ts';
import { tint } from './kit.ts';
import { beagle } from './beagle.ts';

const q = new URLSearchParams(location.search);
const time = clock({ start: Number(q.get('start') ?? 0.6), day: Number(q.get('day') ?? 180), pinned: q.has('tau') ? Number(q.get('tau')) : null });
const WIDTH = 1280;
const REPAINT_EVERY = 0.0005; // of a day: about 43 s of scene time

// ---------- svg, defs, layers
const stage = document.querySelector<HTMLElement>('#stage')!;
const svg = el('svg', { viewBox: `0 0 ${WIDTH} 440`, role: 'img', 'aria-label': 'Line drawing of a white house behind trees, ivy over a block wall, a metal gate and a terrace with a hammock' });
stage.appendChild(svg);
const { defs, filter, stripes } = inkDefs(svg, 'h');
const mesh = el('pattern', { id: 'h-mesh', width: 2.6, height: 2.6, patternUnits: 'userSpaceOnUse' }, defs);
el('rect', { width: 2.6, height: 2.6, fill: PAPER }, mesh);
el('rect', { x: 0.75, y: 0.75, width: 1.1, height: 1.1, fill: 'currentColor' }, mesh);
const glowGrad = el('radialGradient', { id: 'h-glow' }, defs);
el('stop', { offset: 0, 'stop-color': 'rgb(255,200,130)', 'stop-opacity': 0.85 }, glowGrad);
el('stop', { offset: 1, 'stop-color': 'rgb(255,200,130)', 'stop-opacity': 0 }, glowGrad);
const heavens = sky(svg, defs, WIDTH);

const coarse = matchMedia('(pointer: coarse)').matches;
// the ink wobble filter is the costliest thing on the page; phones draw clean lines instead
const scene = el('g', coarse ? {} : { filter }, svg);
const glow = el('g', { style: 'mix-blend-mode:screen;pointer-events:none' }, svg);
const parts: Part[] = [];
const ctx: Ctx = {
  svg, glow, stripes,
  layers: Object.fromEntries(LAYERS.map((name) => [name, el('g', {}, scene)])) as Ctx['layers'],
  rand: seeded(7),
  add: (p) => { parts.push(p); },
};

// ---------- the street and what's on it
const road = street(ctx, WIDTH);
const drop = falls(ctx);
const lot = home(ctx, 0, drop);
road.kerbLine();
const animals = beagle(ctx.layers.street, { ground: GROUND + 20, scale: 1.0, width: WIDTH, sniffAt: lot.sniffAt, tint: (n, c, attr) => tint(ctx, n, c, attr) });

// ---------- phone camera and hint
const hint = document.querySelector('#hint');
const cam = camera(svg, stage, WIDTH, (narrow) => {
  if (hint) hint.textContent = narrow
    ? 'Swipe to look along the street, pinch to zoom out. Tap the trees, the ivy, the gate, the shutter, the hammock, the dog or the cat.'
    : `${coarse ? 'Tap' : 'Move the pointer for wind, and click'} the trees, the ivy, the gate, the shutter, the hammock, the dog or the cat.`;
});

// ---------- loop
const wind = pointerWind(svg, 0.3);
let painted = -1;
run((t, dt) => {
  const tau = time.tau(t), pal = palette(tau), fr = { t, dt, wind: wind.step(t), tau, pal };
  if (Math.abs(tau - painted) > REPAINT_EVERY) {
    painted = tau;
    applyPalette(svg, pal);
    heavens.paint(pal);
    for (const p of parts) p.paint?.(pal);
  }
  for (const p of parts) p.step?.(fr);
  animals.step(t, dt, fr.wind);
  heavens.place(cam.step(t, dt, animals.x()), tau, pal);
});
