// The house behind the trees, drawn from street photos: the neighbour's red railing
// and steps, a terrace with a parasol and a hammock, an outdoor staircase, the white
// two-storey house with a roller-shuttered window, an acacia with hanging fronds, a
// bushy tree over the gate pillar, an ivy hedge on a block wall, the gate, a banana
// plant over a slatted screen. Everything is in lot coordinates (0..WIDTH) and placed
// at x0 on the street, so the lot can sit anywhere among other houses.
import { el, pen, blot, paint, limb, f, type Vec } from '../lib/ink.ts';
import { spring, pendulum, clamp, wobble } from '../lib/motion.ts';
import { mix, rgb } from '../lib/daynight.ts';
import { type Ctx, type Clump, type Strand, type Win, type LayerName, type Lot, type LotDef, C, GLASS, WARM, SP, P, S, at, box, blocks, clump, fillPath, leaf, strand, tint, win } from './kit.ts';
import type { Drop } from './falls.ts';

const OX = 320; // the gate-side photo starts here

export const homeLot: LotDef = { name: 'The house behind the trees', width: 1280, build: (ctx, x0, drop) => home(ctx, x0, drop) };

function home(ctx: Ctx, x0: number, drop: Drop): Lot {
  const lay = (name: LayerName, dx = 0) => at(ctx.layers[name], x0 + dx);
  const glowL = at(ctx.glow, x0), glowR = at(ctx.glow, x0 + OX);
  const acacia: Clump[] = [], bushy: Clump[] = [];

  // ---------- back: acacia crown, neighbour's house, bushes
  const back = lay('back');
  for (const [x, y, r] of [[30, 20, 60], [130, -5, 60], [240, 10, 55], [350, -10, 60], [460, 20, 60], [570, -5, 55], [650, 28, 40]])
    acacia.push(clump(ctx, back, x, y, r, 'frond', r * 2.4));
  S(back, 'M-4 176 Q90 190 196 214 L196 360 L-4 360Z');
  P(back, 'M-6 168 Q92 184 204 208', SP * 1.5);
  P(back, 'M-6 173 Q92 189 202 213', SP * 0.5);
  win(ctx, back, glowL, 46, 238, 26, 30, 0.62);
  S(back, 'M40 230 L78 230 L86 244 L32 244Z', SP * 0.8);
  P(back, 'M50 230 L46 244 M59 230 L59 244 M68 230 L72 244', SP * 0.45);
  win(ctx, back, glowL, 94, 300, 62, 10, 0.5);
  P(back, 'M92 312 L158 312 M98 312 q4 -6 8 0 M114 312 q3 -7 7 0 M134 312 q4 -6 9 0', SP * 0.6);
  for (const [x, y, r] of [[118, 290, 40], [176, 268, 46], [236, 258, 40]]) clump(ctx, back, x, y, r, 'leaf', r * 3.5, C.IVY, 0.25);

  // ---------- low wing with an outdoor staircase up to the upper floor's back yard (no windows, no light)
  const wing = lay('house');
  S(wing, box(300, 238, 220, 120, 0.5));
  P(wing, 'M296 238 Q410 235 524 237', SP * 1.1);
  S(wing, box(452, 224, 26, 14, 0.2), SP * 0.7);
  P(wing, 'M456 228 l18 0 M456 231 l18 0 M456 234 l18 0', SP * 0.4);
  const steps: string[] = ['M318 344'];
  for (let i = 0; i < 10; i++) steps.push('l0 -10 l19 0');
  S(wing, steps.join(' ') + ' L508 262 L330 356Z', SP * 0.8);
  P(wing, 'M322 352 L506 260', SP * 0.5);
  const posts: string[] = ['M318 314 Q414 264 510 214'];
  for (let i = 0; i <= 10; i += 2) posts.push(`M${318 + i * 19} ${f(344 - i * 10)} l0 -30`);
  P(wing, posts.join(' '), SP * 0.7);

  // ---------- the house
  const house = lay('house', OX);
  S(house, 'M196 76 Q330 74 472 74 L472 262 L198 262Z');
  P(house, 'M192 74 Q332 71 476 72 M194 79 Q332 77 474 77');
  const shade: string[] = [];
  for (const [x, y] of [[210, 96], [300, 92], [262, 186], [214, 206], [318, 196], [340, 140]]) for (let i = 0; i < 5; i++) shade.push(`M${x + i * 2.6} ${y} l-5 9`);
  P(house, shade.join(' '), SP * 0.35).setAttribute('opacity', '0.6');
  const shuttered = win(ctx, house, glowR, 240, 121, 23, 45, 0.55);
  win(ctx, house, glowR, 292, 121, 24, 45, 0.4);
  const roll = shutter(ctx, house, shuttered);
  P(house, box(238, 116, 27, 5), SP * 0.7);
  P(house, box(290, 116, 28, 5), SP * 0.7);
  win(ctx, house, glowR, 240, 220, 23, 34, 0.5);
  win(ctx, house, glowR, 292, 220, 24, 34, 0.46);
  const hit = el('path', { d: box(228, 106, 47, 72), fill: 'transparent', style: 'cursor:pointer' }, house);
  el('title', {}, hit).textContent = 'Roller shutter';
  hit.addEventListener('pointerdown', roll);

  // ---------- acacia: trunks, low crown, hanging fronds
  const ac = lay('acacia');
  for (const [x, y, r] of [[300, 92, 45], [400, 72, 40], [40, 110, 45]]) acacia.push(clump(ctx, ac, x, y, r, 'frond', r * 2.4));
  for (const [w, j] of [
    [13, [[504, 262], [496, 170], [470, 60]]], [7, [[496, 190], [450, 120], [390, 60]]], [5, [[480, 90], [520, 40], [580, 10]]],
    [9, [[546, 262], [548, 180], [566, 70]]], [4, [[556, 110], [600, 80], [650, 60]]],
  ] as [number, Vec[]][]) limb(ac, w, SP).draw(j, [0, 0]);
  P(ac, 'M498 210 q3 -4 1 -9 M492 150 q-2 -5 2 -10 M547 220 q2 -5 0 -9', SP * 0.45);
  for (const [x, y, r] of [[470, 150, 34], [382, 160, 38]]) acacia.push(clump(ctx, ac, x, y, r, 'frond', r * 2.4));
  const fronds: Strand[] = [30, 62, 96, 128, 160, 196, 230, 250, 274, 300, 322, 346, 372, 398, 424, 446, 474, 520, 604, 640, 672].map((x, i) => {
    const len = ctx.rand(60, 150);
    return strand(ctx, ac, x, 50 + (i % 3) * 22, len, false);
  });
  ac.style.cursor = 'pointer';

  terrace(ctx, lay('terrace'));

  // ---------- bushy tree over the gate
  const bt = lay('bigTree', OX);
  for (const [x, y, r] of [[420, 60, 70], [540, 30, 80], [660, 50, 75], [760, 80, 55], [380, 160, 60], [480, 140, 75], [600, 130, 80], [720, 170, 65], [430, 240, 55], [540, 230, 70], [650, 240, 65], [740, 262, 45]])
    bushy.push(clump(ctx, bt, x, y, r, 'leaf', r * 4.2, C.RUST, 0.22));
  bt.style.cursor = 'pointer';

  bananaCorner(ctx, lay('right', OX));
  const hedge = ivyHedge(ctx, lay('hedge', OX));
  walls(ctx, lay('wall'), lay('wall', OX));

  // ---------- front: low branches, tree over the pillar, ivy tendrils
  const fr = lay('front');
  for (const [x, y, r] of [[336, 300, 32], [362, 252, 30]]) acacia.push(clump(ctx, fr, x, y, r, 'frond', r * 2.4));
  bushy.push(clump(ctx, lay('front', OX), 552, 262, 36, 'leaf', 140, C.RUST, 0.22));
  const frontR = lay('front', OX);
  const tendrils = [110, 150, 205, 238, 300, 345, 392, 440, 470, 505].map((x) => strand(ctx, frontR, x, 344, ctx.rand(14, 34), true));

  // ---------- clicks: trees drop leaves, the ivy rustles
  bt.addEventListener('pointerdown', (e) => { bushy.forEach((c) => c.shake()); drop(e, 9, [C.RUST, C.IVY, C.IVY]); });
  ac.addEventListener('pointerdown', (e) => { acacia.forEach((c) => c.shake()); fronds.forEach((s) => s.kick(Math.random() * 2 - 0.6)); drop(e, 7, [C.FROND]); });
  hedge.addEventListener('pointerdown', () => tendrils.forEach((s) => s.kick(Math.random() * 3 - 1.5)));

  return { sniffAt: x0 + OX + 650 };
}

/** Roller shutter over a window; it starts almost closed and dims the window's glow. Returns the toggle. */
function shutter(ctx: Ctx, house: Element, w: Win): () => void {
  const g = el('g', {}, house);
  house.insertBefore(g, w.pane.nextSibling);
  const body = fillPath(g, '', SP * 0.5), slats = pen(g, SP * 0.4);
  let shut = 0.92, aim = 0.92;
  ctx.add({
    step({ dt }) {
      shut += (aim - shut) * Math.min(1, dt * 1.8);
      const h = 45 * shut, d: string[] = [];
      body.setAttribute('d', box(240, 121, 23, h, 0.2));
      for (let y = 121 + 2.4; y < 121 + h - 0.5; y += 2.4) d.push(`M240 ${f(y)} L263 ${f(y)}`);
      slats.setAttribute('d', d.join(' '));
      w.setCover(shut * 0.8);
    },
    paint: (pal) => body.setAttribute('fill', rgb(mix(pal.paper, WARM, w.lit * 0.22))),
  });
  return () => { aim = aim > 0.5 ? 0.04 : 0.96; };
}

/** Terrace: parasol, a hammock that swings in the wind (click to push it), two chairs, railing. */
function terrace(ctx: Ctx, tr: Element): void {
  P(tr, 'M268 236 L268 344', SP * 0.9);
  tint(ctx, paint(tr, C.GREY, SP * 0.8), C.GREY).setAttribute('d', 'M226 290 Q248 262 268 234 Q288 262 310 290 Q268 284 226 290Z');
  P(tr, 'M268 234 L246 288 M268 234 L290 288', SP * 0.5);
  P(tr, 'M226 290 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 12 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 12 0', SP * 0.5);
  const g = el('g', { style: 'cursor:pointer' }, tr);
  const ropes = pen(g, SP * 0.4);
  const bed = el('path', { fill: ctx.stripes, stroke: 'currentColor', 'stroke-width': SP * 0.7, 'stroke-linejoin': 'round' }, g);
  el('title', {}, g).textContent = 'Hammock';
  const swing = pendulum(3.2, 0.35);
  g.addEventListener('pointerdown', () => swing.kick(1.6));
  blot(tr).setAttribute('d', 'M306 314 l2 0 l0 16 l10 0 l0 14 l-2 0 l0 -10 l-8 0 l0 10 l-2 0Z M320 316 l2 0 l0 14 l9 0 l0 14 l-2 0 l0 -10 l-7 0 l0 10 l-2 0Z');
  const rail: string[] = [];
  for (let x = 192; x <= 330; x += 6.5) rail.push(`M${f(x)} 290 L${f(x)} 344`);
  P(tr, rail.join(' '), SP * 0.8);
  P(tr, 'M188 288 Q260 287 334 288 M190 286 L190 344 M262 287 L262 344 M332 287 L332 344', SP * 1.5);
  ctx.add({
    step({ dt, wind }) {
      const a = swing.step(wind * 0.12, dt), A: Vec = [198, 293], B: Vec = [312, 295];
      const e1: Vec = [216 + a * 5, 306 - Math.abs(a) * 2], e2: Vec = [296 + a * 5, 308 - Math.abs(a) * 2], m: Vec = [256 + a * 14, 330 - Math.abs(a) * 6];
      ropes.setAttribute('d', [0, 2.5, 5].map((o) => `M${f(A[0])} ${f(A[1])} L${f(e1[0])} ${f(e1[1] + o)} M${f(B[0])} ${f(B[1])} L${f(e2[0])} ${f(e2[1] + o)}`).join(' '));
      bed.setAttribute('d', `M${f(e1[0])} ${f(e1[1])} Q${f(m[0])} ${f(m[1])} ${f(e2[0])} ${f(e2[1])} L${f(e2[0])} ${f(e2[1] + 5)} Q${f(m[0])} ${f(m[1] + 9)} ${f(e1[0])} ${f(e1[1] + 5)}Z`);
    },
  });
}

/** Right corner: a slatted screen, banana leaves on pendulums (click to rock them), boards on a block band. */
function bananaCorner(ctx: Ctx, rt: Element): void {
  S(rt, 'M770 150 L860 140 L860 286 L776 286Z', SP * 0.6);
  P(rt, Array.from({ length: 40 }, (_, i) => `M${f(772 + i * 2.2)} ${f(146 - i * 0.1)} l0 ${f(138 + i * 0.1)}`).join(' '), SP * 0.4);
  for (const [x, y, ang, len] of [[905, 178, -150, 105], [892, 182, -122, 92], [918, 176, -96, 110], [918, 180, -66, 80], [880, 186, -172, 80]]) {
    const g = el('g', { style: 'cursor:pointer' }, rt), w = len * 0.17;
    S(g, `M0 0 C${f(len * 0.25)} ${f(-w)} ${f(len * 0.8)} ${f(-w * 1.1)} ${len} 0 C${f(len * 0.8)} ${f(w)} ${f(len * 0.25)} ${f(w * 0.9)} 0 0Z`, SP * 0.8);
    const veins: string[] = [`M0 0 Q${f(len / 2)} -1 ${len} 0`];
    for (let i = 1; i <= 9; i++) { const vx = (len * i) / 10, e = w * 0.8 * Math.sin((Math.PI * i) / 10); veins.push(`M${f(vx)} -0.5 l2.5 ${f(-e)} M${f(vx)} 0.5 l2.5 ${f(e)}`); }
    P(g, veins.join(' '), SP * 0.4);
    const p = pendulum(6, 1.0);
    g.addEventListener('pointerdown', () => p.kick((Math.random() - 0.5) * 3));
    ctx.add({ step: ({ t, dt, wind }) => g.setAttribute('transform', `translate(${x} ${y}) rotate(${f(ang + p.step(wind * 0.4 * (len / 100) + wobble(t * 0.7 + x) * 0.08, dt) * 57.3 * 0.6)})`) });
  }
  S(rt, 'M846 150 Q902 146 958 148 L958 236 L846 236Z');
  P(rt, Array.from({ length: 17 }, (_, i) => `M${f(852.5 + i * 6.5)} ${f(149 + ctx.rand(-0.6, 0.6))} L${f(852.5 + i * 6.5 + ctx.rand(-0.4, 0.4))} 236`).join(' '), SP * 0.45);
  S(rt, box(846, 236, 112, 44));
  blocks(rt, 846, 958, 236, 280, 22, 34);
}

/** Ivy hedge with the black railing showing through. Returns the hedge group (click target). */
function ivyHedge(ctx: Ctx, hd: SVGGElement): SVGGElement {
  const topY = (x: number) => 226 + 7 * Math.abs(Math.sin(x * 0.07)) + 4 * Math.sin(x * 0.013);
  const top: string[] = [];
  for (let x = 70; x <= 534; x += 3) top.push(`${x} ${f(topY(x))}`);
  S(hd, `M70 346 L${top.join(' L')} L534 346Z`, SP * 0.8);
  const leaves = (n: number, y0: (x: number) => number, y1: number) => {
    const plain: string[] = [], acc: string[] = [];
    for (let i = 0; i < n; i++) { const x = ctx.rand(76, 528), y = ctx.rand(y0(x) + 4, y1); (ctx.rand() < 0.45 ? acc : plain).push(leaf(x, y, ctx.rand(3.5, 5.2), ctx.rand(0.4, 2.7), 0.5)); }
    P(hd, plain.join(' '), SP * 0.45);
    tint(ctx, paint(hd, C.IVY, SP * 0.4), C.IVY).setAttribute('d', acc.join(' '));
  };
  leaves(1500, topY, 342);
  const bars: string[] = [];
  for (let x = 258; x <= 526; x += 6) bars.push(`M${x} 321 L${x} 346`);
  P(hd, bars.join(' '), SP * 1.4);
  blot(hd).setAttribute('d', box(254, 318, 274, 3, 0.2));
  leaves(220, () => 306, 346);
  hd.style.cursor = 'pointer';
  return hd;
}

/** Neighbour's wall and red railing, the steps, our block wall, the pillar with the intercom, the gate, the right pillar. */
function walls(ctx: Ctx, wl: Element, ws: Element): void {
  const dark: SVGPathElement[] = [];
  ctx.add({ paint: (pal) => dark.forEach((n) => n.setAttribute('fill', rgb(mix(pal.paper, GLASS, 0.62)))) });

  // neighbour: low wall with a red railing and a name plate
  S(wl, box(-4, 360, 146, 44));
  blocks(wl, -4, 142, 360, 404, 15, 32);
  const redRail: string[] = ['M-4 318 Q68 317 140 318'];
  for (let x = 6; x < 140; x += 14) redRail.push(`M${x} 318 L${x} 360`);
  tint(ctx, el('path', { d: redRail.join(' '), fill: 'none', stroke: C.RED, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, wl), C.RED, 'stroke');
  tint(ctx, el('path', { d: 'M140 314 L140 362', fill: 'none', stroke: C.RED, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, wl), C.RED, 'stroke');
  S(wl, box(44, 326, 30, 9), SP * 0.6);
  P(wl, 'M48 330 q2 -2 4 0 t4 0 t4 0 M60 332 l10 0', SP * 0.4);

  // steps up between the two walls, dark beyond
  dark.push(fillPath(wl, box(148, 340, 40, 64)));
  for (const [x, y, w] of [[148, 396, 40], [152, 388, 36], [156, 380, 32], [160, 372, 28]]) S(wl, box(x, y, w, 8, 0.2), SP * 0.6);
  S(wl, box(140, 340, 10, 64));

  // one continuous wall from the steps to the pillar, with the house number
  S(ws, box(-134, 344, 666, 60));
  blocks(ws, -134, 532, 344, 404, 15, 34);
  tint(ctx, paint(ws, C.NUMBER, SP * 0.4), C.NUMBER).setAttribute('d', box(-114, 352, 8, 9, 0.2));
  S(ws, box(530, 278, 92, 126));
  blocks(ws, 530, 622, 278, 404, 18, 30);
  el('path', { d: box(577, 288, 22, 40, 0.2), fill: 'url(#h-mesh)', stroke: 'currentColor', 'stroke-width': SP * 0.9 }, ws);
  P(ws, 'M578.5 289.5 L578.5 326.5 L597.5 326.5', SP * 0.4);
  S(ws, box(585, 307, 9, 11, 0.1), SP * 0.6);
  P(ws, 'M587 310 l5 0 M587 312 l5 0', SP * 0.35);

  // the gate, left to right: a fixed perforated panel; one leaf (a perforated third,
  // then bars) latched on its left edge and hinged on the post; a narrow barred panel.
  // Silver tubes, dark garden path behind. Click the leaf to open it.
  dark.push(fillPath(ws, box(622, 282, 171, 122)));
  P(ws, 'M700 404 Q712 360 704 300 M772 404 Q760 350 778 300 M740 330 q-6 -12 2 -20 q8 10 -2 20', SP * 0.5).setAttribute('opacity', '0.35');
  const tube = (g: Element, a: Vec, b: Vec, w = 1.9) => limb(g, w, SP * 0.55).draw([a, b], [0, 0]);
  el('path', { d: box(623, 288, 34, 110, 0.2), fill: 'url(#h-mesh)' }, ws);
  tube(ws, [622.5, 287], [657.5, 287]); tube(ws, [622.5, 287], [622.5, 399]); tube(ws, [657.5, 287], [657.5, 399]); tube(ws, [622.5, 398.5], [657.5, 398.5]);
  for (let x = 766; x < 792; x += 7.6) tube(ws, [x, 286], [x, 398], 1.5);
  tube(ws, [757.5, 284], [795, 284]); tube(ws, [759, 397.5], [793, 397.5]); tube(ws, [758.5, 283], [758.5, 401], 2.2);
  const leafG = el('g', { style: 'cursor:pointer' }, ws);
  el('title', {}, leafG).textContent = 'Gate';
  el('path', { d: box(660, 286, 96, 114), fill: 'transparent' }, leafG);
  el('path', { d: box(662, 287, 30, 111, 0.2), fill: 'url(#h-mesh)' }, leafG);
  for (let x = 700; x < 754; x += 7.6) tube(leafG, [x, 286], [x, 398], 1.5);
  tube(leafG, [660.5, 285], [756, 285]); tube(leafG, [660.5, 398.5], [756, 398.5]);
  tube(leafG, [660.5, 285], [660.5, 399]); tube(leafG, [692.5, 285], [692.5, 399]);
  blot(leafG).setAttribute('d', 'M657.6 336 l2.2 0 l0 8 l-2.2 0Z M659.6 338 l6.4 -0.6 l0 1.4 l-6.4 0.6Z');
  tube(leafG, [749, 380], [749, 404], 1.3);
  const hinge = 757, swing = spring(22, 6);
  let open = 0, openFor = 0;
  leafG.addEventListener('pointerdown', () => { open = open ? 0 : 1; openFor = 0; });
  ctx.add({
    step({ dt }) {
      openFor += dt;
      if (open && openFor > 6) open = 0;
      const ang = clamp(swing.step(open * 68, dt), -4, 85);
      leafG.setAttribute('transform', `translate(${hinge} 0) scale(${f(Math.cos((ang * Math.PI) / 180))} 1) translate(${-hinge} 0)`);
    },
  });

  S(ws, box(793, 280, 164, 124));
  blocks(ws, 793, 957, 280, 404, 18, 34);
  blot(ws).setAttribute('d', box(826, 322, 4, 4, 0.1));
  S(ws, box(896, 286, 26, 11), SP * 0.6);
  P(ws, 'M900 291 q2 -2 4 0 t4 0 t4 0 t4 0', SP * 0.4);
}
