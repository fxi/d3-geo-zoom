import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: 'src/index.js',
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
  }
});
