import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// served from https://raz-zeevy.github.io/house-drawing/ (the prototypes under /prototypes/)
const page = (p: string) => resolve(import.meta.dirname, p);
export default defineConfig({
  base: '/house-drawing/',
  build: {
    rollupOptions: {
      input: {
        main: page('index.html'),
        street: page('prototypes/street.html'),
        map: page('prototypes/map.html'),
        postcards: page('prototypes/postcards.html'),
      },
    },
  },
});
