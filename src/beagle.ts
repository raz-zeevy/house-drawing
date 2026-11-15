// A beagle and his friend the white cat each wander along the pavement, left to
// right, at their own pace: he trots quickly and stops to sniff at the gate, she
// strolls and pauses now and then. Click the dog and he barks; click the cat and she
// meows. After a while on his feet he gets tired, sits and pants for a moment.
// Each moves at exactly their own gait's travel speed, so paws stay planted.
import { el, shape, blot, paint, pen, limb, solid, joint, hang, place, toScene, f, PEN, type Vec } from '../lib/ink.ts';
import { gait } from '../lib/gait.ts';
import { spring, pendulum } from '../lib/motion.ts';

type Tint = <T extends Element>(n: T, c: string, attr?: string) => T;
const TAN = '#b9783f', EAR = '#7f5129', COLLAR = '#8e3b2c';
const BONE = 6; // thigh = shin: short legs
const CAT_BONE = 4.4, NOSE = '#d99a9a';

const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)} a${rx} ${ry} 0 1 0 ${f(2 * rx)} 0 a${rx} ${ry} 0 1 0 ${f(-2 * rx)} 0Z`;
const bump = (x: number, w = 0.35) => (x > 0 && x < w ? Math.sin((Math.PI * x) / w) : 0);

export interface BeagleOptions { ground: number; scale: number; width: number; sniffAt: number; tint: Tint }

export function beagle(parent: Element, { ground, scale, width, sniffAt, tint }: BeagleOptions): { step(t: number, dt: number, wind: number): void; x(): number } {
  const root = el('g', {}, parent);
  const trot = gait({ kind: 'walk', stride: 10, duty: 0.6, period: 0.46, lift: 2.4, heelOff: 6, thigh: BONE, shin: BONE, ankleY: 118.8, ground: 120, toe: 1.8 });

  // her own slower, longer-period walk
  const catWalk = gait({ kind: 'walk', stride: 7.5, duty: 0.62, period: 0.72, lift: 2, heelOff: 4, thigh: CAT_BONE, shin: CAT_BONE, ankleY: 119.4, ground: 120, toe: 1.2 });
  const cat = el('g', { style: 'cursor:pointer' }, root);
  el('title', {}, cat).textContent = 'White cat';
  el('rect', { x: 28, y: 98, width: 50, height: 26, fill: 'transparent' }, cat);
  const catTail = limb(cat, 1.9, PEN * 0.7);
  const catFar = [pen(cat, PEN * 0.9), pen(cat, PEN * 0.9)];
  const catFarFeet = [blot(cat), blot(cat)];
  const catFill = shape(cat, 0);
  const catBack = pen(cat, PEN * 0.9), catBelly = pen(cat, PEN * 0.8);
  const catHead = shape(cat, PEN * 0.8), catEars = shape(cat, PEN * 0.7);
  const catNose = tint(paint(cat, NOSE, 0), NOSE), catEye = blot(cat);
  const catNear = [pen(cat, PEN * 0.9), pen(cat, PEN * 0.9)];
  const catNearFeet = [blot(cat), blot(cat)];
  const meow = el('text', { 'font-size': 8, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: 'currentColor', opacity: 0, 'pointer-events': 'none' }, root);
  meow.textContent = 'meow';
  const catTailSway = spring(20, 4);
  let catPhase = 0.35, cx = 560, cgo = 1, cmode: 'meow' | 'pause' | null = null, cmodeT = 0, nextPause = 6;
  const CDUR = { meow: 2.4, pause: 2.8 };

  const dog = el('g', { style: 'cursor:pointer' }, root);
  el('title', {}, dog).textContent = 'Beagle';
  el('rect', { x: 26, y: 88, width: 70, height: 36, fill: 'transparent' }, dog); // a finger-sized target
  const tail = limb(dog, 2.4, PEN * 0.8);
  tint(tail.g.querySelector('path')!, TAN);
  const tailTip = shape(dog, PEN * 0.6);
  const farLegs = [limb(dog, 2.8, PEN * 0.8), limb(dog, 2.8, PEN * 0.8)];
  const farPaws = [shape(dog, PEN * 0.6), shape(dog, PEN * 0.6)];
  const body = shape(dog, PEN * 0.9);
  const rump = tint(paint(dog, TAN, PEN * 0.5), TAN);
  const saddle = blot(dog);
  const neck = solid(limb(dog, 6, PEN * 0.8), TAN);
  tint(neck.g.querySelector('path')!, TAN);
  const head = tint(paint(dog, TAN, PEN * 0.8), TAN);
  const muzzle = shape(dog, PEN * 0.7);
  const tongue = tint(paint(dog, NOSE, PEN * 0.4), NOSE);
  const blaze = pen(dog, PEN * 0.5);
  const nose = blot(dog), eye = blot(dog);
  const ear = tint(paint(dog, EAR, PEN * 0.6), EAR);
  const collar = tint(el('path', { fill: 'none', stroke: COLLAR, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, dog), COLLAR, 'stroke');
  const nearLegs = [limb(dog, 2.8, PEN * 0.8), limb(dog, 2.8, PEN * 0.8)];
  const nearPaws = [shape(dog, PEN * 0.6), shape(dog, PEN * 0.6)];
  const woof = el('text', { 'font-size': 9, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: 'currentColor', opacity: 0, 'pointer-events': 'none' }, root);
  woof.textContent = 'woof!';

  const earSwing = pendulum(14, 1.6), tailWag = spring(80, 6);
  let x = 220, phase = 0.1, go = 1;
  let mode: 'bark' | 'sniff' | 'rest' | null = null, modeT = 0, sniffed = false, walked = 0, nextRest = 9;
  const DUR = { bark: 2.6, sniff: 3.2, rest: 3.2 };
  dog.addEventListener('pointerdown', () => { if (!mode) { mode = 'bark'; modeT = 0; } });
  cat.addEventListener('pointerdown', () => { if (cmode !== 'meow') { cmode = 'meow'; cmodeT = 0; } });

  return {
    x: () => x,
    step(t, dt, wind) {
      if (!mode && !sniffed && x > sniffAt) { mode = 'sniff'; modeT = 0; sniffed = true; }
      walked += dt * go;
      if (!mode && walked > nextRest && x > 0 && x < width) { mode = 'rest'; modeT = 0; walked = 0; nextRest = 10 + Math.random() * 8; }
      if (mode) { modeT += dt; if (modeT > DUR[mode]) mode = null; }
      go += ((mode ? 0 : 1) - go) * Math.min(1, dt * 3);
      phase += (dt / trot.period) * go;
      x += trot.speed * scale * dt * go;
      if (x > width + 90) { x = -90; sniffed = false; }
      place(dog, x, ground, 1, scale);

      // hind legs on the gait, front legs a quarter cycle later
      const hp = trot.pose(phase, go), fp = trot.pose(phase + 0.25, go);
      const sitE = mode === 'rest' ? Math.min(1, modeT * 2.2, (DUR.rest - modeT) * 2.2) : 0;
      const sit = sitE * sitE * (3 - 2 * sitE);
      const H: Vec = [hp.hip[0] + sit * 5, hp.hip[1] + sit * 9], S: Vec = [64 - sit * 2, fp.hip[1] - sit * 4.5];
      const sniff = mode === 'sniff' ? Math.min(1, modeT * 2, (DUR.sniff - modeT) * 2) : 0;
      const barkK = mode === 'bark' ? bump(modeT - 0.35) + bump(modeT - 1.0) + bump(modeT - 1.6) : 0;
      const nod = sniff * 6 - barkK * 2.4 + fp.bob * 0.5 + 1.5 * go; // nose a little low on the trot
      const legsOf = (i: number) => {
        const front: Vec = [fp.feet[i].ankle[0] + 24, fp.feet[i].ankle[1]];
        return { hind: [H, sit > 0.01 ? joint(H, hp.feet[i].ankle, BONE, BONE, 1) : hp.feet[i].knee, hp.feet[i].ankle] as Vec[], fore: [S, joint(S, front, BONE, BONE, -1), front] as Vec[], paws: [hp.feet[i].ankle, front] };
      };
      const drawPaws = (nodes: SVGPathElement[], paws: Vec[]) => nodes.forEach((n, j) => n.setAttribute('d', oval(paws[j][0] + 1.1, paws[j][1] + 0.5, 1.9, 1.1)));
      const far = legsOf(1), near = legsOf(0);
      farLegs[0].draw(far.hind, [0, 0.4]); farLegs[1].draw(far.fore, [0, 0.4]); drawPaws(farPaws, far.paws);
      nearLegs[0].draw(near.hind, [0, 0.4]); nearLegs[1].draw(near.fore, [0, 0.4]); drawPaws(nearPaws, near.paws);

      const midY = (H[1] + S[1]) / 2;
      body.setAttribute('d', `M${f(H[0] - 5)} ${f(H[1] - 4)} Q${f(52)} ${f(midY - 7.5)} ${f(S[0] + 2)} ${f(S[1] - 6)} Q${f(S[0] + 9)} ${f(S[1] - 4)} ${f(S[0] + 8)} ${f(S[1] + 3)} Q${f(52)} ${f(midY + 6)} ${f(H[0] + 2)} ${f(H[1] + 4)} Q${f(H[0] - 6.5)} ${f(H[1] + 3)} ${f(H[0] - 5)} ${f(H[1] - 4)}Z`);
      rump.setAttribute('d', oval(H[0] + 1, H[1] - 0.6, 5.6, 4.2));
      saddle.setAttribute('d', `M${f(H[0] - 3)} ${f(H[1] - 4.6)} Q${f(52)} ${f(midY - 8.4)} ${f(S[0] - 1)} ${f(S[1] - 6.6)} Q${f(S[0] - 2)} ${f(S[1] - 2.6)} ${f(S[0] - 5)} ${f(S[1] - 1.4)} Q${f(52)} ${f(midY - 2)} ${f(H[0] + 2)} ${f(H[1] - 0.4)}Z`);

      const Hd: Vec = [S[0] + 11 + sniff * 2, S[1] - 11 + nod];
      neck.draw([[S[0] + 3, S[1] - 3], [S[0] + 7, S[1] - 7.5 + nod * 0.5], [Hd[0] - 1, Hd[1] + 1]], [0, 0]);
      head.setAttribute('d', oval(Hd[0], Hd[1], 4.6, 3.8));
      muzzle.setAttribute('d', `M${f(Hd[0] + 2)} ${f(Hd[1] - 1.6)} Q${f(Hd[0] + 7)} ${f(Hd[1] - 2.2 - barkK)} ${f(Hd[0] + 8.6)} ${f(Hd[1] + 0.2)} Q${f(Hd[0] + 8.4)} ${f(Hd[1] + 2.6 + barkK)} ${f(Hd[0] + 5)} ${f(Hd[1] + 2.4 + barkK)} Q${f(Hd[0] + 2.4)} ${f(Hd[1] + 2.4)} ${f(Hd[0] + 1.6)} ${f(Hd[1] + 0.8)}Z`);
      const tl = sit * (2.6 + Math.sin(t * 11) * 0.5);
      tongue.setAttribute('d', tl > 0.2 ? `M${f(Hd[0] + 4.4)} ${f(Hd[1] + 2.2)} Q${f(Hd[0] + 4.6)} ${f(Hd[1] + 2.2 + tl * 1.3)} ${f(Hd[0] + 5.8)} ${f(Hd[1] + 2.2 + tl)} Q${f(Hd[0] + 6.4)} ${f(Hd[1] + 2.6)} ${f(Hd[0] + 6)} ${f(Hd[1] + 2.2)}Z` : '');
      blaze.setAttribute('d', `M${f(Hd[0] + 0.4)} ${f(Hd[1] - 3.6)} Q${f(Hd[0] + 1.6)} ${f(Hd[1] - 2.6)} ${f(Hd[0] + 2.4)} ${f(Hd[1] - 1.4)}`);
      nose.setAttribute('d', oval(Hd[0] + 8.6, Hd[1] + 0.2, 1.1, 0.9));
      eye.setAttribute('d', oval(Hd[0] + 1.8, Hd[1] - 1.2, 0.55, 0.55));
      const ea = earSwing.step(-fp.bob * 1.2 - go * 0.4 - wind * 0.15 + barkK * 2, dt) * 57.3;
      const E: Vec = [Hd[0] - 1.2, Hd[1] - 2.4], tip = hang(E, 8.4, ea), ec = hang(E, 4.6, ea - 30);
      ear.setAttribute('d', `M${f(E[0] + 1.4)} ${f(E[1])} Q${f(ec[0] + 2.6)} ${f(ec[1])} ${f(tip[0])} ${f(tip[1])} Q${f(ec[0] - 1.6)} ${f(ec[1])} ${f(E[0] - 1.2)} ${f(E[1] + 0.4)}Z`);
      collar.setAttribute('d', `M${f(S[0] + 4.4)} ${f(S[1] - 8.5 + nod * 0.5)} Q${f(S[0] + 7)} ${f(S[1] - 6.5 + nod * 0.5)} ${f(S[0] + 8.4)} ${f(S[1] - 4 + nod * 0.4)}`);

      const fast = mode === 'bark';
      const wag = tailWag.step(Math.sin(t * (fast ? 20 : 8)) * (fast ? 26 : 10), dt);
      const T: Vec = [H[0] - 4.6, H[1] - 3.6], tTip = hang(T, 11, 196 + wag * 1.3 + sit * 70);
      tail.draw([T, hang(T, 6, 206 + wag + sit * 50), tTip], [0, 0]);
      tailTip.setAttribute('d', oval(tTip[0], tTip[1], 1.3, 1.3));

      const ms = toScene(x, ground, 1, Hd[0] + 6, Hd[1] - 9, scale);
      woof.setAttribute('x', f(ms[0])); woof.setAttribute('y', f(ms[1]));
      woof.setAttribute('opacity', f(Math.min(1, barkK * 1.6)));

      // ---------- the cat: open strokes, single-stroke legs with ink-dot feet
      nextPause -= dt * cgo;
      if (!cmode && nextPause <= 0) { cmode = 'pause'; cmodeT = 0; nextPause = 7 + Math.random() * 8; }
      if (cmode) { cmodeT += dt; if (cmodeT > CDUR[cmode]) cmode = null; }
      cgo += ((cmode ? 0 : 1) - cgo) * Math.min(1, dt * 2.5);
      catPhase += (dt / catWalk.period) * cgo;
      cx += catWalk.speed * scale * dt * cgo;
      if (cx > width + 60) cx = -60;
      place(cat, cx, ground, 1, scale);
      const ch = catWalk.pose(catPhase, cgo), cf = catWalk.pose(catPhase + 0.25, cgo);
      const CH = ch.hip, CS: Vec = [58, cf.hip[1]];
      const meowK = cmode === 'meow' ? bump(modeT - 0.3, 0.6) + bump(modeT - 1.3, 0.6) : 0;
      const catLegs = (i: number) => {
        const front: Vec = [cf.feet[i].ankle[0] + 18, cf.feet[i].ankle[1]];
        return { hind: [CH, ch.feet[i].knee, ch.feet[i].ankle], fore: [CS, joint(CS, front, CAT_BONE, CAT_BONE, -1), front] };
      };
      const stroke = (n: SVGPathElement, pts: Vec[]) => n.setAttribute('d', `M${f(pts[0][0])} ${f(pts[0][1])} Q${f(pts[1][0])} ${f(pts[1][1])} ${f(pts[2][0])} ${f(pts[2][1])}`);
      const dotFeet = (nodes: SVGPathElement[], legs: Vec[][]) => nodes.forEach((n, j) => n.setAttribute('d', oval(legs[j][2][0] + 0.6, legs[j][2][1] + 0.2, 1.2, 0.8)));
      const cFar = catLegs(1), cNear = catLegs(0);
      stroke(catFar[0], cFar.hind); stroke(catFar[1], cFar.fore); dotFeet(catFarFeet, [cFar.hind, cFar.fore]);
      stroke(catNear[0], cNear.hind); stroke(catNear[1], cNear.fore); dotFeet(catNearFeet, [cNear.hind, cNear.fore]);
      const cm = (CH[1] + CS[1]) / 2;
      const backD = `M${f(CH[0] - 3.4)} ${f(CH[1] - 1)} Q${f(CH[0] - 2)} ${f(CH[1] - 4.6)} ${f(48)} ${f(cm - 5.4)} Q${f(CS[0] - 2)} ${f(CS[1] - 5)} ${f(CS[0] + 2)} ${f(CS[1] - 4)}`;
      const bellyD = `M${f(CS[0] + 2.6)} ${f(CS[1] + 1.4)} Q${f(48)} ${f(cm + 4.4)} ${f(CH[0] + 1)} ${f(CH[1] + 2.4)}`;
      catBack.setAttribute('d', backD);
      catBelly.setAttribute('d', bellyD);
      catFill.setAttribute('d', backD + ` L${f(CS[0] + 2.6)} ${f(CS[1] + 1.4)} ` + bellyD.slice(bellyD.indexOf('Q')) + 'Z');
      const cnod = cf.bob * 0.4 - meowK * 1.6;
      const C: Vec = [CS[0] + 5, CS[1] - 6.4 + cnod];
      catHead.setAttribute('d', oval(C[0], C[1], 3.4, 2.9));
      catEars.setAttribute('d', `M${f(C[0] - 2.6)} ${f(C[1] - 1.6)} L${f(C[0] - 2.2)} ${f(C[1] - 5.2)} L${f(C[0] - 0.4)} ${f(C[1] - 2.6)}Z M${f(C[0] + 0.6)} ${f(C[1] - 2.7)} L${f(C[0] + 2.4)} ${f(C[1] - 5.4)} L${f(C[0] + 2.8)} ${f(C[1] - 1.8)}Z`);
      catNose.setAttribute('d', oval(C[0] + 3.2, C[1] + 0.4, 0.6, 0.5));
      catEye.setAttribute('d', oval(C[0] + 1.4, C[1] - 0.6, 0.4, 0.4));
      const sway = catTailSway.step(wind * 6 + Math.sin(t * 1.7) * 6 + (cmode ? 10 : 0), dt);
      const CT: Vec = [CH[0] - 3, CH[1] - 1.6];
      catTail.draw([CT, hang(CT, 7, 200 + sway), hang(CT, 13, 172 + sway * 1.4)], [0, 0]);
      const mm = toScene(cx, ground, 1, C[0] + 3, C[1] - 6, scale);
      meow.setAttribute('x', f(mm[0])); meow.setAttribute('y', f(mm[1]));
      meow.setAttribute('opacity', f(Math.min(1, meowK * 1.6)));
    },
  };
}
