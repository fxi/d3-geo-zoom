import { geoZoom } from '../../src/index';
import { select } from 'd3-selection';
import { geoPath } from 'd3-geo';
import { 
    geoOrthographic,
    geoMercator,
    geoEquirectangular
} from 'd3-geo';
import { feature } from 'topojson-client';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Map of available projections
    const projections = {
        orthographic: geoOrthographic,
        mercator: geoMercator,
        equirectangular: geoEquirectangular
    };

    // Get container dimensions
    const container = document.getElementById('map');
    const width = container.clientWidth;
    const height = 500; // Fixed height

    // Create SVG
    const svg = select('#map')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'width: 100%; height: auto; max-width: 100%;');

    // Add glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
        .attr('id', 'glow');

    filter.append('feGaussianBlur')
        .attr('stdDeviation', '2')
        .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

    let currentProjection = geoOrthographic()
        .scale(Math.min(width, height) / 2.2)
        .translate([width / 2, height / 2]);

    // Create path generator
    const path = geoPath()
        .projection(currentProjection);

    // Function to render the map
    function render() {
        svg.selectAll('path').attr('d', path);
    }

    // Initialize zoom behavior
    const zoom = geoZoom()
        .projection(currentProjection)
        .onMove(render)
        .northUp(true);

    // Apply zoom behavior to SVG
    zoom(svg.node());

    // Load and render world data
    fetch('https://unpkg.com/world-atlas@1/world/110m.json')
        .then(response => response.json())
        .then(world => {
            // Add sphere (ocean)
            svg.append('path')
                .attr('class', 'sphere')
                .datum({ type: 'Sphere' })
                .attr('d', path);

            // Add land
            svg.append('path')
                .attr('class', 'land')
                .datum(feature(world, world.objects.land))
                .attr('d', path);

            // Initial render
            render();
        });

    // Handle projection changes
    const projectionSelect = document.getElementById('projection');
    if (projectionSelect) {
        projectionSelect.addEventListener('change', (event) => {
            const projectionName = event.target.value;
            const ProjectionClass = projections[projectionName];
            
            currentProjection = ProjectionClass()
                .scale(Math.min(width, height) / 2.2)
                .translate([width / 2, height / 2]);
            
            path.projection(currentProjection);
            zoom.projection(currentProjection);
            
            render();
        });
    }

    // Handle north up toggle
    const northUpCheckbox = document.getElementById('northUp');
    if (northUpCheckbox) {
        northUpCheckbox.addEventListener('change', (event) => {
            zoom.northUp(event.target.checked);
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        svg.attr('width', newWidth)
           .attr('viewBox', [0, 0, newWidth, height]);
        
        currentProjection.translate([newWidth / 2, height / 2]);
        render();
    });
});
