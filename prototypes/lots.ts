// The prototype street: the real house between three stand-in neighbours.
import { homeLot } from '../src/home.ts';
import { neighbourLot } from '../src/neighbour.ts';

export const LOTS = [neighbourLot(1, 'Number 155'), homeLot, neighbourLot(2, 'Number 161'), neighbourLot(3, 'Number 163')];
export const stage = document.querySelector<HTMLElement>('#stage')!;
export const hint = (text: string) => { const h = document.querySelector('#hint'); if (h) h.textContent = text; };
