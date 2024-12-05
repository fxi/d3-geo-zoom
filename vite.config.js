import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'd3GeoZoom',
      fileName: () => `d3-geo-zoom.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['d3', 'kapsule', 'versor'],
      output: {
        exports: 'named',
        globals: {
          'd3': 'd3',
          'kapsule': 'Kapsule',
          'versor': 'Versor'
        }
      }
    }
  },
  resolve: {
    mainFields: ['main', 'module'] // Prioritize 'main' over 'module'
  },
  server: {
    open: '/demo/svg/',
    base: '/'
  },
});
