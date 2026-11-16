// Time of day as tau (0 midnight, 0.5 noon), advancing one day per `day` seconds, with
// the moon-to-sun slider: through the morning the thumb climbs toward the sun, through
// the afternoon and evening it slides back to the moon. Dragging moves within the
// current half of the day. The clock text rides above the thumb.
import { f } from '../lib/ink.ts';

export function clock({ start, day, pinned }: { start: number; day: number; pinned: number | null }): { tau(t: number): number } {
  const input = document.querySelector<HTMLInputElement>('#time'), text = document.querySelector('#clock'), track = document.querySelector<HTMLElement>('.track');
  let base = start, since = 0, now = 0, current = start, sliding = false;
  const thumb = (tau: number) => (tau < 0.5 ? tau * 2 : (1 - tau) * 2);
  const hhmm = (tau: number) => { const m = Math.floor(tau * 1440); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  input?.addEventListener('input', () => { const v = Number(input.value); base = current < 0.5 ? v / 2 : 1 - v / 2; since = now; });
  input?.addEventListener('pointerdown', () => { sliding = true; });
  for (const ev of ['pointerup', 'change']) input?.addEventListener(ev, () => { sliding = false; });
  return {
    tau(t) {
      now = t;
      current = pinned ?? ((((base + (t - since) / day) % 1) + 1) % 1);
      const pos = thumb(current);
      if (input && !sliding) input.value = f(pos);
      track?.style.setProperty('--pos', f(pos));
      if (track) track.dataset.sky = current > 0.27 && current < 0.77 ? 'day' : 'night'; // sun from ~6:30 to ~18:30
      if (text) text.textContent = hhmm(current);
      return current;
    },
  };
}
