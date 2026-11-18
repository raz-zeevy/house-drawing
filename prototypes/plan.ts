// The street as a map, drawn in ink: on a wide card the road from above with each lot's
// stamp and name, on a tall one (a phone) a dotted walk down the page from stamp to stamp. Lives in an overlay box on the card; opening zooms out from a house, picking a
// house zooms into it.
import { el, pen, f } from '../lib/ink.ts';
import type { Placed } from '../src/app.ts';
import { emblem, BOX, STYLES, type Style } from './emblems.ts';

export interface Plan { open(from: number): void; close(into: number): void; isOpen(): boolean }

export function plan(box: HTMLElement, placed: Placed[], width: number, onPick: (i: number) => void): Plan {
  const MH = 440, ROAD = 330;
  // each lot shows its house's stamp; ?emblem=sketch|detail shows the other prototype styles
  const style = new URLSearchParams(location.search).get('emblem') as Style | null, mark: Style = style && STYLES.includes(style) ? style : 'stamp', EM = 270 / BOX.h;
  box.style.cssText = 'position:absolute;inset:0;background:var(--paper);transition:opacity .45s ease, transform .6s cubic-bezier(.3,.7,.2,1);opacity:0;pointer-events:none;transform:scale(2.6)';
  const INK = 'color:#2a2620;display:block', TRAIL = 'color:#8e3b2c';
  const button = (svg: Element, name: string, i: number) => {
    const g = el('g', { style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': `Go to ${name}` }, svg);
    el('title', {}, g).textContent = name;
    g.addEventListener('click', () => onPick(i));
    g.addEventListener('keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); onPick(i); } });
    return g;
  };
  let current = (_from: number) => {}, origin = (_i: number) => {}, drawn = '';

  // A wide card: the street from above, side to side, the lot you came from fenced solid.
  function street(): void {
    const svg = el('svg', { viewBox: `0 -20 ${width} ${MH + 20}`, width: '100%', height: '100%', style: INK }, box);
    const P = (d: string, w = 1.2) => { const n = pen(svg, w); n.setAttribute('d', d); return n; };
    P(`M0 ${ROAD} L${width} ${ROAD} M0 ${ROAD + 70} L${width} ${ROAD + 70}`, 1.6);
    P(Array.from({ length: Math.ceil(width / 80) }, (_, i) => `M${i * 80 + 20} ${ROAD + 35} l40 0`).join(' '), 1);
    const fences = placed.map((p, i) => {
      const g = button(svg, p.name, i);
      el('rect', { x: p.x0, y: -20, width: p.width, height: ROAD + 20, fill: 'transparent' }, g);
      const fence = pen(g, 0.8);
      fence.setAttribute('d', `M${p.x0 + 6} ${ROAD - 8} L${p.x0 + 6} 40 L${p.x0 + p.width - 6} 40 L${p.x0 + p.width - 6} ${ROAD - 8}`);
      emblem(g, p.name, mark, p.x0 + (p.width - BOX.w * EM) / 2, 50, EM);
      const label = el('text', { x: p.x0 + p.width / 2, y: 22, 'text-anchor': 'middle', 'font-size': 26, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: 'currentColor' }, g);
      label.textContent = p.name;
      return fence;
    });
    current = (from) => fences.forEach((f, i) => { f.setAttribute('stroke-dasharray', i === from ? 'none' : '6 5'); f.setAttribute('stroke-width', i === from ? '1.6' : '0.8'); });
    origin = (i) => { box.style.transformOrigin = `${((placed[i].x0 + placed[i].width / 2) / width) * 100}% 45%`; };
  }

  // A tall card (a phone): a dotted walk winding down the page from house to house, like
  // the map on the button, with a pin by the house you came from. A long street scrolls.
  function walk(): void {
    const n = placed.length, W = 400, fit = (W * box.clientHeight) / box.clientWidth, rh = Math.max(fit / n, 150), H = rh * n, d = Math.min(rh - 12, 142);
    const svg = el('svg', { viewBox: `0 0 ${W} ${f(H)}`, width: '100%', style: `${INK};aspect-ratio:${W}/${f(H)}` }, box);
    const at = (i: number) => ({ x: i % 2 ? 272 : 128, y: (i + 0.5) * rh });
    let way = `M${at(0).x + 90} -10 Q${at(0).x + 70} ${f(at(0).y - 40)} ${at(0).x} ${f(at(0).y)}`;
    for (let i = 1; i < n; i++) { const a = at(i - 1), b = at(i); way += ` C${a.x} ${f(a.y + rh * 0.62)} ${b.x} ${f(b.y - rh * 0.62)} ${b.x} ${f(b.y)}`; }
    way += ` Q${at(n - 1).x} ${f(H - 20)} ${W - at(n - 1).x} ${f(H + 10)}`;
    const trail = pen(svg, 2.2);
    trail.setAttribute('d', way); trail.setAttribute('stroke-dasharray', '1 9'); trail.setAttribute('style', TRAIL);
    const pins = placed.map((p, i) => {
      const g = button(svg, p.name, i), c = at(i), tx = i % 2 ? 100 : 300;
      el('rect', { x: 0, y: i * rh, width: W, height: rh, fill: 'transparent' }, g);
      el('circle', { cx: c.x, cy: c.y, r: d / 2 + 5, fill: '#fdfcf8' }, g); // the trail passes behind the stamp
      emblem(g, p.name, mark, c.x - (BOX.w / 2) * (d / 96), c.y - (BOX.h / 2) * (d / 96), d / 96);
      const words = p.name.split(' '), last = words.length > 1 ? words.pop()! : '';
      [words.join(' '), last].forEach((w, k) => {
        const t = el('text', { x: tx, y: c.y - 4 + k * 28, 'text-anchor': 'middle', 'font-size': 22, 'font-family': "'Architects Daughter', cursive", fill: 'currentColor' }, g);
        t.textContent = w;
      });
      const pin = pen(g, 1.5);
      pin.setAttribute('d', `M${tx} ${f(c.y + 62)} l0 -8 M${tx} ${f(c.y + 54)} c-9 -9 -9 -20 0 -20 c9 0 9 11 0 20Z`);
      pin.setAttribute('style', TRAIL);
      return pin;
    });
    current = (from) => pins.forEach((pin, i) => { pin.style.display = i === from ? '' : 'none'; });
    origin = (i) => {
      const k = box.clientWidth / W, y = at(i).y * k;
      box.scrollTop = y - box.clientHeight / 2;
      box.style.transformOrigin = `${(at(i).x / W) * 100}% ${f(y - box.scrollTop)}px`;
    };
  }

  // drawn for the card's shape, and again if that has changed by the next opening
  function draw(): void {
    const tall = box.clientHeight > box.clientWidth, key = tall ? `walk ${box.clientWidth}x${box.clientHeight}` : 'street';
    if (key === drawn) return;
    drawn = key;
    box.replaceChildren();
    box.style.overflowY = tall ? 'auto' : 'hidden'; box.style.touchAction = tall ? 'pan-y' : '';
    (tall ? walk : street)();
  }
  draw();
  let shown = false;
  return {
    isOpen: () => shown,
    open(from) {
      draw();
      current(from);
      origin(from);
      shown = true;
      box.style.pointerEvents = 'auto'; box.style.opacity = '1'; box.style.transform = 'scale(1)';
    },
    close(into) {
      draw();
      origin(into);
      shown = false;
      box.style.pointerEvents = 'none'; box.style.opacity = '0'; box.style.transform = 'scale(2.6)';
    },
  };
}
