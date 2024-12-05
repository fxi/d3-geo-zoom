import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'd3GeoZoom',
      fileName: (format) => `d3-geo-zoom.${format}.js`
    },
    rollupOptions: {
      external: ['d3-selection', 'd3-zoom', 'kapsule', 'versor'],
      output: {
        globals: {
          'd3-selection': 'd3',
          'd3-zoom': 'd3',
          'kapsule': 'Kapsule',
          'versor': 'Versor'
        }
      }
    }
  }
});
