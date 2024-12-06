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

## Original Repository

This is a port of the original [d3-geo-zoom](https://github.com/vasturiano/d3-geo-zoom) by Vasco Asturiano.

## License

See the LICENSE file for details.
 