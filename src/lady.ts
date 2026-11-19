// Ora, an old lady with white hair, walks slowly along the pavement, right to left, leaning
// a little on a cane that moves with her far leg. Click her and she stops, waves and
// says shalom, then shuffles on. After leaving the lot she waits a while, then comes again.
// After sunset she goes in at the green gate; through the night she now and then comes
// to the barred window and looks out. In the morning she comes out of the gate again.
// Some mornings, up to the early afternoon, she turns at her gate and goes off right to the
// shops, comes back with a bag of groceries, goes in at the gate and a moment later comes
// out again to carry on her walk. When Toto trots up to her she stops, stoops and pets him.
import { el, pen, shape, blot, paint, limb, shoe, joint, place, toScene, f, pt, PEN, type Vec } from '../lib/ink.ts';
import { gait } from '../lib/gait.ts';
import { spring, ease, seeded } from '../lib/motion.ts';
import { type Ctx, type Win, type Walker, isNight, tint } from './kit.ts';

const BAG = '#d8c8a2', LEEK = '#6f9a4e', ERRANDS_UNTIL = 0.58; // the drawing's time for about 2 pm
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

/** Walks inside the lot's local x range [from, to] (right to left), feet on `ground`; at night she goes in at `gate` and is at her `window` now and then. `x0` is the lot's scene x, for the dog to find her. */
export function lady(ctx: Ctx, parent: Element, ground: number, from: number, to: number, { gate, window, x0 }: { gate: number; window: OraWindow; x0: number }): Walker {
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
  // the grocery bag, held in the free hand: cloth, two handles, leek tops sticking out
  const bagG = el('g', { display: 'none' }, fig);
  const leeks = tint(ctx, el('path', { fill: 'none', 'stroke-width': PEN * 0.9, 'stroke-linecap': 'round' }, bagG), LEEK, 'stroke');
  const bag = tint(ctx, paint(bagG, BAG, PEN * 0.7), BAG);
  const handles = pen(bagG, PEN * 0.55);

  const walk = gait({ kind: 'shuffle', period: 1.5, stride: 12, lift: 1.6, heelOff: 8, thigh: 21, shin: 21, ankleY: 118.4 });
  const sway = spring(40, 8);
  let phase = 0, x = from - 360, rest = 0, waveT = -1;
  let home = false, started = false, seen = false, flip = 0; // home: indoors for the night
  // errand: 0 out for her walk, 1 off to the shops, 2 at the shops, 3 coming home with the bag, 4 putting it away indoors
  let dir: 1 | -1 = -1, errand = 0, hold = 0;
  let petT = 0, petDur = 0, petHead: (() => Vec) | null = null; // petting the dog: seconds in, how long, where his head is (scene)
  fig.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (waveT < 0) waveT = 0; });

  ctx.add({
    step({ t, dt, tau }) {
      if (petT >= petDur) petHead = null;
      const night = isNight(tau);
      if (night && !home && (!started || rest > 0)) home = true; // already out of sight: she's simply indoors
      if (!night && home) { home = false; x = gate; rest = 0; seen = false; window.reset(); dir = -1; errand = 0; hold = 0; }
      started = true;
      if (home) {
        // at her window with the light on, or the light off: a few minutes each
        fig.style.display = 'none';
        flip -= dt;
        if (flip <= 0) { seen = !seen && Math.random() < 0.7; flip = seen ? R(90, 240) : R(120, 300); window.show(seen); }
        return;
      }
      if (rest > 0) { rest -= dt; fig.style.display = 'none'; return; }
      if (hold > 0) {
        hold -= dt; fig.style.display = 'none';
        if (hold <= 0 && errand === 2) { errand = 3; dir = -1; x = from; } // back from the shops, from the right
        else if (hold <= 0 && errand === 4) { errand = 0; x = gate; } // out of the gate again, bag left at home
        return;
      }
      fig.style.display = '';
      // the wave: slow to a stop, lift the hand, wave, walk on
      let w = 0;
      if (waveT >= 0) {
        waveT += dt;
        w = waveT < 0.5 ? ease(waveT / 0.5) : waveT < WAVE - 0.5 ? 1 : 1 - ease((waveT - WAVE + 0.5) / 0.5);
        if (waveT > WAVE) waveT = -1;
      }
      // petting Toto: slow to a stop, stoop, stroke his head, straighten up, walk on
      let pk = 0;
      if (petHead) { petT += dt; pk = petT < 0.6 ? ease(petT / 0.6) : petT < petDur - 0.6 ? 1 : 1 - ease((petT - petDur + 0.6) / 0.6); }
      const go = 1 - Math.max(w, pk);
      phase += (dt / walk.period) * go;
      const before = x;
      x += dir * walk.speed * SCALE * dt * go;
      if (dir < 0 && before > gate && x <= gate) {
        if (night) { home = true; flip = R(3, 8); return; } // in at the gate
        if (errand === 3) { errand = 4; hold = R(2, 4); fig.style.display = 'none'; return; }
        if (errand === 0 && tau < ERRANDS_UNTIL && R() < 0.5) { errand = 1; dir = 1; } // turns for the shops
      }
      if (dir > 0 && x > from) { errand = 2; hold = R(8, 16); fig.style.display = 'none'; return; }
      if (x < to) { x = from; rest = R(6, 14); }
      place(fig, x, ground, dir, SCALE);

      const p = walk.pose(phase, go), b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([[p.hip[0], p.hip[1] - 2], fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      fig.insertBefore(legs[p.front].g, skirt); fig.insertBefore(shoes[p.front], skirt);

      // a full skirt to mid-calf, pushed out by the forward knee
      const kF = p.feet[p.front].knee, waist = 70 + b, hem = 101 + b * 0.5;
      const fx = Math.max(kF[0] + 3, 48);
      skirt.setAttribute('d', `M33 ${f(waist)} L47 ${f(waist)} Q${f(fx)} ${f(waist + 14)} ${f(fx + 1.4)} ${f(hem)} Q40 ${f(hem + 1.6)} 29.6 ${f(hem - 0.4)} Q30.6 ${f(waist + 14)} 33 ${f(waist)}Z`);
      pleats.setAttribute('d', `M37 ${f(waist + 6)} L35.4 ${f(hem - 1)} M42 ${f(waist + 6)} L${f(fx - 4)} ${f(hem - 1)}`);

      // a stooped back: shoulders well forward of the hips, head further still
      const bend = pk * 0.7, cb = Math.cos(bend), sb = Math.sin(bend); // stooping forward from the hips
      const rot = ([px, py]: Vec): Vec => [40 + (px - 40) * cb - (py - waist) * sb, waist + (px - 40) * sb + (py - waist) * cb];
      const sh: Vec = rot([46, 49 + b]), hc: Vec = rot([52.6, 41.4 + b]);
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
      const carrying = errand === 3;
      const s = sway.step(((p.feet[0].ankle[0] - 40) / walk.stride) * (carrying ? 3 : 10) * go, dt) * Math.PI / 180; // a full bag hardly swings
      const shF: Vec = [sh[0] - 2, sh[1] + 2];
      const down: Vec = [shF[0] + 28 * Math.sin(s), shF[1] + 28 * Math.cos(s)];
      const wag = Math.sin((t * 2 * Math.PI) / 0.7) * 4;
      const up: Vec = [shF[0] + 22 + wag, shF[1] - 15];
      let hand: Vec = [down[0] + (up[0] - down[0]) * w, down[1] + (up[1] - down[1]) * w];
      if (petHead && pk > 0) {
        const [sx, sy] = petHead(), stroke = Math.sin(t * 4.5) * 2.4; // his head, in her own space, and the hand going back and forth over it
        const pat: Vec = [40 + (sx - x0 - x) / (dir * SCALE) + stroke, 120 + (sy - ground) / SCALE];
        hand = [hand[0] + (pat[0] - hand[0]) * pk, hand[1] + (pat[1] - hand[1]) * pk];
      }
      farArm.draw([shF, joint(shF, hand, 14.5, 14, -1), hand], [0.2, 0.4]);
      fig.insertBefore(farArm.g, w > 0.3 || pk > 0.3 || carrying ? cane : hit.nextSibling); // a waving hand, or one with a bag, comes in front of her
      bagG.setAttribute('display', carrying && w < 0.3 ? '' : 'none');
      if (carrying) {
        const [bx, by] = down;
        handles.setAttribute('d', `M${f(bx - 4)} ${f(by + 5)} Q${f(bx - 1)} ${f(by - 2)} ${f(bx + 1)} ${f(by + 0.6)} M${f(bx + 4)} ${f(by + 5)} Q${f(bx + 1)} ${f(by - 2)} ${f(bx - 1)} ${f(by + 0.6)}`);
        bag.setAttribute('d', `M${f(bx - 6)} ${f(by + 4.6)} L${f(bx + 6)} ${f(by + 4.6)} L${f(bx + 7.2)} ${f(by + 18)} Q${f(bx)} ${f(by + 19.6)} ${f(bx - 7.2)} ${f(by + 18)}Z`);
        leeks.setAttribute('d', `M${f(bx - 3)} ${f(by + 5)} l-2.4 -9 M${f(bx - 1)} ${f(by + 5)} l-0.4 -10 M${f(bx + 1)} ${f(by + 5)} l2 -8`);
      }

      const [hx, hy] = toScene(x, ground, dir, hc[0] + 4, hc[1] - 14, SCALE);
      hello.setAttribute('x', f(hx - 16)); hello.setAttribute('y', f(hy));
      hello.setAttribute('opacity', f(w));
    },
  });
  return {
    x: () => x0 + x,
    free: () => !home && rest <= 0 && hold <= 0 && errand === 0 && waveT < 0 && !petHead && fig.style.display !== 'none',
    pet(head, secs) { petHead = head; petT = 0; petDur = secs; },
  };
}
