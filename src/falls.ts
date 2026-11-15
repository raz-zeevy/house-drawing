// Leaves that drift down from a clicked tree, land on the pavement and fade.
import { paint, f, type Vec } from '../lib/ink.ts';
import { clamp } from '../lib/motion.ts';
import { nightTint } from '../lib/daynight.ts';
import { type Ctx, GROUND, SP, leaf } from './kit.ts';

/** Drop `count` leaves around the pointer, cycling through `colours`. */
export type Drop = (e: PointerEvent, count: number, colours: string[]) => void;

interface Fall { n: SVGPathElement; c: string; x: number; y: number; vy: number; ph: number; land: number; age: number; down: number }

export function falls(ctx: Ctx): Drop {
  const layer = ctx.layers.fall, live: Fall[] = [];
  const toSvg = (e: PointerEvent): Vec => { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctx.svg.getScreenCTM()!.inverse()); return [p.x, p.y]; };
  ctx.add({
    step({ dt, wind, pal }) {
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i];
        p.age += dt;
        if (p.y < p.land) {
          p.vy += (18 - p.vy) * Math.min(1, dt * 2);
          p.y += p.vy * dt;
          p.x += (wind * 14 + Math.sin(p.age * 2.4 + p.ph) * 12) * dt;
        } else if (p.down < 0) p.down = p.age;
        const rot = Math.sin((p.down < 0 ? p.age : p.down) * 3 + p.ph) * 50;
        const fade = p.down < 0 ? 1 : 1 - clamp((p.age - p.down - 6) / 2, 0, 1);
        p.n.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) rotate(${f(rot)})`);
        p.n.setAttribute('opacity', f(fade));
        p.n.setAttribute('fill', nightTint(p.c, pal));
        if (fade <= 0) { p.n.remove(); live.splice(i, 1); }
      }
    },
  });
  return (e, count, colours) => {
    const at = toSvg(e);
    for (let i = 0; i < count; i++) {
      const c = colours[i % colours.length], n = paint(layer, c, SP * 0.4);
      n.setAttribute('d', leaf(-2.5, 0, 5, 0, 0.34));
      live.push({ n, c, x: at[0] + (Math.random() - 0.5) * 70, y: at[1] + (Math.random() - 0.5) * 30, vy: 0, ph: Math.random() * 6, land: GROUND + 3 + Math.random() * 30, age: 0, down: -1 });
    }
  };
}
