# d3-geo-zoom

Zoom and Pan D3 Geo projections (Ported from vasturiano/d3-geo-zoom)

This library provides smooth zooming and panning functionality for D3 geographic projections using quaternion interpolation for rotation transitions.

## Installation

```bash
npm install d3-geo-zoom
```

## Usage

### Basic Example

(see /demo/svg/index.html for the full version) 

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

// Create a group for the map
const g = svg.append('g');

// Add your GeoJSON data
g.selectAll('path')
  .data(geoJsonData.features)
  .enter()
  .append('path')
  .attr('d', path);

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

## API Reference

### geoZoom()

Creates a new geo zoom behavior.

### Configuration Options

* `projection(projection)` - Sets the geographic projection to be controlled
* `scaleExtent([min, max])` - Sets the allowed scale range (default: [0.1, 1000])
* `northUp(boolean)` - Prevents rotation around the z-axis (default: false)
* `onMove(callback)` - Called after each zoom/pan operation with current scale and rotation

### Mathematical Concepts

The library uses quaternions (via the versor library) for smooth rotation interpolation. Quaternions provide several advantages over Euler angles for 3D rotations:

* Avoid gimbal lock
* Provide shortest path interpolation
* Ensure smooth transitions between rotations

The rotation process:
1. Convert geographic coordinates to 3D cartesian points
2. Use quaternions to calculate rotation between points
3. Apply the rotation to the projection
4. Convert back to geographic coordinates

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm test`: Run tests in watch mode (for development)
- `npm run test:ci`: Run tests once (used in CI and git hooks)
- `npm run test:ui`: Open test UI
- `npm run coverage`: Generate test coverage report

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
1. Type of change:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation changes
   - style: Code style changes
   - refactor: Code changes that neither fix a bug nor add a feature
   - perf: Performance improvements
   - test: Adding or updating tests
   - chore: Changes to build process or auxiliary tools

2. Scope (optional):
   - The part of the codebase you're modifying (e.g., zoom, projection)

3. Description
4. Breaking changes (if any)
5. Issues being closed (if any)

### Continuous Integration and Deployment

This project uses GitHub Actions for continuous integration and automated versioning/publishing:

#### Automated Tests
Tests run automatically on:
- Every push to the main branch
- All pull requests

The test suite runs against Node.js versions 18.x and 20.x.

#### Automated Versioning and Publishing

This project uses semantic-release for automated versioning and publishing. The process is triggered automatically when commits are pushed to the main branch.

The version number is automatically determined by analyzing commit messages:
- `fix:` commits trigger a patch release (1.0.0 -> 1.0.1)
- `feat:` commits trigger a minor release (1.0.0 -> 1.1.0)
- Commits with `BREAKING CHANGE:` in the footer trigger a major release (1.0.0 -> 2.0.0)

##### Release Process

1. Make your changes
2. Stage them with `git add`
3. Run `npm run commit` to create a properly formatted commit
4. Push to main branch
5. GitHub Actions will automatically:
   - Run tests
   - Analyze commit messages
   - Determine the next version number
   - Update package.json
   - Create a GitHub release
   - Publish to npm

Required Setup:
1. Add these secrets in your GitHub repository settings:
   - `NPM_TOKEN`: Your npm authentication token
   - `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Original Repository

This is a port of the original [d3-geo-zoom](https://github.com/vasturiano/d3-geo-zoom) by Vasco Asturiano.

## License

See the LICENSE file for details.
