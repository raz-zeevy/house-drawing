// On screens narrower than the street's shape, the viewBox becomes a window of the
// stage's own shape that follows a target (the dog). Swipe pans it; pinch widens it up
// to 1.8 street-heights tall, the extra height going mostly to sky, some to road.
import { f } from '../lib/ink.ts';
import { clamp } from '../lib/motion.ts';
import { H } from './kit.ts';

/** The visible part of the street, in street units. */
export interface View { x: number; y: number; w: number; h: number }

export function camera(svg: SVGSVGElement, stage: HTMLElement, width: number, onFit: (narrow: boolean) => void): { narrow(): boolean; step(t: number, dt: number, followX: number): View } {
  let fitW = width, maxW = width, aspect = 1, viewW = 0, camX = 0, swipedAt = -99, now = 0, dragX: number | null = null;
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
    if (touches.size === 2) { pinch = { d: spread(), w: viewW }; dragX = null; } else dragX = e.clientX;
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
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, (e) => { touches.delete((e as PointerEvent).pointerId); if (touches.size < 2) pinch = null; dragX = null; });

  return {
    narrow,
    step(t, dt, followX) {
      now = t;
      if (!narrow()) return full;
      if (t - swipedAt > 4) camX += (clamp(followX - viewW * 0.4, 0, width - viewW) - camX) * Math.min(1, dt * 0.8);
      camX = clamp(camX, 0, width - viewW);
      const h = Math.max(H, viewW * aspect), y = -(h - H) * 0.6;
      svg.setAttribute('viewBox', `${f(camX)} ${f(y)} ${f(viewW)} ${f(h)}`);
      return { x: camX, y, w: viewW, h };
    },
  };
}
