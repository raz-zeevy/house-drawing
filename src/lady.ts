// Ora, an old lady with white hair, walks slowly along the pavement, right to left, leaning
// a little on a cane that moves with her far leg. Click her and she stops, waves and
// says shalom, then shuffles on. After leaving the lot she waits a while, then comes again.
// After sunset she goes in at the green gate; through the night she now and then comes
// to the barred window and looks out. In the morning she comes out of the gate again.
import { el, pen, shape, blot, paint, limb, shoe, joint, place, toScene, f, pt, PEN, type Vec } from '../lib/ink.ts';
import { gait } from '../lib/gait.ts';
import { spring, ease, seeded } from '../lib/motion.ts';
import { type Ctx, type Win, isNight, tint } from './kit.ts';

const CARDIGAN = '#8a6478', SKIRT = '#4f5b72', HAIR = '#f3f0e8', CANE = '#6b4a32';
const SCALE = 0.92, WAVE = 2.6;

/** Ora's window at night: she's there with the light on, or the light is off. */
export interface OraWindow { show(seen: boolean): void; reset(): void }

/** Ora at a small window, seen from the street: head and shoulders at `s` scale, facing out. Draw it just after the window's `panes` (all switched together), so whatever is in front of the window covers her too. */
export function oraAtWindow(ctx: Ctx, parent: Element, panes: Win[], cx: number, by: number, s: number): OraWindow {
  const g = el('g', { display: 'none', 'pointer-events': 'none', transform: `translate(${cx} ${by}) scale(${s}) translate(${-cx} ${-by})` }, parent);
  el('title', {}, g).textContent = 'Ora at her window';
  tint(ctx, paint(g, CARDIGAN, PEN * 0.6), CARDIGAN).setAttribute('d', `M${cx - 20} ${by} L${cx - 18} ${by - 13} Q${cx - 12} ${by - 20} ${cx - 4} ${by - 21} L${cx + 4} ${by - 21} Q${cx + 12} ${by - 20} ${cx + 18} ${by - 13} L${cx + 20} ${by}Z`);
  pen(g, PEN * 0.45).setAttribute('d', `M${cx} ${by - 18} l0 18 M${cx + 1.6} ${by - 12} l0.1 0 M${cx + 1.6} ${by - 6} l0.1 0`);
  const head = el('g', {}, g);
  shape(head, PEN * 0.6).setAttribute('d', `M${cx - 6.2} ${by - 31} a6.2 7.4 0 1 0 12.4 0 a6.2 7.4 0 1 0 -12.4 0Z`);
  const hair = tint(ctx, paint(head, HAIR, PEN * 0.55), HAIR);
  hair.setAttribute('d', `M${cx - 7} ${by - 29} Q${cx - 8.6} ${by - 41} ${cx} ${by - 40.4} Q${cx + 8.6} ${by - 41} ${cx + 7} ${by - 29} Q${cx + 5.6} ${by - 35} ${cx} ${by - 35.4} Q${cx - 5.6} ${by - 35} ${cx - 7} ${by - 29}Z M${cx - 3.4} ${by - 42.4} a3.4 2.6 0 1 0 6.8 0 a3.4 2.6 0 1 0 -6.8 0Z`);
  pen(head, PEN * 0.4).setAttribute('d', `M${cx - 4.4} ${by - 31} a1.8 1.7 0 1 0 3.6 0 a1.8 1.7 0 1 0 -3.6 0 M${cx + 0.8} ${by - 31} a1.8 1.7 0 1 0 3.6 0 a1.8 1.7 0 1 0 -3.6 0 M${cx - 0.8} ${by - 31.2} l1.6 0 M${cx - 1.4} ${by - 26.4} q1.4 0.8 2.8 0`);
  ctx.add({ step: ({ t }) => { if (g.getAttribute('display') !== 'none') head.setAttribute('transform', `rotate(${f(Math.sin(t * 0.45) * 5)} ${cx} ${by - 22})`); } });
  return {
    show(seen) { g.setAttribute('display', seen ? '' : 'none'); panes.forEach((p) => p.setPower(seen ? 1 : 0)); },
    reset() { g.setAttribute('display', 'none'); panes.forEach((p) => p.setPower(1)); },
  };
}

/** Walks inside the lot's local x range [from, to] (right to left), feet on `ground`; at night she goes in at `gate` and is at her `window` now and then. */
export function lady(ctx: Ctx, parent: Element, ground: number, from: number, to: number, { gate, window }: { gate: number; window: OraWindow }): void {
  const R = seeded(1949);
  const fig = el('g', { style: 'cursor:pointer' }, parent);
  el('title', {}, fig).textContent = 'Ora, out for a walk';
  const hit = el('rect', { x: 22, y: 22, width: 40, height: 100, fill: 'transparent' }, fig);
  const farArm = limb(fig, 3.2);
  const legs = [limb(fig, 3.4), limb(fig, 3.4)];
  const shoes = [blot(fig), blot(fig)];
  const skirt = tint(ctx, paint(fig, SKIRT), SKIRT);
  const pleats = pen(fig, PEN * 0.45);
  const body = tint(ctx, paint(fig, CARDIGAN), CARDIGAN);
  const buttons = pen(fig, PEN * 0.5);
  const neck = pen(fig, PEN * 0.9);
  const head = shape(fig);
  const hair = tint(ctx, paint(fig, HAIR, PEN * 0.7), HAIR);
  const curls = pen(fig, PEN * 0.4);
  const specs = pen(fig, PEN * 0.45);
  const cane = tint(ctx, el('path', { fill: 'none', 'stroke-width': PEN * 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, fig), CANE, 'stroke');
  const nearArm = limb(fig, 3.2);
  const hello = el('text', { 'font-size': 10, 'font-family': "'Architects Daughter', Georgia, serif", fill: 'currentColor', style: 'stroke: var(--paper, #fdfcf8); paint-order: stroke', 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0, 'pointer-events': 'none' }, parent);
  hello.textContent = 'shalom!';

  const walk = gait({ kind: 'shuffle', period: 1.5, stride: 12, lift: 1.6, heelOff: 8, thigh: 21, shin: 21, ankleY: 118.4 });
  const sway = spring(40, 8);
  let phase = 0, x = from - 360, rest = 0, waveT = -1;
  let home = false, started = false, seen = false, flip = 0; // home: indoors for the night
  fig.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (waveT < 0) waveT = 0; });

  ctx.add({
    step({ t, dt, tau }) {
      const night = isNight(tau);
      if (night && !home && (!started || rest > 0)) home = true; // already out of sight: she's simply indoors
      if (!night && home) { home = false; x = gate; rest = 0; seen = false; window.reset(); }
      started = true;
      if (home) {
        // at her window with the light on, or the light off: a few minutes each
        fig.style.display = 'none';
        flip -= dt;
        if (flip <= 0) { seen = !seen && Math.random() < 0.7; flip = seen ? R(90, 240) : R(120, 300); window.show(seen); }
        return;
      }
      if (rest > 0) { rest -= dt; fig.style.display = 'none'; return; }
      fig.style.display = '';
      // the wave: slow to a stop, lift the hand, wave, walk on
      let w = 0;
      if (waveT >= 0) {
        waveT += dt;
        w = waveT < 0.5 ? ease(waveT / 0.5) : waveT < WAVE - 0.5 ? 1 : 1 - ease((waveT - WAVE + 0.5) / 0.5);
        if (waveT > WAVE) waveT = -1;
      }
      const go = 1 - w;
      phase += (dt / walk.period) * go;
      const before = x;
      x -= walk.speed * SCALE * dt * go;
      if (night && before > gate && x <= gate) { home = true; flip = R(3, 8); return; } // in at the gate
      if (x < to) { x = from; rest = R(6, 14); }
      place(fig, x, ground, -1, SCALE);

      const p = walk.pose(phase, go), b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([[p.hip[0], p.hip[1] - 2], fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      fig.insertBefore(legs[p.front].g, skirt); fig.insertBefore(shoes[p.front], skirt);

      // a full skirt to mid-calf, pushed out by the forward knee
      const kF = p.feet[p.front].knee, waist = 70 + b, hem = 101 + b * 0.5;
      const fx = Math.max(kF[0] + 3, 48);
      skirt.setAttribute('d', `M33 ${f(waist)} L47 ${f(waist)} Q${f(fx)} ${f(waist + 14)} ${f(fx + 1.4)} ${f(hem)} Q40 ${f(hem + 1.6)} 29.6 ${f(hem - 0.4)} Q30.6 ${f(waist + 14)} 33 ${f(waist)}Z`);
      pleats.setAttribute('d', `M37 ${f(waist + 6)} L35.4 ${f(hem - 1)} M42 ${f(waist + 6)} L${f(fx - 4)} ${f(hem - 1)}`);

      // a stooped back: shoulders well forward of the hips, head further still
      const sh: Vec = [46, 49 + b], hc: Vec = [52.6, 41.4 + b];
      body.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] - 2.6)} Q${f(sh[0] + 1)} ${f(sh[1] - 5)} ${f(sh[0] + 5)} ${f(sh[1])} Q${f(sh[0] + 5.4)} ${f(sh[1] + 11)} 48 ${f(waist + 1)} L32.4 ${f(waist + 1)} Q29.4 ${f(sh[1] + 8)} ${f(sh[0] - 13)} ${f(sh[1] + 3)} Q${f(sh[0] - 11)} ${f(sh[1] - 3)} ${f(sh[0] - 6)} ${f(sh[1] - 2.6)}Z`);
      buttons.setAttribute('d', `M${f(sh[0] + 3.2)} ${f(sh[1] + 4)} l0.1 0 M${f(sh[0] + 4.4)} ${f(sh[1] + 10)} l0.1 0 M${f(sh[0] + 4.8)} ${f(sh[1] + 16)} l0.1 0`);
      neck.setAttribute('d', `M${f(sh[0] + 1.6)} ${f(sh[1] - 2)} L${f(hc[0] - 2.4)} ${f(hc[1] + 4.2)}`);
      head.setAttribute('d', `M${f(hc[0] - 4.8)} ${f(hc[1])} a4.8 5.4 0 1 0 9.6 0 a4.8 5.4 0 1 0 -9.6 0Z`);
      specs.setAttribute('d', `M${f(hc[0] + 2.4)} ${f(hc[1] - 0.4)} a1.4 1.3 0 1 0 2.8 0 a1.4 1.3 0 1 0 -2.8 0 M${f(hc[0] - 2.4)} ${f(hc[1] - 1.2)} L${f(hc[0] + 2.4)} ${f(hc[1] - 0.4)}`);
      // white hair: a soft cap of curls over the back of the head, and a bun
      const cx = hc[0], cy = hc[1];
      hair.setAttribute('d', `M${f(cx + 4.6)} ${f(cy - 2.6)} Q${f(cx + 3.6)} ${f(cy - 7)} ${f(cx - 0.6)} ${f(cy - 6.6)} Q${f(cx - 3.4)} ${f(cy - 11.4)} ${f(cx - 7.2)} ${f(cy - 8.4)} Q${f(cx - 9.6)} ${f(cy - 6)} ${f(cx - 7)} ${f(cy - 4.6)} Q${f(cx - 8.6)} ${f(cy - 1.6)} ${f(cx - 6.6)} ${f(cy + 1.6)} Q${f(cx - 6)} ${f(cy + 4.6)} ${f(cx - 3)} ${f(cy + 3)} Q${f(cx - 4.2)} ${f(cy - 0.6)} ${f(cx - 1)} ${f(cy - 2.6)} Q${f(cx + 2)} ${f(cy - 3.4)} ${f(cx + 4.6)} ${f(cy - 2.6)}Z`);
      curls.setAttribute('d', `M${f(cx - 6.6)} ${f(cy - 8.4)} q1.4 -1.6 2.8 0 M${f(cx - 4.4)} ${f(cy - 4.8)} q1.2 -1.2 2.4 0 M${f(cx - 6.4)} ${f(cy - 0.6)} q1.2 -1.2 2.4 0 M${f(cx)} ${f(cy - 5.4)} q1.2 -1.2 2.4 0`);

      // the cane goes forward with the far leg and takes weight while that foot is down
      const far = p.feet[1], tip: Vec = [far.ankle[0] + 10, Math.min(120, far.ankle[1] + 1.6)];
      const grip: Vec = [tip[0] - 3, tip[1] - 37];
      cane.setAttribute('d', `M${pt(tip)} L${pt(grip)} Q${f(grip[0] + 1)} ${f(grip[1] - 3.4)} ${f(grip[0] + 4)} ${f(grip[1] - 2.4)} L${f(grip[0] + 4.6)} ${f(grip[1] - 0.6)}`);
      const shN: Vec = [sh[0] + 1, sh[1] + 2.4];
      nearArm.draw([shN, joint(shN, grip, 15, 14, -1), grip], [0.2, 0.4]);

      // the far arm hangs and sways a little, or comes up to wave
      const s = sway.step(((p.feet[0].ankle[0] - 40) / walk.stride) * 10 * go, dt) * Math.PI / 180;
      const shF: Vec = [sh[0] - 2, sh[1] + 2];
      const down: Vec = [shF[0] + 28 * Math.sin(s), shF[1] + 28 * Math.cos(s)];
      const wag = Math.sin((t * 2 * Math.PI) / 0.7) * 4;
      const up: Vec = [shF[0] + 22 + wag, shF[1] - 15];
      const hand: Vec = [down[0] + (up[0] - down[0]) * w, down[1] + (up[1] - down[1]) * w];
      farArm.draw([shF, joint(shF, hand, 14.5, 14, -1), hand], [0.2, 0.4]);
      fig.insertBefore(farArm.g, w > 0.3 ? cane : hit.nextSibling); // a waving hand comes in front of her

      const [hx, hy] = toScene(x, ground, -1, hc[0] + 4, hc[1] - 14, SCALE);
      hello.setAttribute('x', f(hx - 16)); hello.setAttribute('y', f(hy));
      hello.setAttribute('opacity', f(w));
    },
  });
}
