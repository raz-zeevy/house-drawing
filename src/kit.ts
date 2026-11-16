// Shared drawing kit: the street's scale, the per-frame contract every moving part
// follows, the scene context a house is built into, and the pen-and-paper helpers
// (bowed boxes, leaves, foliage clumps, hanging strands, windows that light up).
import { el, pen, shape, paint, hang, f, type Vec } from '../lib/ink.ts';
import { spring, pendulum, wobble, smooth, type Spring, type Pendulum } from '../lib/motion.ts';
import { nightTint, mix, rgb, toRGB, type RGB, type Palette } from '../lib/daynight.ts';
import type { Drop } from './falls.ts';

export const H = 440, GROUND = 404, SP = 0.8;
export const C = { RUST: '#a5583c', IVY: '#7f9668', FROND: '#9aa86a', RED: '#8e3b2c', GREY: '#9c9e9b', NUMBER: '#c9706b' } as const;
export const GLASS: RGB = [30, 32, 38], WARM: RGB = [255, 204, 138], BRICK: RGB = [201, 143, 120];

/** What every moving part receives each frame. */
export interface Frame { t: number; dt: number; wind: number; tau: number; pal: Palette }
/** A moving or time-of-day-aware piece of the scene. */
export interface Part {
  step?(fr: Frame): void;
  /** Colours that follow the time of day; called only when the palette has moved. */
  paint?(pal: Palette): void;
}

export const LAYERS = ['back', 'house', 'acacia', 'terrace', 'bigTree', 'right', 'hedge', 'wall', 'front', 'street', 'fall'] as const;
export type LayerName = (typeof LAYERS)[number];

/** A house on the street: how wide its lot is (at least 1280, one desktop card, so a card never shows two houses), and how to draw it at x0. */
export interface LotDef { name: string; width: number; build(ctx: Ctx, x0: number, drop: Drop): Lot }
/** What a drawn lot tells the street: where the dog likes to stop and sniff. */
export interface Lot { sniffAt?: number }

/** Everything a house needs to draw itself into the shared street. */
export interface Ctx {
  svg: SVGSVGElement;
  layers: Record<LayerName, SVGGElement>;
  /** Screen-blended layer for window and lamp light. */
  glow: SVGGElement;
  stripes: string;
  rand: (a?: number, b?: number) => number;
  add(part: Part): void;
}

// ------------------------------------------------------------------ pure helpers
export const P = (g: Element, d: string, w = SP) => { const n = pen(g, w); n.setAttribute('d', d); return n; };
export const S = (g: Element, d: string, w = SP) => { const n = shape(g, w); n.setAttribute('d', d); return n; };
/** A path whose fill is set every time the palette moves (CSS `.pp` would override a paper fill). */
export const fillPath = (g: Element, d: string, stroke = 0) => el('path', stroke ? { d, stroke: 'currentColor', 'stroke-width': stroke } : { d }, g);
/** A group shifted by dx inside a layer. */
export const at = (g: Element, dx: number) => (dx ? el('g', { transform: `translate(${dx} 0)` }, g) : el('g', {}, g));

/** Rectangle whose edges bow a little, so nothing is ruler-straight. */
export const box = (x: number, y: number, w: number, h: number, b = 0.4) =>
  `M${f(x)} ${f(y)} Q${f(x + w / 2)} ${f(y - b)} ${f(x + w)} ${f(y)} Q${f(x + w + b)} ${f(y + h / 2)} ${f(x + w)} ${f(y + h)} Q${f(x + w / 2)} ${f(y + h + b)} ${f(x)} ${f(y + h)} Q${f(x - b)} ${f(y + h / 2)} ${f(x)} ${f(y)}Z`;

export function leaf(x: number, y: number, len: number, ang: number, wd = 0.32): string {
  const c = Math.cos(ang), s = Math.sin(ang), mx = x + len * 0.5 * c, my = y + len * 0.5 * s, nx = -s * len * wd, ny = c * len * wd;
  return `M${f(x)} ${f(y)} Q${f(mx + nx)} ${f(my + ny)} ${f(x + len * c)} ${f(y + len * s)} Q${f(mx - nx)} ${f(my - ny)} ${f(x)} ${f(y)}Z`;
}

/** Block coursing: bed joints and staggered head joints. */
export function blocks(g: Element, x0: number, x1: number, y0: number, y1: number, rowH: number, bw: number): void {
  const d: string[] = [];
  for (let y = y0 + rowH; y < y1 - 1; y += rowH) d.push(`M${f(x0)} ${f(y)} Q${f((x0 + x1) / 2)} ${f(y + 0.4)} ${f(x1)} ${f(y)}`);
  for (let y = y0, r = 0; y < y1 - 1; y += rowH, r++)
    for (let x = x0 + (r % 2 ? bw / 2 : bw); x < x1 - 2; x += bw) d.push(`M${f(x)} ${f(y)} l0 ${f(Math.min(rowH, y1 - y))}`);
  P(g, d.join(' '), SP * 0.45);
}

/** A flat colour (fill or stroke) pushed toward the night palette: small accents that should stay readable. */
export function tint<T extends Element>(ctx: Ctx, n: T, colour: string, attr = 'fill'): T {
  ctx.add({ paint: (pal) => n.setAttribute(attr, nightTint(colour, pal)) });
  return n;
}

const NOON_PAPER = toRGB('#fdfcf8');
/** A coloured surface (walls, roof, gates) lit like the paper: it takes the same dusk and night light as plain paper walls. */
export function surface<T extends Element>(ctx: Ctx, n: T, colour: string, attr = 'fill'): T {
  const c = toRGB(colour);
  ctx.add({ paint: (pal) => n.setAttribute(attr, rgb(c.map((v, i) => (v * pal.paper[i]) / NOON_PAPER[i]) as RGB)) });
  return n;
}

// ------------------------------------------------------------------ foliage
/** Acacia frond: a short stem with paired leaflets. */
export function frond(ctx: Ctx, x: number, y: number, ang: number): string {
  const c = Math.cos(ang), s = Math.sin(ang), len = ctx.rand(6, 10);
  let d = `M${f(x)} ${f(y)} l${f(c * len)} ${f(s * len)}`;
  for (let i = 1; i <= 3; i++) for (const sg of [1, -1]) {
    const a2 = ang + sg * 0.9;
    d += ` M${f(x + (c * len * i) / 4)} ${f(y + (s * len * i) / 4)} l${f(Math.cos(a2) * 2.4)} ${f(Math.sin(a2) * 2.4)}`;
  }
  return d;
}

/** Scalloped foliage outline. */
export function blob(ctx: Ctx, cx: number, cy: number, r: number, sq = 0.8, lobes = 9): string {
  const ph = ctx.rand(0, 6), pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2, rr = r * (0.9 + 0.14 * Math.abs(Math.sin((a * lobes) / 2 + ph)));
    pts.push(`${f(cx + rr * Math.cos(a))} ${f(cy + rr * sq * Math.sin(a))}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

/** A foliage clump that sways as a whole on a spring driven by the wind; `shake()` kicks it. */
export interface Clump extends Part { g: SVGGElement; shake(): void }
export type Foliage = 'leaf' | 'frond' | 'ivy';
export function clump(ctx: Ctx, parent: Element, cx: number, cy: number, r: number, kind: Foliage, n: number, accent?: string, share = 0.3): Clump {
  const g = el('g', {}, parent);
  S(g, blob(ctx, cx, cy, r), SP * 0.8);
  const plain: string[] = [], acc: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ctx.rand(0, Math.PI * 2), d = Math.sqrt(ctx.rand()), x = cx + Math.cos(a) * r * 0.85 * d, y = cy + Math.sin(a) * r * 0.66 * d, ang = ctx.rand(0.5, 2.6);
    const mark = kind === 'frond' ? frond(ctx, x, y, ang) : kind === 'ivy' ? leaf(x, y, ctx.rand(3.5, 5), ang, 0.5) : leaf(x, y, ctx.rand(4, 6.5), ang);
    (accent && kind !== 'frond' && ctx.rand() < share ? acc : plain).push(mark);
  }
  P(g, plain.join(' '), SP * 0.45);
  if (accent && acc.length) tint(ctx, paint(g, accent, SP * 0.4), accent).setAttribute('d', acc.join(' '));
  const k = 1.25 - cy / H, s: Spring = spring(28, 5), ph = ctx.rand(0, 20);
  const part: Clump = {
    g,
    step: ({ t, dt, wind }) => g.setAttribute('transform', `translate(${f(s.step(wind * 1.6 * k + wobble(t * 0.8 + ph) * 0.5 * k, dt))} 0)`),
    shake: () => s.kick((Math.random() - 0.5) * 60),
  };
  ctx.add(part);
  return part;
}

/** A hanging strand: an ivy tendril over a wall or an acacia frond under the canopy. `kick()` swings it. */
export interface Strand extends Part { kick(v: number): void }
export function strand(ctx: Ctx, parent: Element, x: number, y: number, len: number, ivy: boolean): Strand {
  const stem = pen(parent, SP * 0.45), marks = pen(parent, SP * 0.45);
  const acc = ivy ? tint(ctx, paint(parent, C.IVY, SP * 0.4), C.IVY) : null;
  const p: Pendulum = pendulum(ivy ? 9 : 5, 1.1), ph = ctx.rand(0, 20), b: Vec = [x, y];
  const part: Strand = {
    kick: (v) => p.kick(v),
    step({ t, dt, wind }) {
      const deg = p.step(wind * (ivy ? 0.35 : 0.5) + wobble(t * 0.9 + ph) * 0.1, dt) * 57.3;
      const tip = hang(b, len, deg), m = hang(b, len * 0.55, deg * 0.45);
      stem.setAttribute('d', `M${f(b[0])} ${f(b[1])} Q${f(m[0])} ${f(m[1])} ${f(tip[0])} ${f(tip[1])}`);
      const n = Math.round(len / (ivy ? 6 : 4)), plain: string[] = [], accD: string[] = [];
      for (let i = 1; i <= n; i++) {
        const u = i / n, v = 1 - u;
        const px = v * v * b[0] + 2 * u * v * m[0] + u * u * tip[0], py = v * v * b[1] + 2 * u * v * m[1] + u * u * tip[1];
        const tang = Math.atan2(2 * v * (m[1] - b[1]) + 2 * u * (tip[1] - m[1]), 2 * v * (m[0] - b[0]) + 2 * u * (tip[0] - m[0]));
        if (ivy) (i % 3 === 0 ? accD : plain).push(leaf(px, py, 4.4, tang + (i % 2 ? 0.9 : -0.9), 0.5));
        else if (i % 5 === 3) plain.push(leaf(px, py, 7, tang + 0.25, 0.22));
        else for (const sg of [1, -1]) plain.push(`M${f(px)} ${f(py)} l${f(Math.cos(tang + sg) * 3)} ${f(Math.sin(tang + sg) * 3)}`);
      }
      marks.setAttribute('d', plain.join(' '));
      acc?.setAttribute('d', accD.join(' '));
    },
  };
  ctx.add(part);
  return part;
}

// ------------------------------------------------------------------ windows
/** A window: pane (glass by day, warm at night), frame, sill and a glow. `cover` (0..1) dims the glow, e.g. a shutter. */
export interface Win extends Part { pane: SVGPathElement; lit: number; setCover(c: number): void }
export function win(ctx: Ctx, g: Element, glowG: Element, x: number, y: number, w: number, h: number, on: number, frame = true): Win {
  const pane = fillPath(g, box(x, y, w, h));
  if (frame) { P(g, box(x, y, w, h), SP * 1.1); P(g, box(x + 2, y + 2, w - 4, h - 4), SP * 0.5); P(g, `M${x - 3} ${y + h + 2} L${x + w + 3} ${y + h + 2}`); }
  const gl = el('circle', { cx: x + w / 2, cy: y + h / 2, r: Math.max(w, h) + 22, fill: 'url(#h-glow)', opacity: 0 }, glowG);
  let cover = 0;
  const glowNow = () => gl.setAttribute('opacity', f(part.lit * (1 - cover)));
  const part: Win = {
    pane, lit: 0,
    setCover(c) { cover = c; glowNow(); },
    paint(pal) {
      part.lit = smooth(on - 0.12, on + 0.12, pal.lamp);
      pane.setAttribute('fill', rgb(mix(mix(pal.paper, GLASS, 0.75), WARM, part.lit)));
      glowNow();
    },
  };
  ctx.add(part);
  return part;
}
