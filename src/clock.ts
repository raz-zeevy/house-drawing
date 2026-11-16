// Time of day, advancing one day per `day` seconds, with the moon-to-sun slider: through
// the morning the thumb climbs toward the sun, through the afternoon and evening it slides
// back to the moon. Dragging moves within the current half of the day. The clock text
// rides above the thumb.
//
// Two times: the real clock (0 midnight, 0.5 noon), shown as text, and the drawing's
// time, which the palette, sun and moon are drawn for, with dawn at 0.25 and dusk at
// 0.75. The real day is stretched onto the drawing's so that today's actual sunrise
// and sunset at the house in view land on its dawn and dusk.
import { f } from '../lib/ink.ts';
import type { Place } from './places.ts';
import { sunTimes } from './sun.ts';

export interface Clock {
  /** The drawing's time of day at scene time `t`. */
  tau(t: number): number;
  /** Jump to a drawing time of day (dragging the sun or moon); the clock runs on from there. */
  set(tau: number): void;
  /** Follow this place's sunrise and sunset. */
  at(place: Place): void;
}

export function clock({ start, day, pinned: pin }: { start: number; day: number; pinned: number | null }): Clock {
  const input = document.querySelector<HTMLInputElement>('#time'), text = document.querySelector('#clock'), track = document.querySelector<HTMLElement>('.track');
  let pinned = pin, base = start, since = 0, now = 0, current = start, scene = start, sliding = false;
  // today's sunrise and sunset at the place in view, refreshed once a minute for the date
  let place: Place | null = null, rise = 0.25, set = 0.75, checked = -Infinity;
  const refresh = () => { if (place) ({ rise, set } = sunTimes(place)); checked = now; };
  // real time of day -> drawing time of day, and back
  const warp = (x: number) => (x < rise ? (0.25 * x) / rise : x < set ? 0.25 + (0.5 * (x - rise)) / (set - rise) : 0.75 + (0.25 * (x - set)) / (1 - set));
  const unwarp = (y: number) => (y < 0.25 ? (y / 0.25) * rise : y < 0.75 ? rise + ((y - 0.25) / 0.5) * (set - rise) : set + ((y - 0.75) / 0.25) * (1 - set));
  const jump = (real: number) => { if (pinned !== null) pinned = real; else { base = real; since = now; } };

  const thumb = (tau: number) => (tau < 0.5 ? tau * 2 : (1 - tau) * 2);
  const hhmm = (tau: number) => { const m = Math.floor(tau * 1440); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  input?.addEventListener('input', () => { const v = Number(input.value); jump(unwarp(scene < 0.5 ? v / 2 : 1 - v / 2)); });
  input?.addEventListener('pointerdown', () => { sliding = true; });
  for (const ev of ['pointerup', 'change']) input?.addEventListener(ev, () => { sliding = false; });
  return {
    set(tau) { jump(unwarp(tau)); },
    at(p) { if (p !== place) { place = p; refresh(); } },
    tau(t) {
      now = t;
      if (t - checked > 60) refresh();
      current = pinned ?? ((((base + (t - since) / day) % 1) + 1) % 1);
      scene = warp(current);
      const pos = thumb(scene);
      if (input && !sliding) input.value = f(pos);
      track?.style.setProperty('--pos', f(pos));
      if (track) track.dataset.sky = scene > 0.25 && scene < 0.75 ? 'day' : 'night'; // the sun is up between sunrise and sunset
      if (text) text.textContent = hhmm(current);
      return scene;
    },
  };
}
