// D: postcards with a map. One house at a time, centred on the card; ink arrows on the
// card's edges (or swipe, or the arrow keys) glide to the neighbours, and the house's
// name sits underneath. The folded-map icon at the top opens the street from above,
// zooming out from the current house; tapping a house there zooms into it.
import { mountStreet } from '../src/app.ts';
import { LOTS, stage, hint } from './lots.ts';
import { plan } from './plan.ts';

const nameEl = document.querySelector<HTMLElement>('#name')!, mapBtn = document.querySelector<HTMLButtonElement>('#mapBtn')!;
const prev = document.querySelector<HTMLButtonElement>('.arrow.prev')!, next = document.querySelector<HTMLButtonElement>('.arrow.next')!;
let page = 1, viewW = 1280, gliding = true; // while gliding to a chosen house, the view doesn't pick the page

const { camera, placed, width } = mountStreet({
  stage, lots: LOTS, label: 'Houses on a street, one at a time', paged: true,
  onFit: () => hint('Swipe or use the arrows to visit the neighbours; the map shows the whole street.'),
  onView: (v) => {
    viewW = v.w;
    const mid = v.x + v.w / 2, centre = (j: number) => placed[j].x0 + placed[j].width / 2;
    const i = placed.reduce((best, _, j) => (Math.abs(centre(j) - mid) < Math.abs(centre(best) - mid) ? j : best), 0);
    if (gliding) camera.goTo(centre(page) - v.w / 2); // re-aim once the window's real width is known
    else if (i !== page) { page = i; render(); }
  },
});

const map = plan(document.querySelector<HTMLElement>('#map')!, placed, width, (i) => { closeMap(i); go(i); });
function openMap(): void { map.open(page); mapBtn.setAttribute('aria-pressed', 'true'); mapBtn.setAttribute('aria-label', 'Close the map'); prev.hidden = next.hidden = true; }
function closeMap(i = page): void { map.close(i); mapBtn.setAttribute('aria-pressed', 'false'); mapBtn.setAttribute('aria-label', 'Show the map of the street'); render(); }
mapBtn.addEventListener('click', () => (map.isOpen() ? closeMap() : openMap()));

function go(i: number): void {
  page = Math.max(0, Math.min(placed.length - 1, i));
  gliding = true;
  camera.goTo(placed[page].x0 + placed[page].width / 2 - viewW / 2);
  render();
}
let shownName = '';
function render(): void {
  prev.hidden = map.isOpen() || page === 0;
  next.hidden = map.isOpen() || page === placed.length - 1;
  const name = placed[page].name;
  if (name === shownName) return;
  shownName = name;
  nameEl.style.opacity = '0';
  setTimeout(() => { nameEl.textContent = name; nameEl.style.opacity = '1'; }, 180);
}
stage.addEventListener('pointerdown', () => { gliding = false; });
prev.addEventListener('click', () => go(page - 1));
next.addEventListener('click', () => go(page + 1));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && map.isOpen()) closeMap();
  else if (map.isOpen()) return;
  else if (e.key === 'ArrowLeft') go(page - 1);
  else if (e.key === 'ArrowRight') go(page + 1);
});
go(1);
