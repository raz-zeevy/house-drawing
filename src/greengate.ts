// The house with the green gate, drawn from street photos: an old Jerusalem-stone house
// with a lattice-railed roof terrace and a tiled roof, an enclosed balcony of small
// panes over a balcony slab, a barred window; in front, a tall hedge of blue plumbago
// and red blossom over a stepped stone wall, a green pedestrian gate by a wooden pole
// wrapped in a yellow-flowering climber, a green driveway gate, and on the pavement an
// electrical cabinet, metal barriers and a red-and-white kerb.
import { el, pen, paint, limb, hang, f, type Vec } from '../lib/ink.ts';
import { seeded, spring, wobble, clamp } from '../lib/motion.ts';
import type { Drop } from './falls.ts';
import { type Ctx, type Clump, type LotDef, C, H, SP, P, S, at, box, blocks, clump, leaf, surface, tint, win } from './kit.ts';

// The drawing spans 0..1104; the lot is one desktop card wide (1280) so a card never shows two houses,
// with the walls carried on through the PAD on each side.
const WIDTH = 1280, PAD = 88, L = -PAD, R1 = WIDTH - PAD;
const K = {
  STONE: '#ece1c8', ROOF: '#8b6f60', GREEN: '#3f8a52', WOOD: '#a47c50', BLUE: '#9db3db', BLOSSOM: '#c9563c',
  YELLOW: '#e2b53a', PLATE: '#3d5a8c', CABINET: '#c7c9c4', SIGN: '#2f62b0',
} as const;

export const greenGateLot: LotDef = {
  name: 'The house with the green gate',
  width: WIDTH,
  build: (ctx, x0, drop) => build({ ...ctx, rand: seeded(303) }, x0, drop),
};

function build(ctx: Ctx, x0: number, drop: Drop): { sniffAt: number } {
  const R = ctx.rand, lay = (name: keyof Ctx['layers']) => at(ctx.layers[name], x0 + PAD), glowG = at(ctx.glow, x0 + PAD);
  const tube = (g: Element, pts: Vec[], w: number, colour: string) => {
    const l = limb(g, w, SP * 0.55);
    l.draw(pts, [0, 0]);
    surface(ctx, l.g.querySelector('path')!, colour);
  };

  // ---------- behind: a bare tree on the left, a big leafy tree on the right
  const back = lay('back');
  const twigs: string[] = [];
  const branch = (p: Vec, ang: number, len: number, depth: number): void => {
    const end = hang(p, len, ang);
    twigs.push(`M${f(p[0])} ${f(p[1])} Q${f((p[0] + end[0]) / 2 + R(-4, 4))} ${f((p[1] + end[1]) / 2)} ${f(end[0])} ${f(end[1])}`);
    if (depth > 0) for (const turn of [-1, 1]) branch(end, ang + turn * R(18, 34), len * R(0.62, 0.78), depth - 1);
  };
  limb(back, 9, SP).draw([[70, 344], [66, 230], [84, 140]], [0, 0]);
  branch([84, 140], 175, 60, 5);
  branch([68, 220], 205, 46, 4);
  P(back, twigs.join(' '), SP * 0.5);
  const leafy: Clump[] = [];
  limb(back, 12, SP).draw([[880, 344], [872, 230], [890, 130]], [0, 0]);
  for (const [x, y, r] of [[800, 70, 60], [900, 30, 70], [1010, 60, 62], [760, 160, 52], [860, 140, 70], [980, 150, 66], [1060, 190, 48], [920, 230, 55]])
    leafy.push(clump(ctx, back, x, y, r, 'leaf', r * 3.6, C.IVY, 0.2));
  back.style.cursor = 'pointer';
  back.addEventListener('pointerdown', (e) => { leafy.forEach((c) => c.shake()); drop(e, 8, [C.IVY, C.FROND]); });

  // ---------- the house
  const house = lay('house');
  S(house, 'M440 100 Q520 60 604 20 Q700 60 792 100Z', SP * 1.1);
  surface(ctx, paint(house, K.ROOF, SP * 0.8), K.ROOF).setAttribute('d', 'M452 98 Q526 62 604 26 Q694 62 780 98Z');
  P(house, Array.from({ length: 9 }, (_, i) => `M${f(462 + i * 36)} 98 L604 26`).join(' '), SP * 0.35);
  surface(ctx, paint(house, K.STONE, SP), K.STONE).setAttribute('d', box(300, 96, 470, 262, 0.6));
  blocks(house, 300, 770, 100, 350, 16, 44);
  // roof terrace with a lattice railing
  const lattice: string[] = ['M300 74 L472 74 M300 74 L300 96 M472 74 L472 96'];
  for (let x = 300; x < 472; x += 12) lattice.push(`M${x} 96 L${x + 12} 76 M${x} 76 L${x + 12} 96`);
  P(house, lattice.join(' '), SP * 0.6);
  S(house, box(294, 94, 482, 7, 0.2), SP * 0.9);
  // enclosed balcony: a row of transoms over a row of tall panes, flower boxes on the sill
  S(house, box(312, 108, 250, 86, 0.3), SP * 1.1);
  const cols = 6, pw = 250 / cols;
  for (let c = 0; c < cols; c++) {
    win(ctx, house, glowG, 314 + c * pw, 110, pw - 4, 14, R(0.4, 0.62), false);
    win(ctx, house, glowG, 314 + c * pw, 127, pw - 4, 60, R(0.4, 0.62), false);
  }
  const mullions: string[] = ['M312 125.5 L562 125.5'];
  for (let c = 0; c <= cols; c++) mullions.push(`M${f(312 + c * pw)} 108 L${f(312 + c * pw)} 194`);
  P(house, mullions.join(' '), SP * 1.6);
  // reflections, so the panes read as glass rather than holes
  const glints: string[] = [];
  for (let c = 0; c < cols; c++) { const gx = 318 + c * pw; glints.push(`M${f(gx + 4)} 150 L${f(gx + 16)} 132 M${f(gx + 8)} 164 L${f(gx + 26)} 138`); }
  el('path', { d: glints.join(' '), fill: 'none', style: 'stroke: var(--paper)', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.55 }, house);
  S(house, box(306, 188, 262, 10, 0.2), SP * 0.8);
  const pots: string[] = [], blooms: string[] = [];
  for (let x = 316; x < 560; x += R(10, 18)) {
    pots.push(leaf(x, 188, R(5, 8), R(3.6, 4.6), 0.45), leaf(x + 3, 188, R(4, 7), R(4.6, 5.6), 0.45));
    if (R() < 0.5) blooms.push(`M${f(x + 2)} ${f(181)} a1.6 1.6 0 1 0 0.1 0Z`);
  }
  P(house, pots.join(' '), SP * 0.5);
  tint(ctx, paint(house, K.BLOSSOM, SP * 0.3), K.BLOSSOM).setAttribute('d', blooms.join(' '));
  S(house, box(296, 198, 290, 12, 0.3), SP * 1.1);
  P(house, 'M300 214 L582 214', SP * 0.4).setAttribute('opacity', '0.6');
  // barred window and a window below the balcony, mostly behind the hedge
  win(ctx, house, glowG, 604, 120, 56, 62, 0.5);
  P(house, Array.from({ length: 7 }, (_, i) => `M${611 + i * 7} 120 L${611 + i * 7} 182`).join(' '), SP * 0.9);
  win(ctx, house, glowG, 330, 228, 44, 46, 0.55);
  win(ctx, house, glowG, 610, 226, 46, 50, 0.48);

  // ---------- the hedge: plumbago on the left, red blossom on the right
  const hd = lay('hedge');
  const topY = (x: number) => (x < 560 ? 196 : 238) + 10 * Math.abs(Math.sin(x * 0.045)) + 6 * Math.sin(x * 0.011) + (x > 520 && x < 600 ? (x - 520) * 0.5 : 0);
  const top: string[] = [];
  for (let x = 240; x <= 990; x += 3) top.push(`${x} ${f(Math.min(topY(x), x < 560 ? 230 : 280))}`);
  S(hd, `M240 352 L${top.join(' L')} L990 340Z`, SP * 0.8);
  const plain: string[] = [], acc: string[] = [], blue: string[] = [], red: string[] = [];
  for (let i = 0; i < 4200; i++) {
    const x = R(244, 986), y = R(topY(x) + 4, 348);
    (R() < 0.62 ? acc : plain).push(leaf(x, y, R(3, 4.6), R(0.4, 2.7), 0.5));
  }
  for (let i = 0; i < 60; i++) { // plumbago clusters: little rings of pale blue florets
    const cx = R(250, 560), cy = R(topY(cx) + 6, 330);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; blue.push(`M${f(cx + Math.cos(a) * 2.6)} ${f(cy + Math.sin(a) * 2.6)} a1.2 1.2 0 1 0 0.1 0Z`); }
  }
  for (let i = 0; i < 46; i++) { const x = R(600, 980), y = R(topY(x) + 4, 300); red.push(`M${f(x)} ${f(y)} a1.8 1.5 0 1 0 0.1 0Z`); }
  P(hd, plain.join(' '), SP * 0.45);
  tint(ctx, paint(hd, C.IVY, SP * 0.4), C.IVY).setAttribute('d', acc.join(' '));
  tint(ctx, paint(hd, K.BLUE, SP * 0.3), K.BLUE).setAttribute('d', blue.join(' '));
  tint(ctx, paint(hd, K.BLOSSOM, SP * 0.3), K.BLOSSOM).setAttribute('d', red.join(' '));
  hd.style.cursor = 'pointer';
  hd.addEventListener('pointerdown', (e) => drop(e, 9, [K.BLUE, C.IVY, K.BLOSSOM]));

  // ---------- walls, the pedestrian gate, the driveway gate
  const wl = lay('wall');
  S(wl, box(L - 2, 350, 198 + PAD, 54));
  blocks(wl, L - 2, 196, 350, 404, 18, 40);
  S(wl, box(236, 352, 326, 52));
  blocks(wl, 236, 562, 352, 404, 17, 42);
  S(wl, box(562, 334, 428, 70));
  blocks(wl, 562, 990, 340, 404, 16, 46);
  S(wl, box(558, 330, 434, 6, 0.2), SP * 0.8);
  tint(ctx, paint(wl, K.PLATE, SP * 0.4), K.PLATE).setAttribute('d', box(246, 360, 8, 9, 0.2));
  P(wl, 'M249 362 q2 -1 2 1 q0 2 -2 2 q2 0 2 2 q0 2 -2 1', SP * 0.35);
  // the pedestrian gate: green frame, mesh above a solid panel, a little sign; click to open
  const dark = el('path', { d: box(196, 300, 40, 104) }, wl);
  ctx.add({ paint: (pal) => dark.setAttribute('fill', `rgb(${pal.paper.map((v) => Math.round(v * 0.5)).join(',')})`) });
  const gate = el('g', { style: 'cursor:pointer' }, wl);
  el('title', {}, gate).textContent = 'Green gate';
  el('path', { d: box(198, 304, 36, 48, 0.2), fill: 'url(#h-mesh)' }, gate);
  surface(ctx, paint(gate, K.GREEN, SP * 0.8), K.GREEN).setAttribute('d', box(198, 352, 36, 50, 0.3));
  for (const pts of [[[197, 302], [235, 302]], [[197, 352], [235, 352]], [[197, 302], [197, 403]], [[235, 302], [235, 403]]] as Vec[][]) tube(gate, pts, 2.4, K.GREEN);
  S(gate, box(203, 316, 22, 13, 0.2), SP * 0.5);
  P(gate, 'M206 320 l16 0 M206 323 l12 0 M206 326 l14 0', SP * 0.3);
  P(gate, 'M206 372 q4 -6 8 0 t8 0 M208 380 q5 -4 10 2', SP * 0.4).setAttribute('opacity', '0.5');
  const swing = spring(22, 6);
  let open = 0, openFor = 0;
  gate.addEventListener('pointerdown', () => { open = open ? 0 : 1; openFor = 0; });
  ctx.add({
    step({ dt }) {
      openFor += dt;
      if (open && openFor > 6) open = 0;
      const ang = clamp(swing.step(open * 70, dt), -4, 85);
      gate.setAttribute('transform', `translate(197 0) scale(${f(Math.cos((ang * Math.PI) / 180))} 1) translate(-197 0)`);
    },
  });
  // driveway gate: two green leaves of frame and bars, a no-parking sign beside it
  const drive = el('path', { d: box(990, 296, 92, 108) }, wl);
  ctx.add({ paint: (pal) => drive.setAttribute('fill', `rgb(${pal.paper.map((v) => Math.round(v * 0.62)).join(',')})`) });
  for (const pts of [[[990, 298], [1082, 298]], [[990, 340], [1082, 340]], [[990, 400], [1082, 400]], [[991, 298], [991, 404]], [[1036, 298], [1036, 404]], [[1081, 298], [1081, 404]]] as Vec[][]) tube(wl, pts, 2.6, K.GREEN);
  for (let x = 998; x < 1080; x += 7.6) if (Math.abs(x - 1036) > 3) tube(wl, [[x, 300], [x, 398]], 1.3, K.GREEN);
  S(wl, box(1082, 226, 22, 178, 0.3));
  S(wl, box(1104, 344, R1 - 1102, 60));
  blocks(wl, 1104, R1 + 2, 344, 404, 15, 40);
  tint(ctx, paint(wl, K.SIGN, SP * 0.5), K.SIGN).setAttribute('d', 'M955 352 a10 10 0 1 0 0.1 0Z');
  tint(ctx, el('path', { d: 'M955 352 a10 10 0 1 0 0.1 0Z M948 355 L962 369', fill: 'none', stroke: K.BLOSSOM, 'stroke-width': 2.2 }, wl), K.BLOSSOM, 'stroke');
  // red-and-white kerb along the lot (seen on zoomed-out phones)
  const kerb: string[] = [];
  for (let x = L; x < R1; x += 60) kerb.push(box(x, H, 30, 6, 0.1));
  tint(ctx, paint(wl, K.BLOSSOM, SP * 0.4), K.BLOSSOM).setAttribute('d', kerb.join(' '));

  // ---------- in front: the pole with its yellow climber and wires, the electrical cabinet
  const fr = lay('front');
  tube(fr, [[150, 404], [148, 160], [146, -80]], 7, K.WOOD);
  const climber: Clump[] = [];
  for (let y = 40; y <= 300; y += 44) {
    const c = clump(ctx, fr, 150 + R(-14, 14), y, R(26, 38), 'ivy', 90, C.IVY, 0.35);
    const petals: string[] = [];
    for (let i = 0; i < 14; i++) {
      const fx = 150 + R(-34, 34), fy = y + R(-24, 24);
      for (let k = 0; k < 4; k++) petals.push(leaf(fx, fy, 3.2, (k * Math.PI) / 2 + 0.4, 0.55));
    }
    tint(ctx, paint(c.g, K.YELLOW, SP * 0.3), K.YELLOW).setAttribute('d', petals.join(' '));
    climber.push(c);
  }
  fr.style.cursor = 'pointer';
  const wires = [pen(fr, SP * 0.7), pen(fr, SP * 0.7), pen(fr, SP * 0.6)];
  ctx.add({
    step({ t, wind }) {
      const sag = (base: number, k: number) => base + wind * 4 * k + wobble(t * 0.6 + k * 3) * 1.6;
      wires[0].setAttribute('d', `M${L - 4} ${f(-30)} Q30 ${f(sag(-6, 1))} 148 -60`);
      wires[1].setAttribute('d', `M148 -54 Q620 ${f(sag(40, 1.4))} ${R1 + 4} 0`);
      wires[2].setAttribute('d', `M148 -44 Q620 ${f(sag(58, 1.2))} ${R1 + 4} 14`);
    },
  });
  surface(ctx, paint(fr, K.CABINET, SP), K.CABINET).setAttribute('d', box(26, 360, 104, 58, 0.4));
  P(fr, 'M78 362 L78 416 M32 368 l40 0', SP * 0.5);
  S(fr, box(88, 370, 18, 12, 0.1), SP * 0.4);
  S(fr, box(108, 372, 14, 10, 0.1), SP * 0.4);
  P(fr, 'M40 384 q6 -8 10 0 t10 -2 M44 396 l6 -6 l4 8 l6 -6', SP * 0.4).setAttribute('opacity', '0.45');
  fr.addEventListener('pointerdown', (e) => { climber.forEach((c) => c.shake()); drop(e, 8, [K.YELLOW, K.YELLOW, C.IVY]); });

  // ---------- on the pavement, in front of whoever walks by: metal barriers
  const fall = lay('fall');
  for (const x of [300, 420, 760]) {
    const d = `M${x} 440 L${x} 404 Q${x} 396 ${x + 8} 396 L${x + 62} 396 Q${x + 70} 396 ${x + 70} 404 L${x + 70} 440 M${x + 2} 436 L${x + 68} 406 M${x + 2} 406 L${x + 68} 436`;
    el('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, fall);
    el('path', { d, fill: 'none', style: 'stroke: var(--paper)', 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, fall);
  }

  return { sniffAt: x0 + PAD + 150 };
}
