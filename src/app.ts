// Mounts a street of lots into a stage: sky, pavement and road, the houses side by
// side, the animals, the camera, then one loop: time of day, wind, every part's step,
// palette repaints only when the time has moved. URL flags: ?tau=0.5 pins the time of
// day, ?start=0.6 sets the starting time, ?day=180 the seconds per day, ?t and ?debug as in lib/ink.
import { el, inkDefs, run, PAPER } from '../lib/ink.ts';
import { pointerWind, seeded } from '../lib/motion.ts';
import { palette, applyPalette } from '../lib/daynight.ts';
import { type Ctx, type LotDef, type Part, H, LAYERS, GROUND, tint } from './kit.ts';
import { street } from './street.ts';
import { falls } from './falls.ts';
import { sky } from './sky.ts';
import { camera, type Camera, type View } from './camera.ts';
import { clock } from './clock.ts';
import { beagle } from './beagle.ts';

const REPAINT_EVERY = 0.0005; // of a day: about 43 s of scene time

export interface Placed { name: string; x0: number; width: number }
export interface StreetOptions {
  stage: HTMLElement;
  lots: LotDef[];
  label: string;
  /** Snap from house to house instead of following the dog. */
  paged?: boolean;
  /** Called when the window opens or fills the stage, to set the instructions. */
  onFit?: (narrow: boolean) => void;
  /** Called every frame with the visible window. */
  onView?: (view: View) => void;
}

export function mountStreet({ stage, lots, label, paged, onFit, onView }: StreetOptions): { camera: Camera; placed: Placed[]; width: number } {
  const q = new URLSearchParams(location.search);
  const d = new Date(), nowTau = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  // Real time by default (the visitor's local clock, one day per day); ?start / ?day / ?tau override.
  const time = clock({ start: Number(q.get('start') ?? nowTau), day: Number(q.get('day') ?? 86400), pinned: q.has('tau') ? Number(q.get('tau')) : null });
  const placed: Placed[] = [];
  let width = 0;
  for (const lot of lots) { placed.push({ name: lot.name, x0: width, width: lot.width }); width += lot.width; }

  const svg = el('svg', { viewBox: `0 0 ${width} ${H}`, role: 'img', 'aria-label': label });
  stage.appendChild(svg);
  const { defs, filter, stripes } = inkDefs(svg, 'h');
  const mesh = el('pattern', { id: 'h-mesh', width: 2.6, height: 2.6, patternUnits: 'userSpaceOnUse' }, defs);
  el('rect', { width: 2.6, height: 2.6, fill: PAPER }, mesh);
  el('rect', { x: 0.75, y: 0.75, width: 1.1, height: 1.1, fill: 'currentColor' }, mesh);
  const glowGrad = el('radialGradient', { id: 'h-glow' }, defs);
  el('stop', { offset: 0, 'stop-color': 'rgb(255,200,130)', 'stop-opacity': 0.85 }, glowGrad);
  el('stop', { offset: 1, 'stop-color': 'rgb(255,200,130)', 'stop-opacity': 0 }, glowGrad);
  const heavens = sky(svg, defs, width);

  // the ink wobble filter is the costliest thing on the page; phones draw clean lines instead
  const scene = el('g', matchMedia('(pointer: coarse)').matches ? {} : { filter }, svg);
  const glow = el('g', { style: 'mix-blend-mode:screen;pointer-events:none' }, svg);
  const parts: Part[] = [];
  const ctx: Ctx = {
    svg, glow, stripes,
    layers: Object.fromEntries(LAYERS.map((name) => [name, el('g', {}, scene)])) as Ctx['layers'],
    rand: seeded(7),
    add: (p) => { parts.push(p); },
  };

  const road = street(ctx, width);
  const drop = falls(ctx);
  const built = lots.map((lot, i) => lot.build(ctx, placed[i].x0, drop));
  road.kerbLine();
  const animals = beagle(ctx.layers.street, { ground: GROUND + 20, scale: 1.0, width, sniffAt: built.find((b) => b.sniffAt)?.sniffAt ?? width * 0.5, tint: (n, c, attr) => tint(ctx, n, c, attr) });
  const cam = camera(svg, stage, width, onFit ?? (() => {}), paged ? placed.map((p): [number, number] => [p.x0, p.x0 + p.width]) : undefined);

  const wind = pointerWind(svg, 0.3);
  let painted = -1;
  // start after returning, so callers can wire up their UI before the first onView
  queueMicrotask(() => run((t, dt) => {
    const tau = time.tau(t), pal = palette(tau), fr = { t, dt, wind: wind.step(t), tau, pal };
    if (Math.abs(tau - painted) > REPAINT_EVERY) {
      painted = tau;
      applyPalette(svg, pal);
      heavens.paint(pal);
      for (const p of parts) p.paint?.(pal);
    }
    for (const p of parts) p.step?.(fr);
    animals.step(t, dt, fr.wind);
    const view = cam.step(t, dt, animals.x());
    heavens.place(view, tau, pal);
    onView?.(view);
  }));
  return { camera: cam, placed, width };
}
