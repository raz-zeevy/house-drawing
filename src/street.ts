// The street itself, shared by every house: brick pavement, then (below the card's
// bottom edge, seen only on zoomed-out phones) a kerb and a road with lane dashes.
import { f } from '../lib/ink.ts';
import { seeded } from '../lib/motion.ts';
import { mix, rgb } from '../lib/daynight.ts';
import { type Ctx, BRICK, GLASS, GROUND, H, SP, P, S, box, fillPath } from './kit.ts';

/** Draws the pavement and road under the houses; call `kerbLine()` after the houses' walls. */
export function street(ctx: Ctx, width: number): { kerbLine(): void } {
  const g = ctx.layers.wall, rand = seeded(3);
  const paving = fillPath(g, box(-4, GROUND, width + 8, H - GROUND), SP);
  const joints: string[] = [];
  for (let y = GROUND + 7, r = 0; y < H; y += 7, r++) { joints.push(`M0 ${y} L${width} ${y}`); for (let x = r % 2 ? 7 : 0; x < width; x += 14) joints.push(`M${x} ${y - 7} l0 7`); }
  P(g, joints.join(' '), SP * 0.3).setAttribute('opacity', '0.55');

  const KERB = H, ROAD = H + 6, LANE = H + 92;
  S(g, box(-4, KERB, width + 8, ROAD - KERB, 0.2));
  P(g, Array.from({ length: Math.ceil(width / 34) }, (_, i) => `M${i * 34 + 12} ${KERB} l0 ${ROAD - KERB}`).join(' '), SP * 0.35);
  const road = fillPath(g, `M-4 ${ROAD} L${width + 4} ${ROAD} L${width + 4} ${ROAD + 600} L-4 ${ROAD + 600}Z`);
  P(g, `M-4 ${ROAD + 3} Q${width / 2} ${ROAD + 3.6} ${width + 4} ${ROAD + 3}`, SP * 0.4).setAttribute('opacity', '0.5');
  for (let x = 10; x < width; x += 64) S(g, box(x, LANE - 1.6, 34, 3.2, 0.2), SP * 0.5);
  const grit: string[] = [];
  for (let i = 0; i < width / 5; i++) grit.push(`M${f(rand(0, width))} ${f(rand(ROAD + 6, ROAD + 300))} l${f(rand(0.6, 1.6))} 0`);
  P(g, grit.join(' '), SP * 0.35).setAttribute('opacity', '0.4');

  ctx.add({
    paint(pal) {
      paving.setAttribute('fill', rgb(mix(pal.paper, BRICK, 0.2 * (1 - pal.inkT))));
      road.setAttribute('fill', rgb(mix(pal.paper, GLASS, 0.28)));
    },
  });
  return { kerbLine: () => { P(ctx.layers.wall, `M0 ${GROUND} L${width} ${GROUND}`, SP); } };
}
