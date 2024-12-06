import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import pkg from './package.json';

// Extract copyrights from the LICENSE.
const copyright = readFileSync("./LICENSE", "utf-8")
  .split(/\n/g)
  .filter(line => /^copyright\s+/i.test(line))
  .map(line => line.replace(/^copyright\s+/i, ""))
  .join(", ");

export default defineConfig(({ command, mode }) => {
  const config = {
    resolve: {
      mainFields: ['main', 'module']
    }
  };

  // Docs configuration (both dev and build)
  if (mode === 'docs') {
    return {
      ...config,
      base: '/d3-geo-zoom/', // GitHub Pages repository name
      root: 'docs/src',
      build: {
        outDir: '../dist',
        emptyOutDir: true
      }
    };
  }

  // Library configuration
  return {
    ...config,
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'd3',
        fileName: (format) => `${pkg.name}${format === 'es' ? '.esm' : ''}.js`,
        formats: ['es', 'umd']
      },
      rollupOptions: {
        external: ['d3', 'kapsule'],
        output: {
          extend: true,
          banner: `// ${pkg.homepage} v${pkg.version} Copyright ${copyright}`,
          globals: {
            'd3': 'd3',
            'kapsule': 'Kapsule'
          }
        }
      }
    },
    server: {
      open: '/demo/svg/',
      base: '/'
    },
    test: {
      environment: 'jsdom'
    }
  };
});
