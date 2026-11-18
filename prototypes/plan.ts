// The street seen from above, drawn in ink: the road, each lot with its roof, trees and
// name. Lives in an overlay box on the card; opening zooms out from a house, picking a
// house zooms into it.
import { el, pen, shape, f } from '../lib/ink.ts';
import { seeded } from '../lib/motion.ts';
import type { Placed } from '../src/app.ts';
import { emblem, BOX, STYLES, type Style } from './emblems.ts';

export interface Plan { open(from: number): void; close(into: number): void; isOpen(): boolean }

export function plan(box: HTMLElement, placed: Placed[], width: number, onPick: (i: number) => void): Plan {
  const MH = 440, ROAD = 330, rand = seeded(11);
  // ?emblem=sketch|stamp|detail puts each house's emblem in its lot instead of the generic roof and trees
  const style = new URLSearchParams(location.search).get('emblem') as Style | null, mark = style && STYLES.includes(style) ? style : null;
  box.style.cssText = 'position:absolute;inset:0;background:var(--paper);transition:opacity .45s ease, transform .6s cubic-bezier(.3,.7,.2,1);opacity:0;pointer-events:none;transform:scale(2.6)';
  const svg = el('svg', { viewBox: `0 -20 ${width} ${MH + 20}`, width: '100%', height: '100%', style: 'color:#2a2620;display:block' }, box);
  const P = (d: string, w = 1.2) => { const n = pen(svg, w); n.setAttribute('d', d); return n; };
  P(`M0 ${ROAD} L${width} ${ROAD} M0 ${ROAD + 70} L${width} ${ROAD + 70}`, 1.6);
  P(Array.from({ length: Math.ceil(width / 80) }, (_, i) => `M${i * 80 + 20} ${ROAD + 35} l40 0`).join(' '), 1);
  const lots = placed.map((p, i) => {
    const g = el('g', { style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': `Go to ${p.name}` }, svg);
    el('title', {}, g).textContent = p.name;
    el('rect', { x: p.x0, y: -20, width: p.width, height: ROAD + 20, fill: 'transparent' }, g);
    const fence = pen(g, 0.8);
    fence.setAttribute('d', `M${p.x0 + 6} ${ROAD - 8} L${p.x0 + 6} 40 L${p.x0 + p.width - 6} 40 L${p.x0 + p.width - 6} ${ROAD - 8}`);
    fence.setAttribute('stroke-dasharray', '6 5');
    if (mark) { const sc = 270 / BOX.h; emblem(g, p.name, mark, p.x0 + (p.width - BOX.w * sc) / 2, 50, sc); }
    else {
      const hx = p.x0 + p.width * 0.28, hw = p.width * 0.44, hy = 110, hh = 130;
      shape(g, 1.4).setAttribute('d', `M${hx} ${hy} L${hx + hw} ${hy} L${hx + hw} ${hy + hh} L${hx} ${hy + hh}Z`);
      pen(g, 0.9).setAttribute('d', i % 2 ? `M${hx} ${hy} L${hx + hw / 2} ${hy + hh / 2} L${hx + hw} ${hy} M${hx} ${hy + hh} L${hx + hw / 2} ${hy + hh / 2} L${hx + hw} ${hy + hh}` : `M${hx + 8} ${hy + 8} L${hx + hw - 8} ${hy + 8} L${hx + hw - 8} ${hy + hh - 8} L${hx + 8} ${hy + hh - 8}Z`);
      for (let k = 0; k < 3; k++) {
        const cx = p.x0 + rand(40, p.width - 40), cy = rand(60, 280), r = rand(28, 48), pts: string[] = [];
        for (let a = 0; a <= 48; a++) { const t = (a / 48) * Math.PI * 2, rr = r * (0.9 + 0.12 * Math.abs(Math.sin(t * 4.5))); pts.push(`${f(cx + rr * Math.cos(t))} ${f(cy + rr * Math.sin(t))}`); }
        shape(g, 1).setAttribute('d', 'M' + pts.join('L') + 'Z');
      }
    }
    const label = el('text', { x: p.x0 + p.width / 2, y: 22, 'text-anchor': 'middle', 'font-size': 26, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: 'currentColor' }, g);
    label.textContent = p.name;
    g.addEventListener('click', () => onPick(i));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(i); } });
    return { g, fence };
  });
  let shown = false;
  const origin = (i: number) => { box.style.transformOrigin = `${((placed[i].x0 + placed[i].width / 2) / width) * 100}% 45%`; };
  return {
    isOpen: () => shown,
    open(from) {
      lots.forEach((l, i) => { l.fence.setAttribute('stroke-dasharray', i === from ? 'none' : '6 5'); l.fence.setAttribute('stroke-width', i === from ? '1.6' : '0.8'); });
      origin(from);
      shown = true;
      box.style.pointerEvents = 'auto'; box.style.opacity = '1'; box.style.transform = 'scale(1)';
    },
    close(into) {
      origin(into);
      shown = false;
      box.style.pointerEvents = 'none'; box.style.opacity = '0'; box.style.transform = 'scale(2.6)';
    },
  };
}
