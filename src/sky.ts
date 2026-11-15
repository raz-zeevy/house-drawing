// Sky gradient (reaching far above the card), plus a sun and a moon that only a
// zoomed-out phone sees. Trees, drawn later, hide them as they rise and set.
import { el, f } from '../lib/ink.ts';
import { smooth } from '../lib/motion.ts';
import { mix, rgb, toRGB, type Palette } from '../lib/daynight.ts';
import { H, SP, WARM } from './kit.ts';
import type { View } from './camera.ts';

const SUN_DAY = toRGB('#f3cf7c'), SUN_DUSK = toRGB('#e8875a');

export function sky(svg: SVGSVGElement, defs: SVGDefsElement, width: number): { paint(pal: Palette): void; place(view: View, tau: number, pal: Palette): void } {
  const grad = el('linearGradient', { id: 'h-sky', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: H }, defs);
  const top = el('stop', { offset: 0 }, grad), bottom = el('stop', { offset: 1 }, grad);
  el('rect', { x: -20, y: -1600, width: width + 40, height: H + 1600, fill: 'url(#h-sky)' }, svg);

  const sunG = el('g', { opacity: 0, 'pointer-events': 'none' }, svg);
  const sun = el('circle', { r: 15, stroke: 'currentColor', 'stroke-width': SP }, sunG);
  const rays: string[] = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 25 : 28; rays.push(`M${f(Math.cos(a) * 20)} ${f(Math.sin(a) * 20)} L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`); }
  el('path', { d: rays.join(' '), fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.8, 'stroke-linecap': 'round' }, sunG);
  const moonG = el('g', { opacity: 0, 'pointer-events': 'none' }, svg);
  const moon = el('path', { d: 'M2 -12 A12 12 0 1 0 2 12 A9.4 9.4 0 1 1 2 -12Z', stroke: 'currentColor', 'stroke-width': SP * 0.6 }, moonG);

  return {
    paint(pal) {
      top.setAttribute('stop-color', rgb(pal.top));
      bottom.setAttribute('stop-color', rgb(pal.bottom));
    },
    // far away, so they keep their place in the window while it pans; arc from the horizon (behind the trees) to the top
    place(view, tau, pal) {
      const extra = view.h - H, show = smooth(30, 110, extra);
      const arc = (u: number) => `translate(${f(view.x + view.w * (0.12 + 0.76 * u))} ${f(view.y + 34 + (1 - Math.sin(Math.PI * u)) * (-view.y + 6))})`;
      const sunU = (tau - 0.25) / 0.5, moonU = ((((tau - 0.75) % 1) + 1) % 1) / 0.5;
      const sunUp = sunU > 0 && sunU < 1, moonUp = moonU > 0 && moonU < 1;
      sunG.setAttribute('opacity', f(sunUp ? show : 0));
      moonG.setAttribute('opacity', f(moonUp ? show : 0));
      if (sunUp && show) { sunG.setAttribute('transform', arc(sunU)); sun.setAttribute('fill', rgb(mix(SUN_DAY, SUN_DUSK, pal.sunset))); }
      if (moonUp && show) { moonG.setAttribute('transform', arc(moonU)); moon.setAttribute('fill', rgb(mix(pal.ink, WARM, 0.12))); }
    },
  };
}
