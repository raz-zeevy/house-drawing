// C: postcards. One house fills the card; swipe or use the arrows to move to the next,
// the camera glides and settles on each house. The dog and cat still wander the whole
// street, so they turn up on other cards.
import { mountStreet } from '../src/app.ts';
import { LOTS, stage, hint } from './lots.ts';

const nav = document.querySelector<HTMLElement>('#nav')!;
let page = 1, viewW = 1280;
const { camera, placed } = mountStreet({
  stage, lots: LOTS, label: 'Houses on a street, one at a time', paged: true,
  onFit: () => hint('Swipe, drag or use the arrows to move between houses.'),
  onView: (v) => {
    viewW = v.w;
    const mid = v.x + v.w / 2, centre = (j: number) => placed[j].x0 + placed[j].width / 2;
    const i = placed.reduce((best, _, j) => (Math.abs(centre(j) - mid) < Math.abs(centre(best) - mid) ? j : best), 0);
    if (i !== page) { page = i; render(); }
  },
});
const go = (i: number) => { page = Math.max(0, Math.min(placed.length - 1, i)); camera.goTo(placed[page].x0 + placed[page].width / 2 - viewW / 2); render(); };
const prev = button('← Previous', () => go(page - 1)), caption = document.createElement('span'), next = button('Next →', () => go(page + 1));
caption.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;font-style:italic';
nav.append(prev, caption, next);
function button(text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = text; b.addEventListener('click', onClick);
  return b;
}
function render(): void {
  caption.textContent = `${placed[page].name} · ${page + 1} of ${placed.length}`;
  prev.disabled = page === 0; next.disabled = page === placed.length - 1;
}
addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(page - 1); if (e.key === 'ArrowRight') go(page + 1); });
go(1);
