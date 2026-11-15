// B: map first. A hand-drawn plan of the street from above: the road, each lot with its
// roof, trees and name. Tapping a house zooms the map into it and opens the street
// view at that house; "Back to the map" zooms out again.
import { el, pen, shape, f } from '../lib/ink.ts';
import { seeded } from '../lib/motion.ts';
import { mountStreet } from '../src/app.ts';
import { LOTS, stage, hint } from './lots.ts';

const mapBox = document.querySelector<HTMLElement>('#map')!, back = document.querySelector<HTMLButtonElement>('#back')!;
let viewW = 1;
const { camera, placed, width } = mountStreet({
  stage, lots: LOTS, label: 'A street of houses drawn in ink',
  onFit: () => {}, onView: (v) => { viewW = v.w; },
});

// ---------- the plan: 1 map unit = 1 street unit across, the depth squashed
const MH = 440, ROAD = 330, rand = seeded(11);
mapBox.style.cssText = 'position:absolute;inset:0;background:var(--paper);transition:opacity .5s ease, transform .6s cubic-bezier(.3,.7,.2,1);transform-origin:50% 50%';
const svg = el('svg', { viewBox: `0 0 ${width} ${MH}`, width: '100%', height: '100%', style: 'color:#2a2620;display:block' }, mapBox);
const P = (d: string, w = 1.2) => { const n = pen(svg, w); n.setAttribute('d', d); return n; };
P(`M0 ${ROAD} L${width} ${ROAD} M0 ${ROAD + 70} L${width} ${ROAD + 70}`, 1.6);
P(Array.from({ length: Math.ceil(width / 80) }, (_, i) => `M${i * 80 + 20} ${ROAD + 35} l40 0`).join(' '), 1);
placed.forEach((p, i) => {
  const g = el('g', { style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': `Open ${p.name}` }, svg);
  el('title', {}, g).textContent = p.name;
  el('rect', { x: p.x0, y: 0, width: p.width, height: ROAD, fill: 'transparent' }, g);
  P(`M${p.x0 + 6} ${ROAD - 8} L${p.x0 + 6} 40 L${p.x0 + p.width - 6} 40 L${p.x0 + p.width - 6} ${ROAD - 8}`, 0.8).setAttribute('stroke-dasharray', '6 5');
  const hx = p.x0 + p.width * 0.28, hw = p.width * 0.44, hy = 110, hh = 130;
  shape(g, 1.4).setAttribute('d', `M${hx} ${hy} L${hx + hw} ${hy} L${hx + hw} ${hy + hh} L${hx} ${hy + hh}Z`);
  const ridge = pen(g, 0.9);
  ridge.setAttribute('d', i % 2 ? `M${hx} ${hy} L${hx + hw / 2} ${hy + hh / 2} L${hx + hw} ${hy} M${hx} ${hy + hh} L${hx + hw / 2} ${hy + hh / 2} L${hx + hw} ${hy + hh}` : `M${hx + 8} ${hy + 8} L${hx + hw - 8} ${hy + 8} L${hx + hw - 8} ${hy + hh - 8} L${hx + 8} ${hy + hh - 8}Z`);
  for (let k = 0; k < 3; k++) {
    const cx = p.x0 + rand(40, p.width - 40), cy = rand(60, 280), r = rand(28, 48), pts: string[] = [];
    for (let a = 0; a <= 48; a++) { const t = (a / 48) * Math.PI * 2, rr = r * (0.9 + 0.12 * Math.abs(Math.sin(t * 4.5))); pts.push(`${f(cx + rr * Math.cos(t))} ${f(cy + rr * Math.sin(t))}`); }
    shape(g, 1).setAttribute('d', 'M' + pts.join('L') + 'Z');
  }
  const label = el('text', { x: p.x0 + p.width / 2, y: 26, 'text-anchor': 'middle', 'font-size': 24, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: 'currentColor' }, g);
  label.textContent = p.name;
  const open = () => {
    mapBox.style.transformOrigin = `${((p.x0 + p.width / 2) / width) * 100}% 45%`;
    mapBox.style.transform = 'scale(2.6)';
    mapBox.style.opacity = '0';
    mapBox.style.pointerEvents = 'none';
    camera.goTo(p.x0 + p.width / 2 - viewW / 2);
    back.hidden = false;
    hint('Drag along the street to visit the neighbours, or go back to the map.');
  };
  g.addEventListener('click', open);
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});
back.addEventListener('click', () => {
  mapBox.style.transform = 'scale(1)'; mapBox.style.opacity = '1'; mapBox.style.pointerEvents = 'auto';
  back.hidden = true;
  hint('Tap a house to walk into it.');
});
hint('Tap a house to walk into it.');
