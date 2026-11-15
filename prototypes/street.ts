// A: one long street. The window follows the dog along all the houses; drag or swipe
// to look around; the row of names underneath is a map of the street: it shows where
// the window is, and clicking a name glides there.
import { mountStreet } from '../src/app.ts';
import type { View } from '../src/camera.ts';
import { LOTS, stage, hint } from './lots.ts';

const nav = document.querySelector<HTMLElement>('#nav')!;
let view: View = { x: 0, y: 0, w: 1, h: 1 };
const { camera, placed, width } = mountStreet({
  stage, lots: LOTS, label: 'A street of houses drawn in ink',
  onFit: () => hint('Drag or swipe along the street, or pick a house below. Click the trees, the gate, the dog or the cat.'),
  onView: (v) => {
    view = v;
    const mid = v.x + v.w / 2;
    buttons.forEach((b, i) => b.setAttribute('aria-current', String(mid >= placed[i].x0 && mid < placed[i].x0 + placed[i].width)));
  },
});
const buttons = placed.map((p) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = p.name;
  b.style.flex = String(p.width / width);
  b.addEventListener('click', () => camera.goTo(p.x0 + p.width / 2 - view.w / 2));
  nav.append(b);
  return b;
});
