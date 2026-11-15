// The live page: one house on the street.
import { mountStreet } from './app.ts';
import { homeLot } from './home.ts';

const coarse = matchMedia('(pointer: coarse)').matches;
const hint = document.querySelector('#hint');
mountStreet({
  stage: document.querySelector<HTMLElement>('#stage')!,
  lots: [homeLot],
  label: 'Line drawing of a white house behind trees, ivy over a block wall, a metal gate and a terrace with a hammock',
  onFit(narrow) {
    if (hint) hint.textContent = narrow
      ? 'Swipe to look along the street, pinch to zoom out. Tap the trees, the ivy, the gate, the shutter, the hammock, the dog or the cat.'
      : `${coarse ? 'Tap' : 'Move the pointer for wind, and click'} the trees, the ivy, the gate, the shutter, the hammock, the dog or the cat.`;
  },
});
