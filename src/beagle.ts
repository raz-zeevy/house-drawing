// A beagle and his friend the white cat each wander along the pavement, left to
// right, at their own pace: he trots quickly and stops to sniff at the gate, she
// strolls and pauses now and then. Click the dog and he barks; click the cat and she
// meows. After a while on his feet he gets tired, sits and pants for a moment. When he
// trots up to Ora on her walk he sits, looks up and wags while she pets him. He jumps up
// on benches, trots along the seat and hops down, and bounds over tree pits. Coming up
// on Angel while she's awake, he stops and barks at her.
// Each moves at exactly their own gait's travel speed, so paws stay planted.
import { el, shape, blot, paint, pen, limb, solid, joint, hang, place, toScene, f, PEN, type Vec } from '../lib/ink.ts';
import { gait } from '../lib/gait.ts';
import { spring, pendulum } from '../lib/motion.ts';
import { type Bed, type Hop, type Walker, isNight } from './kit.ts';

type Tint = <T extends Element>(n: T, c: string, attr?: string) => T;
export const TAN = '#b9783f', EAR = '#7f5129';
const COLLAR = '#8e3b2c';
const BONE = 6; // thigh = shin: short legs
const CAT_BONE = 4.4, NOSE = '#d99a9a';

const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)} a${rx} ${ry} 0 1 0 ${f(2 * rx)} 0 a${rx} ${ry} 0 1 0 ${f(-2 * rx)} 0Z`;
const bump = (x: number, w = 0.35) => (x > 0 && x < w ? Math.sin((Math.PI * x) / w) : 0);

export interface BeagleOptions { ground: number; scale: number; width: number; sniffAt: number; tint: Tint; bed?: Bed; wall?: { x0: number; x1: number; y: number }; friend?: Walker; hops?: Hop[] }

export function beagle(parent: Element, { ground, scale, width, sniffAt, tint, bed, wall, friend, hops = [] }: BeagleOptions): { step(t: number, dt: number, wind: number, tau: number): void; x(): number } {
  const root = el('g', {}, parent);
  const trot = gait({ kind: 'walk', stride: 10, duty: 0.6, period: 0.46, lift: 2.4, heelOff: 6, thigh: BONE, shin: BONE, ankleY: 118.8, ground: 120, toe: 1.8 });

  // her own slower, longer-period walk
  const catWalk = gait({ kind: 'walk', stride: 6.6, duty: 0.62, period: 0.95, lift: 2, heelOff: 4, thigh: CAT_BONE, shin: CAT_BONE, ankleY: 119.4, ground: 120, toe: 1.2 });
  const cat = el('g', { style: 'cursor:pointer' }, root);
  el('title', {}, cat).textContent = 'Angel, the white cat';
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
  // she wanders the wall top (or the pavement, on a street without that wall), turning now and then, sometimes napping a few minutes
  const W = wall ?? { x0: -60, x1: width + 60, y: ground };
  let catPhase = 0.35, cx = (W.x0 + W.x1) / 2, cdir: 1 | -1 = 1, cgo = 1, cmode: 'meow' | 'pause' | 'nap' | null = null, cmodeT = 0, cdur = 0, nextPause = 6;
  const zs = [0, 1, 2].map(() => el('text', { 'font-size': 6, 'font-family': "'Architects Daughter', Georgia, serif", fill: 'currentColor', opacity: 0, 'pointer-events': 'none' }, root));
  zs.forEach((z) => { z.textContent = 'z'; });

  const dog = el('g', { style: 'cursor:pointer' }, root);
  el('title', {}, dog).textContent = 'Toto, the beagle';
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
  let mode: 'bark' | 'sniff' | 'rest' | 'pet' | null = null, modeT = 0, sniffed = false, walked = 0, nextRest = 9;
  let home = false, started = false; // home: asleep in the hammock for the night
  const DUR = { bark: 2.6, sniff: 3.2, rest: 3.2, pet: 3.6 };
  // how high his paws are off the pavement at x, whether he's in the air, and how much faster he goes across (a bound covers ground)
  const REACH = 24 * scale; // hind paws to front paws
  const arc = (u: number, from: number, to: number, apex: number) => from + (to - from) * u + apex * 4 * u * (1 - u);
  const lift = (px: number): { y: number; air: boolean; pace: number } => {
    for (const h of hops) {
      if (h.top > 0) {
        const a = h.x0 - REACH, b = h.x0 + 6, c = h.x1 - REACH - 6, d = h.x1; // up when his front paws reach the seat, down off the far end
        if (px >= a && px < b) return { y: arc((px - a) / (b - a), 0, h.top, 8), air: true, pace: 1.5 };
        if (px >= b && px < c) return { y: h.top, air: false, pace: 1 };
        if (px >= c && px < d) return { y: arc((px - c) / (d - c), h.top, 0, 5), air: true, pace: 1.5 };
      } else {
        const a = h.x0 - REACH - 4, b = h.x1 + 4;
        if (px >= a && px < b) return { y: arc((px - a) / (b - a), 0, 0, 18), air: true, pace: 2.6 };
      }
    }
    return { y: 0, air: false, pace: 1 };
  };
  let catSeen = false; // already decided whether to bark at Angel this time he passes her
  let met = false, headAt: Vec = [0, 0]; // met: already stopped for Ora this time round; headAt: his head in scene space, for her hand
  dog.addEventListener('pointerdown', () => { if (!mode) { mode = 'bark'; modeT = 0; } });
  cat.addEventListener('pointerdown', () => { if (cmode !== 'meow') { cmode = 'meow'; cmodeT = 0; cdur = 2.4; } });

  return {
    x: () => x,
    step(t, dt, wind, tau) {
      // after sunset he heads home: in through the gate when he next reaches it, then asleep in the hammock till morning
      const night = isNight(tau);
      if (bed && night && !home && !started) { home = true; bed.show(true); }
      if (bed && !night && home) { home = false; bed.show(false); x = bed.gate; sniffed = true; mode = null; }
      started = true;
      dog.style.display = home ? 'none' : '';
      if (!home) {
      const before = x;
      const hop = lift(x), gy = ground - hop.y;
      if (!mode && !hop.air && !sniffed && x > sniffAt) { mode = 'sniff'; modeT = 0; sniffed = true; }
      if (friend) {
        // trotting right into Ora walking left: he stops with his head just short of her and she pets him
        const gap = friend.x() - x;
        if (!mode && !hop.air && !met && gap > 52 && gap < 72 && friend.free()) { mode = 'pet'; modeT = 0; met = true; friend.pet(() => headAt, DUR.pet); }
        if (met && Math.abs(gap) > 120) met = false;
      }
      walked += dt * go;
      const catGap = cx - x - REACH; // Angel ahead of his nose
      if (!mode && !hop.air && !catSeen && catGap > 0 && catGap < 30 && cmode !== 'nap') { catSeen = true; mode = 'bark'; modeT = 0; }
      if (catSeen && Math.abs(catGap) > 120) catSeen = false;
      if (!mode && !hop.air && walked > nextRest && x > 0 && x < width) { mode = 'rest'; modeT = 0; walked = 0; nextRest = 10 + Math.random() * 8; }
      if (mode) { modeT += dt; if (modeT > DUR[mode]) mode = null; }
      go += ((mode ? 0 : 1) - go) * Math.min(1, dt * 3);
      phase += (dt / trot.period) * go * (hop.air ? 0.15 : 1); // legs held out through a jump
      x += trot.speed * scale * dt * go * hop.pace;
      if (x > width + 90) { x = -90; sniffed = false; }
      if (bed && night && before < bed.gate && x >= bed.gate) { home = true; bed.show(true); }
      place(dog, x, gy, 1, scale);

      // hind legs on the gait, front legs a quarter cycle later
      const hp = trot.pose(phase, go), fp = trot.pose(phase + 0.25, go);
      const sitE = mode === 'rest' || mode === 'pet' ? Math.min(1, modeT * 2.2, (DUR[mode] - modeT) * 2.2) : 0;
      const sit = sitE * sitE * (3 - 2 * sitE);
      const H: Vec = [hp.hip[0] + sit * 5, hp.hip[1] + sit * 9], S: Vec = [64 - sit * 2, fp.hip[1] - sit * 4.5];
      const sniff = mode === 'sniff' ? Math.min(1, modeT * 2, (DUR.sniff - modeT) * 2) : 0;
      const barkK = mode === 'bark' ? bump(modeT - 0.35) + bump(modeT - 1.0) + bump(modeT - 1.6) : 0;
      const nod = sniff * 6 - barkK * 2.4 + fp.bob * 0.5 + 1.5 * go - (mode === 'pet' ? sit * 5 : 0); // looking up at her while she pets him // nose a little low on the trot
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

      const fast = mode === 'bark' || mode === 'pet';
      const wag = tailWag.step(Math.sin(t * (fast ? 20 : 8)) * (fast ? 26 : 10), dt);
      const T: Vec = [H[0] - 4.6, H[1] - 3.6], tTip = hang(T, 11, 196 + wag * 1.3 + sit * 70);
      tail.draw([T, hang(T, 6, 206 + wag + sit * 50), tTip], [0, 0]);
      tailTip.setAttribute('d', oval(tTip[0], tTip[1], 1.3, 1.3));

      headAt = toScene(x, gy, 1, Hd[0] + 1, Hd[1] - 3.6, scale);
      const ms = toScene(x, gy, 1, Hd[0] + 6, Hd[1] - 9, scale);
      woof.setAttribute('x', f(ms[0])); woof.setAttribute('y', f(ms[1]));
      woof.setAttribute('opacity', f(Math.min(1, barkK * 1.6)));
      }

      // ---------- the cat: open strokes, single-stroke legs with ink-dot feet
      nextPause -= dt * cgo;
      if (!cmode && nextPause <= 0) {
        cmode = Math.random() < 0.25 ? 'nap' : 'pause'; cmodeT = 0; nextPause = 6 + Math.random() * 12;
        cdur = cmode === 'nap' ? 100 + Math.random() * 80 : 2 + Math.random() * 4;
      }
      if (cmode) { cmodeT += dt; if (cmodeT > cdur) { if (cmode !== 'meow' && Math.random() < 0.45) cdir = -cdir as 1 | -1; cmode = null; } }
      cgo += ((cmode ? 0 : 1) - cgo) * Math.min(1, dt * 2.5);
      catPhase += (dt / catWalk.period) * cgo;
      cx += cdir * catWalk.speed * scale * dt * cgo;
      if (cx < W.x0 || cx > W.x1) { cx = Math.max(W.x0, Math.min(W.x1, cx)); cdir = -cdir as 1 | -1; } // turn at the end of the wall
      place(cat, cx, W.y, cdir, scale);
      // napping: she settles down into a loaf, head low, eyes shut, tail wrapped round
      const napE = cmode === 'nap' ? Math.min(1, cmodeT / 1.4, (cdur - cmodeT) / 1.4) : 0, nap = napE * napE * (3 - 2 * napE);
      const ch = catWalk.pose(catPhase, cgo), cf = catWalk.pose(catPhase + 0.25, cgo);
      const CH: Vec = [ch.hip[0], ch.hip[1] + nap * 4.4], CS: Vec = [58, cf.hip[1] + nap * 4];
      const meowK = cmode === 'meow' ? bump(cmodeT - 0.3, 0.6) + bump(cmodeT - 1.3, 0.6) : 0;
      const catLegs = (i: number) => {
        const front: Vec = [cf.feet[i].ankle[0] + 18, cf.feet[i].ankle[1]];
        return { hind: [CH, ch.feet[i].knee, ch.feet[i].ankle], fore: [CS, joint(CS, front, CAT_BONE, CAT_BONE, -1), front] };
      };
      const stroke = (n: SVGPathElement, pts: Vec[]) => n.setAttribute('d', `M${f(pts[0][0])} ${f(pts[0][1])} Q${f(pts[1][0])} ${f(pts[1][1])} ${f(pts[2][0])} ${f(pts[2][1])}`);
      const dotFeet = (nodes: SVGPathElement[], legs: Vec[][]) => nodes.forEach((n, j) => n.setAttribute('d', oval(legs[j][2][0] + 0.6, legs[j][2][1] + 0.2, 1.2, 0.8)));
      const cFar = catLegs(1), cNear = catLegs(0);
      stroke(catFar[0], cFar.hind); stroke(catFar[1], cFar.fore); dotFeet(catFarFeet, [cFar.hind, cFar.fore]);
      stroke(catNear[0], cNear.hind); stroke(catNear[1], cNear.fore); dotFeet(catNearFeet, [cNear.hind, cNear.fore]);
      for (const n of [...catFar, ...catNear, ...catFarFeet, ...catNearFeet]) n.style.opacity = f(1 - nap); // legs tuck under
      const cm = (CH[1] + CS[1]) / 2;
      const backD = `M${f(CH[0] - 3.4)} ${f(CH[1] - 1)} Q${f(CH[0] - 2)} ${f(CH[1] - 4.6)} ${f(48)} ${f(cm - 5.4)} Q${f(CS[0] - 2)} ${f(CS[1] - 5)} ${f(CS[0] + 2)} ${f(CS[1] - 4)}`;
      const bellyD = `M${f(CS[0] + 2.6)} ${f(CS[1] + 1.4)} Q${f(48)} ${f(cm + 4.4)} ${f(CH[0] + 1)} ${f(CH[1] + 2.4)}`;
      catBack.setAttribute('d', backD);
      catBelly.setAttribute('d', bellyD);
      catFill.setAttribute('d', backD + ` L${f(CS[0] + 2.6)} ${f(CS[1] + 1.4)} ` + bellyD.slice(bellyD.indexOf('Q')) + 'Z');
      const cnod = cf.bob * 0.4 - meowK * 1.6 + nap * 2.6;
      const C: Vec = [CS[0] + 5, CS[1] - 6.4 + cnod];
      catHead.setAttribute('d', oval(C[0], C[1], 3.4, 2.9));
      catEars.setAttribute('d', `M${f(C[0] - 2.6)} ${f(C[1] - 1.6)} L${f(C[0] - 2.2)} ${f(C[1] - 5.2)} L${f(C[0] - 0.4)} ${f(C[1] - 2.6)}Z M${f(C[0] + 0.6)} ${f(C[1] - 2.7)} L${f(C[0] + 2.4)} ${f(C[1] - 5.4)} L${f(C[0] + 2.8)} ${f(C[1] - 1.8)}Z`);
      catNose.setAttribute('d', oval(C[0] + 3.2, C[1] + 0.4, 0.6, 0.5));
      catEye.setAttribute('d', nap > 0.5 ? `M${f(C[0] + 0.6)} ${f(C[1] - 0.6)} q0.8 0.6 1.6 0 l0 0.3 q-0.8 0.6 -1.6 0Z` : oval(C[0] + 1.4, C[1] - 0.6, 0.4, 0.4));
      const sway = catTailSway.step(wind * 6 + Math.sin(t * 1.7) * 6 + (cmode ? 10 : 0), dt);
      const CT: Vec = [CH[0] - 3, CH[1] - 1.6];
      // napping, the tail comes round over her back and lies forward along the wall by her feet
      catTail.draw([CT, hang(CT, 7, (200 + sway) * (1 - nap) + 60 * nap), hang(CT, 13, (172 + sway * 1.4) * (1 - nap) + 84 * nap)], [0, 0]);
      zs.forEach((z, i) => {
        const k = (t / 3 + i / 3) % 1, [zx, zy] = toScene(cx, W.y, cdir, C[0] + 2 + k * 6, C[1] - 5 - k * 12, scale);
        z.setAttribute('x', f(zx)); z.setAttribute('y', f(zy)); z.setAttribute('opacity', f(nap * Math.sin(Math.PI * k)));
      });
      const mm = toScene(cx, W.y, cdir, C[0] + 3, C[1] - 6, scale);
      meow.setAttribute('x', f(mm[0])); meow.setAttribute('y', f(mm[1]));
      meow.setAttribute('opacity', f(Math.min(1, meowK * 1.6)));
    },
  };
}
