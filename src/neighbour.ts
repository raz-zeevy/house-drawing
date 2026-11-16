// Stand-in houses for trying out a street of several houses before the real ones are
// drawn from photos: a seeded variation on a plastered house behind a block wall, with
// one or two trees, lit windows, shutters and a gate in the house's accent colour.
import { el, limb, paint, f, type Vec } from '../lib/ink.ts';
import { seeded } from '../lib/motion.ts';
import type { Drop } from './falls.ts';
import { type Ctx, type LotDef, type Clump, C, SP, P, S, at, box, blocks, clump, fillPath, strand, tint, win } from './kit.ts';
import { ALFEI_MENASHE } from './places.ts';

const ACCENTS = ['#5d6f8a', '#7a8c5a', '#b0763c', '#8e3b2c'];

/** A stand-in neighbour of the Alfei Menashe house. */
export function neighbourLot(seed: number, name: string): LotDef {
  const r = seeded(seed * 7919 + 13), width = Math.round(r(720, 980));
  return { name, width, place: ALFEI_MENASHE, build: (ctx, x0, drop) => build({ ...ctx, rand: seeded(seed * 31 + 5) }, x0, width, drop) };
}

function build(ctx: Ctx, x0: number, width: number, drop: Drop): { sniffAt: number } {
  const R = ctx.rand, lay = (name: keyof Ctx['layers']) => at(ctx.layers[name], x0);
  const accent = ACCENTS[Math.floor(R(0, ACCENTS.length))];
  const storeys = Math.floor(R(1, 3.99)), pitched = R() < 0.5;
  const fx0 = Math.round(R(90, 180)), fx1 = width - Math.round(R(90, 180)), floorH = 78, top = 344 - storeys * floorH - 14;

  // ---------- trees behind and beside the house
  const trees: Clump[] = [];
  const tree = (g: Element, x: number, h: number, kind: 'leaf' | 'frond') => {
    limb(g, R(7, 11), SP).draw([[x, 344], [x + R(-8, 8), 344 - h * 0.5], [x + R(-20, 20), 344 - h]] as Vec[], [0, 0]);
    for (let i = 0; i < 5; i++) trees.push(clump(ctx, g, x + R(-60, 60), 344 - h - R(-30, 40), R(36, 58), kind, 110, kind === 'leaf' ? C.RUST : undefined, 0.15));
  };
  const back = lay('back');
  tree(back, R(fx0, fx1), R(200, 260), R() < 0.5 ? 'leaf' : 'frond');

  // ---------- the house
  const house = lay('house'), glowG = at(ctx.glow, x0);
  S(house, box(fx0, top, fx1 - fx0, 344 - top + 10, 0.6));
  if (pitched) {
    S(house, `M${fx0 - 16} ${top + 2} L${(fx0 + fx1) / 2} ${top - 70} L${fx1 + 16} ${top + 2}Z`, SP * 1.1);
    const tiles: string[] = [];
    for (let i = 1; i < 8; i++) tiles.push(`M${f(fx0 - 16 + (i * (fx1 - fx0 + 32)) / 8)} ${top + 2} L${(fx0 + fx1) / 2} ${top - 70}`);
    P(house, tiles.join(' '), SP * 0.35);
  } else P(house, `M${fx0 - 4} ${top} Q${(fx0 + fx1) / 2} ${top - 3} ${fx1 + 4} ${top} M${fx0 - 2} ${top + 5} L${fx1 + 2} ${top + 5}`, SP * 1.1);
  const cols = Math.max(2, Math.floor((fx1 - fx0 - 40) / 72));
  for (let s = 0; s < storeys; s++) for (let c = 0; c < cols; c++) {
    const wx = fx0 + 28 + (c * (fx1 - fx0 - 56 - 26)) / (cols - 1), wy = 344 - (s + 1) * floorH + 18;
    if (s === 0 && c === Math.floor(cols / 2)) continue; // the door goes here
    win(ctx, house, glowG, wx, wy, 26, 40, R(0.35, 0.65));
    if (R() < 0.4) { // a half-drawn shutter in the accent colour
      tint(ctx, paint(house, accent, SP * 0.5), accent).setAttribute('d', box(wx, wy, 26, R(10, 30), 0.2));
    }
  }
  const dx = fx0 + 28 + (Math.floor(cols / 2) * (fx1 - fx0 - 56 - 26)) / (cols - 1);
  tint(ctx, paint(house, accent, SP), accent).setAttribute('d', box(dx - 2, 344 - 66, 30, 66, 0.3));
  P(house, `M${dx + 21} ${344 - 34} l0 4`, SP * 1.4);

  // ---------- low wall with a gate, a front tree, ivy over the wall
  const wall = lay('wall');
  const gx = dx - 12;
  S(wall, box(-2, 344, gx + 2, 60));
  blocks(wall, -2, gx, 344, 404, 15, 32);
  S(wall, box(gx + 54, 344, width - gx - 52, 60));
  blocks(wall, gx + 54, width, 344, 404, 15, 32);
  const dark = fillPath(wall, box(gx, 350, 54, 54));
  ctx.add({ paint: (pal) => dark.setAttribute('fill', `rgb(${pal.paper.map((v) => Math.round(v * 0.55)).join(',')})`) });
  const bars: string[] = [];
  for (let x = gx + 4; x < gx + 52; x += 6) bars.push(`M${x} 352 L${x} 402`);
  tint(ctx, el('path', { d: bars.join(' ') + ` M${gx} 352 L${gx + 54} 352`, fill: 'none', stroke: accent, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, wall), accent, 'stroke');
  const front = lay('front');
  if (R() < 0.6) tree(front, R(30, fx0), R(120, 180), 'leaf');
  const ivy = Array.from({ length: Math.floor(R(3, 8)) }, () => strand(ctx, front, R(10, width - 10), 344, R(14, 30), true));
  front.style.cursor = 'pointer';
  back.style.cursor = 'pointer';
  for (const g of [front, back]) g.addEventListener('pointerdown', (e) => { trees.forEach((t) => t.shake()); ivy.forEach((s) => s.kick(Math.random() * 3 - 1.5)); drop(e, 8, [C.RUST, C.IVY]); });
  return { sniffAt: x0 + gx + 27 };
}
