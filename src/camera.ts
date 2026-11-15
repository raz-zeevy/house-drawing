// When the stage is narrower than the street's shape (a phone, or a street of several
// houses), the viewBox becomes a window of the stage's own shape. It follows a target
// (the dog), or with `pages` (house centres) it snaps from house to house. Swipe or drag pans it; pinch
// widens it up to 1.8 street-heights tall, the extra going mostly to sky, some to road;
// `goTo(x)` glides to a spot and stays there until the next swipe.
import { f } from '../lib/ink.ts';
import { clamp } from '../lib/motion.ts';
import { H } from './kit.ts';

/** The visible part of the street, in street units. */
export interface View { x: number; y: number; w: number; h: number }

export interface Camera { narrow(): boolean; goTo(x: number): void; step(t: number, dt: number, followX: number): View }

export function camera(svg: SVGSVGElement, stage: HTMLElement, width: number, onFit: (narrow: boolean) => void, pages?: number[]): Camera {
  let fitW = width, maxW = width, aspect = 1, viewW = 0, camX = 0, swipedAt = -99, now = 0, dragX: number | null = null, aim: number | null = null, dragFrom = 0;
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
  // centre the page nearest the window's centre, or the next one over after a decisive drag
  const snap = (moved: number) => {
    const ps = pages!, mid = camX + viewW / 2, was = dragFrom + viewW / 2;
    const nearest = (x: number) => ps.reduce((best, p, j) => (Math.abs(p - x) < Math.abs(ps[best] - x) ? j : best), 0);
    const i = nearest(mid), from = nearest(was);
    const to = i === from && Math.abs(moved) > viewW * 0.12 ? clamp(i + Math.sign(moved), 0, ps.length - 1) : i;
    return ps[to] - viewW / 2;
  };

  return {
    narrow,
    goTo(x) { aim = x; },
    step(t, dt, followX) {
      now = t;
      if (!narrow()) return full;
      if (aim !== null) camX += (clamp(aim, 0, width - viewW) - camX) * Math.min(1, dt * 2.5);
      else if (!pages && t - swipedAt > 4) camX += (clamp(followX - viewW * 0.4, 0, width - viewW) - camX) * Math.min(1, dt * 0.8);
      camX = clamp(camX, 0, width - viewW);
      const h = Math.max(H, viewW * aspect), y = -(h - H) * 0.6;
      svg.setAttribute('viewBox', `${f(camX)} ${f(y)} ${f(viewW)} ${f(h)}`);
      return { x: camX, y, w: viewW, h };
    },
  };
}
