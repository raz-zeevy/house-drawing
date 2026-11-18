// An emblem for each house, drawn from the house itself, in three styles to choose from:
//  - sketch: the front of the house in a few pen lines with its own colours, like a margin doodle
//  - stamp:  the same drawing cut as a one-colour rubber stamp in a ring with the name around it
//  - detail: the one thing you'd know the house by, drawn large (the gate, the green gate, the arches)
// Everything is drawn in a 140 x 100 box, ground at y = 90.
import { el, pen, f } from '../lib/ink.ts';

export type Style = 'sketch' | 'stamp' | 'detail';
export const STYLES: Style[] = ['sketch', 'stamp', 'detail'];
export const BOX = { w: 140, h: 100 };

const PAPER = '#fdfdfc', DARK = '#4b4a4f';
// a drawing pass: `light` for coloured or white surfaces, `dark` for glass and shutters. In a stamp the
// light ones turn to paper and the dark ones to the stamp's ink, which is what a lino cut does.
interface Ink { g: Element; light(c: string): string; dark(c?: string): string; mono: boolean }

const line = (k: Ink, d: string, w = 0.5, extra: Record<string, string | number> = {}) => { const n = pen(k.g, w); n.setAttribute('d', d); for (const a in extra) n.setAttribute(a, String(extra[a])); return n; };
const fill = (k: Ink, d: string, c: string, w = 0.5) => el('path', { d, fill: c, stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round' }, k.g);
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
// a slightly bumpy outline round an ellipse: a crown, a hedge
function cloud(cx: number, cy: number, rx: number, ry: number, bumps: number, seed = 1): string {
  const pts: string[] = [];
  for (let a = 0; a <= 96; a++) {
    const t = (a / 96) * Math.PI * 2, r = 1 + 0.07 * Math.abs(Math.sin(t * bumps / 2 + seed));
    pts.push(`${f(cx + rx * r * Math.cos(t))} ${f(cy + ry * r * Math.sin(t))}`);
  }
  return 'M' + pts.join('L') + 'Z';
}
// little leaf ticks or blossoms scattered in a region, deterministic
function dots(k: Ink, x0: number, y0: number, x1: number, y1: number, n: number, c: string, r = 0.7, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const d: string[] = [];
  for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); d.push(`M${f(x - r)} ${f(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`); }
  el('path', { d: d.join(''), fill: k.mono ? 'currentColor' : c }, k.g);
}
const bricks = (k: Ink, x0: number, y0: number, x1: number, y1: number, rh = 4, bw = 9) => {
  const d: string[] = [];
  for (let y = y0 + rh, r = 0; y < y1; y += rh, r++) d.push(`M${x0} ${y}H${x1}`);
  for (let y = y0, r = 0; y < y1 - 0.5; y += rh, r++) for (let x = x0 + (r % 2 ? bw / 2 : bw); x < x1 - 1; x += bw) d.push(`M${x} ${y}v${Math.min(rh, y1 - y)}`);
  line(k, d.join(''), 0.25);
};

// ---------- the houses, whole
const sketches: Record<string, (k: Ink) => void> = {
  'Arbel 189': (k) => {
    // the white house behind, the acacia arching over it, the hedge on the block wall, the gate
    fill(k, 'M49 24h46v4h-46Z', k.light(PAPER));
    fill(k, 'M52 28h40v50h-40Z', k.light(PAPER));
    fill(k, rect(57, 34, 9, 10), k.dark()); fill(k, rect(77, 34, 9, 10), k.dark()); fill(k, rect(77, 50, 9, 9), k.dark());
    line(k, 'M58 36h7M58 38h7M58 40h7M58 42h7', 0.25, { stroke: PAPER });
    line(k, 'M40 78 Q42 50 47 22 M46 30 Q52 22 60 18', 0.7);
    fill(k, cloud(30, 14, 28, 10, 11, 1), k.light(PAPER));
    dots(k, 6, 7, 54, 21, 46, '#3d3d3a', 0.45, 2);
    line(k, [10, 16, 22, 28, 34, 40, 46, 52].map((x, i) => `M${x} 22 v${12 + (i % 3) * 7}`).join(''), 0.3, { 'stroke-dasharray': '1.2 1.2' });
    fill(k, cloud(108, 34, 16, 18, 9, 2), k.light(PAPER));
    dots(k, 94, 20, 122, 50, 26, '#a5492f', 0.6, 3);
    fill(k, cloud(56, 68, 40, 8, 14, 3), k.light(PAPER));
    dots(k, 20, 62, 92, 74, 40, '#5d7a4a', 0.55, 5);
    fill(k, 'M8 74h88v16h-88Z', k.light(PAPER)); bricks(k, 8, 74, 96, 90);
    fill(k, 'M96 60h8v30h-8Z', k.light(PAPER)); bricks(k, 96, 60, 104, 90, 4, 8);
    fill(k, 'M104 64h20v26h-20Z', k.dark('#5a5a60'));
    line(k, Array.from({ length: 9 }, (_, i) => `M${106 + i * 2} 66v22`).join(''), 0.25, { stroke: PAPER });
    for (const [a, l] of [[-70, 22], [-40, 20], [-15, 18], [-100, 16]]) {
      const r = (a * Math.PI) / 180, x = 128 + l * Math.cos(r), y = 58 + l * Math.sin(r);
      fill(k, `M128 58Q${f(128 + l * 0.5 * Math.cos(r - 0.3))} ${f(58 + l * 0.5 * Math.sin(r - 0.3))} ${f(x)} ${f(y)}Q${f(128 + l * 0.5 * Math.cos(r + 0.3))} ${f(58 + l * 0.5 * Math.sin(r + 0.3))} 128 58Z`, k.light(PAPER), 0.4);
    }
    fill(k, 'M124 60h8v30h-8Z', k.light(PAPER)); bricks(k, 124, 60, 132, 90, 4, 8);
    line(k, 'M2 90H138', 0.7);
  },
  'Meir Shacham 3': (k) => {
    // the tiled hip roof with its lattice terrace, the stone house, the glazed balcony, the hedge, the green gate
    fill(k, rect(38, 34, 64, 42), k.light('#ece1c8')); bricks(k, 38, 34, 102, 76, 5, 10);
    fill(k, 'M30 34L46 22H94L110 34Z', k.light('#8b6f60'));
    fill(k, 'M64 22L70 17L76 22Z', k.light(PAPER), 0.4);
    line(k, 'M40 22V17H62V22M40 17L62 22M40 22L62 17M51 17V22', 0.3);
    fill(k, rect(42, 38, 34, 14), k.dark());
    line(k, 'M42 41H76' + Array.from({ length: 5 }, (_, i) => `M${f(42 + (i + 1) * 34 / 6)} 38v14`).join(''), 0.35, { stroke: PAPER });
    fill(k, rect(40, 52, 40, 3), k.light(PAPER), 0.4);
    dots(k, 44, 49.5, 74, 51.5, 7, '#c9563c', 0.7, 2);
    fill(k, rect(84, 38, 11, 14), k.dark());
    line(k, 'M86.5 38v14M89.5 38v14M92.5 38v14', 0.3, { stroke: PAPER });
    fill(k, cloud(48, 66, 34, 11, 13, 1), k.light(PAPER));
    fill(k, cloud(92, 70, 26, 8, 11, 2), k.light(PAPER));
    dots(k, 20, 58, 76, 74, 32, '#7f9bd0', 0.7, 4);
    dots(k, 70, 64, 114, 76, 22, '#c9563c', 0.6, 9);
    fill(k, 'M6 90V76H58V78H100V74H134V90Z', k.light(PAPER)); bricks(k, 6, 78, 134, 90, 4, 10);
    line(k, 'M16 90V48', 0.9);
    dots(k, 12, 46, 20, 80, 14, '#e2b53a', 0.7, 6);
    fill(k, rect(22, 64, 11, 26), k.light('#3f8a52'));
    line(k, 'M22 77h11', 0.3);
    fill(k, rect(112, 66, 16, 24), k.light('#c7c9c4'));
    line(k, 'M116 66v24M120 66v24M124 66v24', 0.25);
    line(k, 'M2 90H138', 0.7);
  },
  'Herzl 34': (k) => {
    // the white Tel Aviv blocks either side, the teal one between with its tower and twin arches, the shops, the wires
    fill(k, rect(2, 30, 34, 60), k.light(PAPER)); fill(k, rect(104, 26, 34, 64), k.light(PAPER));
    for (const y of [36, 54]) { fill(k, rect(6, y, 8, 9), k.dark()); fill(k, rect(22, y, 8, 9), k.dark()); fill(k, rect(108, y - 2, 10, 10), k.dark()); fill(k, rect(124, y - 2, 10, 10), k.dark()); }
    line(k, 'M2 47H36M2 65H36M104 46H138M104 64H138', 0.3);
    fill(k, 'M36 74V26H56V18H68V15H78V26H104V74Z', k.light('#5e9a9b'));
    fill(k, rect(38, 29, 16, 15), k.light('#8e8e8c'), 0.35); fill(k, rect(38, 48, 16, 14), k.light('#8e8e8c'), 0.35);
    fill(k, rect(81, 30, 21, 14), k.light('#8e8e8c'), 0.35); fill(k, rect(81, 48, 21, 14), k.light('#8e8e8c'), 0.35);
    fill(k, rect(41, 32, 5, 9), k.dark()); fill(k, rect(41, 51, 9, 9), k.dark()); fill(k, rect(85, 32, 6, 8), k.dark()); fill(k, rect(92, 51, 8, 9), k.dark());
    line(k, 'M81 40H102' + Array.from({ length: 8 }, (_, i) => `M${82 + i * 2.7} 40v4`).join(''), 0.25);
    dots(k, 82, 39.2, 101, 40.2, 9, '#e8b04a', 0.45, 3);
    for (const x of [58.5, 70]) fill(k, `M${x} 61V${50}A3 3 0 0 1 ${x + 6} 50V61Z`, k.dark());
    fill(k, rect(62, 30, 6, 9), k.dark());
    line(k, 'M34 26L56 24M76 24L106 26', 0.5);
    fill(k, rect(36, 74, 68, 16), k.light('#b7b7b5'));
    fill(k, rect(38, 76, 26, 14), k.dark('#2b2b2e')); fill(k, rect(43, 79, 16, 3), k.light(PAPER), 0.3);
    fill(k, 'M66 74H94L92 79H68Z', k.dark('#2b2b2e'));
    fill(k, rect(96, 75, 8, 15), k.dark());
    line(k, 'M0 18Q30 34 70 30T140 20M0 24Q40 40 140 28', 0.25);
    line(k, 'M2 90H138', 0.7);
  },
};

// ---------- the houses, by the one thing you'd know them by
const details: Record<string, (k: Ink) => void> = {
  'Arbel 189': (k) => {
    // the gate between its block pillars, the acacia's fronds hanging over it
    fill(k, rect(32, 30, 16, 60), k.light(PAPER)); bricks(k, 32, 30, 48, 90, 5, 8);
    fill(k, rect(92, 30, 16, 60), k.light(PAPER)); bricks(k, 92, 30, 108, 90, 5, 8);
    fill(k, rect(48, 40, 44, 50), k.dark('#5a5a60'));
    line(k, Array.from({ length: 20 }, (_, i) => `M${50 + i * 2.1} 42v46`).join(''), 0.3, { stroke: PAPER });
    line(k, 'M70 40v50', 0.6);
    fill(k, rect(36, 44, 8, 5), k.light(PAPER), 0.35);
    el('text', { x: 40, y: 47.8, 'font-size': 3.4, 'text-anchor': 'middle', fill: 'currentColor', 'font-family': "'Architects Daughter', cursive" }, k.g).textContent = '189';
    fill(k, cloud(70, 8, 64, 12, 22, 2), k.light(PAPER));
    dots(k, 10, 1, 130, 15, 90, '#3d3d3a', 0.45, 8);
    line(k, Array.from({ length: 16 }, (_, i) => `M${18 + i * 7} 18v${14 + ((i * 7) % 11) * 2.4}`).join(''), 0.35, { 'stroke-dasharray': '1.4 1.3' });
    line(k, 'M10 90H130', 0.8);
  },
  'Meir Shacham 3': (k) => {
    // the green gate in the plumbago hedge, the pole wrapped in yellow flowers beside it
    fill(k, cloud(36, 44, 30, 32, 14, 1), k.light(PAPER));
    fill(k, cloud(104, 48, 30, 28, 14, 2), k.light(PAPER));
    dots(k, 10, 14, 58, 80, 46, '#7f9bd0', 0.9, 4);
    dots(k, 80, 22, 132, 80, 38, '#c9563c', 0.8, 9);
    fill(k, rect(56, 36, 26, 54), k.light('#3f8a52'));
    line(k, 'M56 63h26M59 39h20v21h-20ZM59 66h20v21h-20Z', 0.35);
    fill(k, rect(63, 44, 12, 6), k.light(PAPER), 0.35);
    line(k, 'M78 64v4', 0.8);
    fill(k, rect(52, 4, 4, 86), k.light('#a47c50'), 0.4);
    dots(k, 46, 4, 62, 60, 26, '#e2b53a', 0.9, 6);
    line(k, 'M8 90H132', 0.8);
  },
  'Herzl 34': (k) => {
    // the twin arched windows of the teal tower, the canopy over them
    fill(k, rect(30, 4, 80, 86), k.light('#5e9a9b'));
    for (const x of [42, 74]) {
      fill(k, `M${x} 84V${34}A12 12 0 0 1 ${x + 24} 34V84Z`, k.dark());
      line(k, `M${x + 12} 22V84M${x} 52H${x + 24}`, 0.45, { stroke: PAPER });
      line(k, Array.from({ length: 5 }, (_, i) => `M${x + 2 + i * 5} 60v24`).join(''), 0.3, { stroke: PAPER });
      fill(k, rect(x - 2, 84, 28, 2.5), k.light(PAPER), 0.4);
    }
    line(k, 'M26 6H114', 0.8);
    line(k, 'M0 14Q50 30 140 16', 0.3);
  },
};

const ACCENT: Record<string, string> = { 'Arbel 189': '#8e3b2c', 'Meir Shacham 3': '#2f6e40', 'Herzl 34': '#2f6f71' };
let uid = 0;

/** Draw `name`'s emblem in `style` into `parent`, its 140 x 100 box scaled by `s` and placed at x, y. */
export function emblem(parent: Element, name: string, style: Style, x = 0, y = 0, s = 1): SVGGElement {
  const g = el('g', { transform: `translate(${f(x)} ${f(y)}) scale(${s})` }, parent);
  const colour: Ink = { g, light: (c) => c, dark: (c = DARK) => c, mono: false };
  if (style === 'sketch') sketches[name]?.(colour);
  else if (style === 'detail') details[name]?.(colour);
  else {
    // a rubber stamp: ring, the name round the top, the house cut in one colour inside
    g.setAttribute('style', `color:${ACCENT[name] ?? '#333'}`);
    const id = `em${++uid}`, cx = 70, cy = 50;
    const clip = el('clipPath', { id: `${id}c` }, el('defs', {}, g));
    el('circle', { cx, cy: cy + 3, r: 33 }, clip);
    el('path', { d: `M${cx - 38.5} ${cy}A38.5 38.5 0 0 1 ${cx + 38.5} ${cy}`, id: `${id}a`, fill: 'none' }, g);
    for (const [r, w] of [[48, 1.2], [46, 0.4], [35, 0.6]] as const) el('circle', { cx, cy, r, fill: 'none', stroke: 'currentColor', 'stroke-width': w }, g);
    const t = el('text', { 'font-size': 7.5, fill: 'currentColor', 'font-family': "'Architects Daughter', cursive", 'letter-spacing': 0.8 }, g);
    const tp = el('textPath', { href: `#${id}a`, startOffset: '50%', 'text-anchor': 'middle' }, t);
    tp.textContent = name;
    for (const sx of [cx - 40, cx + 40]) el('circle', { cx: sx, cy: cy + 8, r: 1.2, fill: 'currentColor' }, g);
    const inner = el('g', { 'clip-path': `url(#${id}c)` }, g);
    const k: Ink = { g: el('g', { transform: `translate(${cx - 70 * 0.6} ${cy - 50 * 0.6 + 4}) scale(0.6)` }, inner), light: () => PAPER, dark: () => 'currentColor', mono: true };
    sketches[name]?.(k);
  }
  return g;
}
