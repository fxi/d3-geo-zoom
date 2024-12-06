# d3-geo-zoom

Zoom and Pan D3 Geo projections (Ported from vasturiano/d3-geo-zoom)

This library provides smooth zooming and panning functionality for D3 geographic projections using quaternion interpolation for rotation transitions.

[Live Demo & Documentation](https://fxi.github.io/d3-geo-zoom)

## Installation

```bash
npm install @fxi/d3-geo-zoom
```

## Quick Start

```javascript
import { geoZoom } from 'd3-geo-zoom';
import { select } from 'd3-selection';
import { geoOrthographic, geoPath } from 'd3-geo';

// Create SVG element
const svg = select('body')
  .append('svg')
  .attr('width', 800)
  .attr('height', 600);

// Setup projection
const projection = geoOrthographic()
  .scale(250)
  .center([0, 0]);

// Create path generator
const path = geoPath()
  .projection(projection);

// Initialize zoom behavior
const zoom = geoZoom()
  .projection(projection)
  .onMove(() => {
    // Update map on zoom/pan
    g.selectAll('path').attr('d', path);
  });

// Apply zoom behavior to SVG
svg.call(zoom);
```

For more examples and detailed API documentation, visit our [documentation site](https://fxi.github.io/d3-geo-zoom).

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Available Scripts

#### Development
- `npm run dev`: Start development server for demo
- `npm run dev:docs`: Start development server for documentation site
- `npm run build`: Build library for production
- `npm run build:docs`: Build documentation site
- `npm run preview`: Preview production build

#### Testing
- `npm test`: Run tests in watch mode (for development)
- `npm run test:ci`: Run tests once (used in CI and git hooks)
- `npm run test:ui`: Open test UI
- `npm run coverage`: Generate test coverage report

### Documentation Development

The documentation site is built using Vite and hosted on GitHub Pages. To work on the documentation:

1. Run `npm run dev:docs` to start the documentation development server
2. Edit files in the `docs/src` directory:
   - `index.html`: Main documentation page
   - `style.css`: Documentation styles
   - `main.js`: Interactive examples and demos

The documentation site is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Contributing

#### Creating Commits

This project uses [Commitizen](https://github.com/commitizen/cz-cli) for standardized commit messages. Instead of using `git commit`, use:

```bash
npm run commit
```

This will:
1. Run tests in non-watch mode (via pre-commit hook)
2. Start an interactive prompt to create a properly formatted commit message
3. Validate the commit message format

The prompt will help you create a commit message with:
1. Type of change (feat, fix, docs, etc.)
2. Scope (optional)
3. Description
4. Breaking changes (if any)
5. Issues being closed (if any)

### Continuous Integration and Deployment

This project uses GitHub Actions for:

#### Testing and Publishing
- Runs on every push and pull request
- Tests against Node.js 18.x and 20.x
- Automatically publishes to npm on release

#### Documentation
- Automatically builds and deploys documentation to GitHub Pages
- Triggered on push to main branch
- Available at https://fxi.github.io/d3-geo-zoom

### Version Control

This project uses semantic-release for automated versioning:

- `fix:` commits trigger a patch release (1.0.0 -> 1.0.1)
- `feat:` commits trigger a minor release (1.0.0 -> 1.1.0)
- `BREAKING CHANGE:` in commit body triggers a major release (1.0.0 -> 2.0.0)

## Original Repository

This is a port of the original [d3-geo-zoom](https://github.com/vasturiano/d3-geo-zoom) by Vasco Asturiano.

## License

See the LICENSE file for details.
