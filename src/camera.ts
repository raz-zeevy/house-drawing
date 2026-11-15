// When the stage is narrower than the street's shape (a phone, or a street of several
// houses), the viewBox becomes a window of the stage's own shape. It follows a target
// (the dog), or with `pages` (house extents) it keeps to one house at a time: inside a house wider
// than the window you pan freely, and swiping past its edge moves to the neighbour. Swipe or drag pans it; pinch
// widens it up to 1.8 street-heights tall, the extra going mostly to sky, some to road;
// `goTo(x)` glides to a spot and stays there until the next swipe. On load it opens close in
// and then eases out to the widest view, unless a touch gets there first.
import { f } from '../lib/ink.ts';
import { clamp } from '../lib/motion.ts';
import { H } from './kit.ts';

/** The visible part of the street, in street units. */
export interface View { x: number; y: number; w: number; h: number }

export interface Camera { narrow(): boolean; goTo(x: number): void; step(t: number, dt: number, followX: number): View }

export function camera(svg: SVGSVGElement, stage: HTMLElement, width: number, onFit: (narrow: boolean) => void, pages?: [number, number][]): Camera {
  let intro = true, introFrom: number | null = null, fitW = width, maxW = width, aspect = 1, viewW = 0, camX = 0, swipedAt = -99, now = 0, dragX: number | null = null, aim: number | null = null, dragFrom = 0;
  const narrow = () => fitW < width - 1;
  const full: View = { x: 0, y: 0, w: width, h: H };
  function fit(): void {
    const r = stage.getBoundingClientRect();
    aspect = r.width && r.height ? r.height / r.width : H / width;
    fitW = Math.min(width, H / aspect);
    maxW = Math.min(width, (1.8 * H) / aspect);
    viewW = clamp(viewW, fitW, maxW);
    if (!narrow()) svg.setAttribute('viewBox', `0 0 ${width} ${H}`);
    onFit(narrow());
  }
  fit();
  addEventListener('resize', fit);

  const touches = new Map<number, number>(); // pointerId -> clientX
  let pinch: { d: number; w: number } | null = null;
  const spread = () => { const xs = [...touches.values()]; return Math.max(20, Math.abs(xs[0] - xs[1])); };
  svg.addEventListener('pointerdown', (e) => {
    if (!narrow()) return;
    touches.set(e.pointerId, e.clientX);
    aim = null;
    intro = false;
    if (touches.size === 2) { pinch = { d: spread(), w: viewW }; dragX = null; } else { dragX = e.clientX; dragFrom = camX; }
  });
  addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, e.clientX);
    swipedAt = now;
    if (pinch && touches.size === 2) { viewW = clamp((pinch.w * pinch.d) / spread(), fitW, maxW); return; }
    if (dragX === null) return;
    camX -= ((e.clientX - dragX) * viewW) / stage.getBoundingClientRect().width;
    dragX = e.clientX;
  });
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, (e) => {
    if (!touches.delete((e as PointerEvent).pointerId)) return;
    if (pages && dragX !== null) aim = snap(camX - dragFrom);
    if (touches.size < 2) pinch = null;
    dragX = null;
  });
  // Stay inside the house the drag began in: a house wider than the window can be panned
  // edge to edge, a narrower one is centred. Dragging decisively past its edge (or onto
  // another house) moves to the neighbour, landing on its near edge.
  const snap = (moved: number) => {
    const ps = pages!, mid = camX + viewW / 2, was = dragFrom + viewW / 2;
    const nearest = (x: number) => ps.reduce((best, [a, b], j) => (Math.abs((a + b) / 2 - x) < Math.abs((ps[best][0] + ps[best][1]) / 2 - x) ? j : best), 0);
    const range = (j: number): [number, number] => {
      const [a, b] = ps[j];
      return b - a > viewW ? [a, b - viewW] : [(a + b) / 2 - viewW / 2, (a + b) / 2 - viewW / 2];
    };
    const from = nearest(was), [lo, hi] = range(from), slack = viewW * 0.12;
    let to = nearest(mid);
    if (to === from) {
      if (moved > 0 && camX > hi + slack) to = from + 1;
      else if (moved < 0 && camX < lo - slack) to = from - 1;
      to = clamp(to, 0, ps.length - 1);
    }
    if (to === from) return clamp(camX, lo, hi);
    const [nlo, nhi] = range(to);
    return to > from ? nlo : nhi;
  };

  return {
    narrow,
    goTo(x) { aim = x; },
    step(t, dt, followX) {
      now = t;
      if (!narrow()) return full;
      if (intro) {
        introFrom ??= t;
        if (t - introFrom > 0.6) {
          viewW += (maxW - viewW) * Math.min(1, dt * 1.4);
          if (maxW - viewW < 0.5) { viewW = maxW; intro = false; }
        }
      }
      if (aim !== null) camX += (clamp(aim, 0, width - viewW) - camX) * Math.min(1, dt * 2.5);
      else if (!pages && t - swipedAt > 4) camX += (clamp(followX - viewW * 0.4, 0, width - viewW) - camX) * Math.min(1, dt * 0.8);
      camX = clamp(camX, 0, width - viewW);
      const h = Math.max(H, viewW * aspect), y = -(h - H) * 0.6;
      svg.setAttribute('viewBox', `${f(camX)} ${f(y)} ${f(viewW)} ${f(h)}`);
      return { x: camX, y, w: viewW, h };
    },
  };
}
