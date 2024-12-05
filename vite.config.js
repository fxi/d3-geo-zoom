import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'd3GeoZoom',
      fileName: () => `d3-geo-zoom.js`
    },
    rollupOptions: {
      external: ['d3', 'kapsule', 'versor'],
      output: {
        globals: {
          'd3': 'd3',
          'kapsule': 'Kapsule',
          'versor': 'Versor'
        }
      }
    }
  },
  server: {
    open: '/demo/svg/'
  }
});
