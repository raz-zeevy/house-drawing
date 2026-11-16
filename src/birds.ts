// Birds on the electricity wire: rock doves and green monk parakeets, the two you see
// on every wire in Israel. They ride the wire as it sways, bob their heads and sidle
// along it. Click one (or shake the pole) and they all take off, flapping up and away,
// then drift back one by one and land where they were.
import { el, pen, paint, f, type Vec } from '../lib/ink.ts';
import { ease, seeded } from '../lib/motion.ts';
import { type Ctx, SP, tint } from './kit.ts';

const DOVE = '#a7a8ad', DOVE_WING = '#8c8e95', SHEEN = '#5e8f7a', LEGS = '#c98a86';
const PARROT = '#6fae4a', PARROT_GREY = '#c9cdc4', BEAK = '#e0a35a', FLIGHT = '#4a7fa8';

export type Kind = 'dove' | 'parakeet';
/** A perch is a point along the wire: `s` from 0 to 1. */
export interface Perch { kind: Kind; s: number; dir: 1 | -1 }

interface Bird {
  g: SVGGElement; head: SVGGElement; wing: SVGPathElement; folded: SVGPathElement;
  kind: Kind; s: number; dir: 1 | -1;
  state: 'perch' | 'leave' | 'away' | 'land'; u: number; wait: number; from: Vec; off: Vec;
  fidget: number; nod: number; hop: number;
}

export function birds(ctx: Ctx, parent: Element, perches: Perch[], wireAt: (s: number) => Vec): { startle(): void } {
  const R = seeded(77);
  const T = <E extends Element>(n: E, c: string, attr = 'fill') => tint(ctx, n, c, attr);
  const flock: Bird[] = perches.map((p) => {
    const g = el('g', { style: 'cursor:pointer' }, parent);
    el('title', {}, g).textContent = p.kind === 'dove' ? 'A dove on the wire' : 'A green parakeet on the wire';
    el('rect', { x: -12, y: -18, width: 24, height: 20, fill: 'transparent' }, g);
    let head: SVGGElement, folded: SVGPathElement, wing: SVGPathElement;
    if (p.kind === 'dove') {
      // a plump grey dove: round body, small head, dark bars on the wing, a green sheen on the neck
      T(pen(g, SP * 0.5), LEGS, 'stroke').setAttribute('d', 'M-1 -2 L-1.4 0.4 M1.6 -2 L1.8 0.4');
      T(paint(g, DOVE, SP * 0.7), DOVE).setAttribute('d', 'M-11 -6.4 L-6.6 -6 Q-5 -10.6 1 -10.4 Q5.6 -10 5.8 -6.6 Q5 -2 0 -1.6 Q-4.4 -1.6 -6.4 -4.2 L-10.6 -4.6Z');
      folded = T(paint(g, DOVE_WING, SP * 0.5), DOVE_WING);
      folded.setAttribute('d', 'M-8 -6 Q-2 -9.6 3.4 -7 Q-1 -4 -8 -6Z');
      pen(g, SP * 0.5).setAttribute('d', 'M-4 -6.6 l2 -0.8 M-1.6 -6.2 l2 -0.8');
      wing = T(paint(g, DOVE_WING, SP * 0.5), DOVE_WING);
      head = el('g', {}, g);
      T(paint(head, SHEEN, 0), SHEEN).setAttribute('d', 'M2.4 -9.6 Q4.6 -9.8 5.4 -8 L3.4 -7.4Z');
      T(paint(head, DOVE, SP * 0.7), DOVE).setAttribute('d', 'M2.6 -12 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0Z');
      pen(head, SP * 0.6).setAttribute('d', 'M7.6 -12 L9.4 -11.4');
      el('circle', { cx: 6, cy: -12.4, r: 0.55, fill: 'currentColor' }, head);
    } else {
      // a monk parakeet: upright, bright green, grey face and breast, long tail hanging below the wire
      T(paint(g, PARROT, SP * 0.5), PARROT).setAttribute('d', 'M-1.6 -2 L-4.6 9 L-2.6 9.4 L0.4 -1.4Z');
      T(pen(g, SP * 0.5), LEGS, 'stroke').setAttribute('d', 'M-0.4 -1.6 L-0.6 0.4 M1.4 -1.6 L1.6 0.4');
      T(paint(g, PARROT, SP * 0.7), PARROT).setAttribute('d', 'M0 -1.2 Q-4 -2.6 -4 -8 Q-3.4 -12.4 0.6 -12.4 Q3.6 -11.4 3 -6.6 Q2.8 -2 0 -1.2Z');
      T(paint(g, PARROT_GREY, 0), PARROT_GREY).setAttribute('d', 'M1 -10.6 Q3.4 -9.6 2.8 -5.6 Q1.6 -6 1 -10.6Z');
      folded = T(paint(g, PARROT, SP * 0.5), PARROT);
      folded.setAttribute('d', 'M-3.6 -9.4 Q-1 -9 -1 -4.6 Q-2.4 -2.6 -4 -4.6 Q-4.4 -7 -3.6 -9.4Z');
      T(pen(g, SP * 0.6), FLIGHT, 'stroke').setAttribute('d', 'M-3.8 -5 L-4.4 -2.6');
      wing = T(paint(g, PARROT, SP * 0.5), PARROT);
      head = el('g', {}, g);
      T(paint(head, PARROT_GREY, SP * 0.7), PARROT_GREY).setAttribute('d', 'M-1.6 -14 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0Z');
      T(paint(head, BEAK, SP * 0.5), BEAK).setAttribute('d', 'M3.2 -14.6 Q5.2 -14.4 4.6 -12 Q3.8 -12.6 3 -12.8Z');
      el('circle', { cx: 1.8, cy: -14.6, r: 0.55, fill: 'currentColor' }, head);
    }
    wing.setAttribute('opacity', '0');
    g.addEventListener('pointerdown', (e) => { e.stopPropagation(); startle(); });
    return { g, head, wing, folded, kind: p.kind, s: p.s, dir: p.dir, state: 'perch', u: 0, wait: 0, from: [0, 0], off: [0, 0], fidget: R(1, 5), nod: 0, hop: 0 };
  });

  function startle() {
    for (const b of flock) if (b.state === 'perch' || b.state === 'land') {
      const at = wireAt(b.s), away = R() < 0.5 ? -1 : 1;
      b.state = 'leave'; b.u = -R(0, 0.25); b.from = at; b.off = [at[0] + away * R(520, 820), at[1] - R(110, 190)]; // mostly sideways, so they cross the card before leaving it
      b.dir = away as 1 | -1;
    }
  }

  ctx.add({
    step({ t, dt }) {
      for (const b of flock) {
        let p: Vec, flying = false, tilt = 0;
        const perch = wireAt(b.s);
        if (b.state === 'perch') {
          // fidgets: a dove bobs its head; a parakeet sidles a little along the wire with a hop
          b.fidget -= dt;
          if (b.fidget < 0) {
            b.fidget = R(1.5, 6);
            if (b.kind === 'parakeet' && R() < 0.5) { b.s = Math.min(0.86, Math.max(0.44, b.s + b.dir * R(0.004, 0.01))); b.hop = 1; }
            else b.nod = 1;
            if (R() < 0.12) b.dir = -b.dir as 1 | -1;
          }
          b.nod = Math.max(0, b.nod - dt * 2.5); b.hop = Math.max(0, b.hop - dt * 4);
          p = [perch[0], perch[1] - Math.sin(Math.PI * b.hop) * 3];
        } else if (b.state === 'leave') {
          b.u += dt / 3.2;
          const k = ease(Math.max(0, b.u));
          p = [b.from[0] + (b.off[0] - b.from[0]) * k, b.from[1] + (b.off[1] - b.from[1]) * Math.pow(k, 0.8)];
          flying = b.u > 0; tilt = -20;
          if (b.u >= 1) { b.state = 'away'; b.wait = R(5, 12); }
        } else if (b.state === 'away') {
          p = b.off;
          b.wait -= dt;
          if (b.wait < 0) { b.state = 'land'; b.u = 0; b.dir = (b.off[0] > perch[0] ? -1 : 1) as 1 | -1; }
        } else {
          b.u += dt / 4;
          const k = 1 - Math.pow(1 - Math.min(1, b.u), 2.4); // glide in, slowing to land
          p = [b.off[0] + (perch[0] - b.off[0]) * k, b.off[1] + (perch[1] - b.off[1]) * k];
          flying = b.u < 0.92; tilt = 12 * (1 - k);
          if (b.u >= 1) b.state = 'perch';
        }
        b.g.style.display = b.state === 'away' ? 'none' : '';
        b.g.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])}) scale(${b.dir} 1) rotate(${f(tilt)})`);
        b.head.setAttribute('transform', `translate(${f(b.nod * 1.4)} ${f(Math.sin(Math.PI * b.nod) * 1.6)})`);
        // in flight the folded wing gives way to a flapping one
        b.folded.setAttribute('opacity', flying ? '0' : '1');
        b.wing.setAttribute('opacity', flying ? '1' : '0');
        if (flying) {
          const a = Math.sin(t * 2 * Math.PI * (b.kind === 'dove' ? 5 : 7) + b.s * 40) * 9;
          b.wing.setAttribute('d', `M-3 -7 Q-6 ${f(-7 - a)} -9 ${f(-6 - a * 1.3)} Q-2 ${f(-6 - a * 0.4)} 3 -7Z`);
        }
      }
    },
  });
  return { startle };
}
