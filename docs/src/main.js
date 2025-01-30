import { GeoZoom } from "../../src/index";
import { select } from "d3-selection";
import { geoPath } from "d3-geo";
import { geoOrthographic, geoMercator, geoEquirectangular } from "d3-geo";
import { feature } from "topojson-client";

// Setup controls for the demo
function setupControls(zoom, currentProjection, width, height, path, render, projections) {
  // Handle projection changes
  const projectionSelect = document.getElementById("projection");
  if (projectionSelect) {
    projectionSelect.addEventListener("change", (event) => {
      const projectionName = event.target.value;
      const ProjectionClass = projections[projectionName];

      currentProjection = ProjectionClass()
        .scale(Math.min(width, height) / 2.2)
        .translate([width / 2, height / 2]);

      path.projection(currentProjection);
      zoom.setProjection(currentProjection);
      render();
    });
  }

  // Handle north up toggle
  const northUpCheckbox = document.getElementById("northUp");
  if (northUpCheckbox) {
    northUpCheckbox.addEventListener("change", (event) => {
      zoom.setNorthUp(event.target.checked);
    });
  }

  // Handle rotation controls
  const rotationControls = {
    left: document.getElementById("rotateLeft"),
    right: document.getElementById("rotateRight"),
    up: document.getElementById("rotateUp"),
    down: document.getElementById("rotateDown"),
    north: document.getElementById("rotateNorth"),
  };

  Object.entries(rotationControls).forEach(([direction, button]) => {
    if (button) {
      button.addEventListener("click", () => {
        zoom.move(direction);
      });
    }
  });

  // Handle reset
  const resetButton = document.getElementById("reset");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      zoom.reset();
    });
  }

  // Handle transition duration
  const durationInput = document.getElementById("duration");
  if (durationInput) {
    durationInput.addEventListener("change", (event) => {
      zoom.setTransitionDuration(Number(event.target.value));
    });
  }

  // Handle scale extent
  const minScaleInput = document.getElementById("minScale");
  const maxScaleInput = document.getElementById("maxScale");
  function updateScaleExtent() {
    if (minScaleInput && maxScaleInput) {
      const min = Number(minScaleInput.value);
      const max = Number(maxScaleInput.value);
      zoom.setScaleExtent([min, max]);
    }
  }
  minScaleInput?.addEventListener("change", updateScaleExtent);
  maxScaleInput?.addEventListener("change", updateScaleExtent);

  // Handle manual rotation
  const rotateToButton = document.getElementById("rotateTo");
  const lambdaInput = document.getElementById("lambda");
  const phiInput = document.getElementById("phi");
  const gammaInput = document.getElementById("gamma");
  if (rotateToButton && lambdaInput && phiInput && gammaInput) {
    rotateToButton.addEventListener("click", () => {
      const rotation = [
        Number(lambdaInput.value),
        Number(phiInput.value),
        Number(gammaInput.value),
      ];
      zoom.rotateTo(rotation);
    });
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  // Map of available projections
  const projections = {
    orthographic: geoOrthographic,
    mercator: geoMercator,
    equirectangular: geoEquirectangular,
  };

  // Get container dimensions
  const container = document.getElementById("map");
  const width = container.clientWidth;
  const height = 500; // Fixed height

  // Create SVG
  const svg = select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "width: 100%; height: auto; max-width: 100%;");

  // Add glow filter
  const defs = svg.append("defs");
  const filter = defs.append("filter").attr("id", "glow");

  filter
    .append("feGaussianBlur")
    .attr("stdDeviation", "2")
    .attr("result", "coloredBlur");

  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  let currentProjection = geoOrthographic()
    .scale(Math.min(width, height) / 2.2)
    .translate([width / 2, height / 2]);

  // Create path generator
  const path = geoPath().projection(currentProjection);

  // Function to render the map
  function render() {
    svg.selectAll("path").attr("d", path);
  }

  const zoom = new GeoZoom(svg.node());
  // Configure zoom behavior with all available options
  zoom
    .setProjection(currentProjection)
    .setNorthUp(true)
    .setScaleExtent([0.1, 1000])
    .setTransitionDuration(750)
    .onMove(({ scale, rotation }) => {
      // Update map on zoom/pan
      render();
      
      // Update info display if it exists
      const info = document.getElementById('info');
      if (info) {
        info.textContent = `Scale: ${scale.toFixed(2)}, Rotation: [${rotation.map(d => d.toFixed(1)).join(', ')}]`;
      }
    });

  // Load and render world data
  fetch("https://unpkg.com/world-atlas@1/world/110m.json")
    .then((response) => response.json())
    .then((world) => {
      // Add sphere (ocean)
      svg
        .append("path")
        .attr("class", "sphere")
        .datum({ type: "Sphere" })
        .attr("d", path);

      // Add land
      svg
        .append("path")
        .attr("class", "land")
        .datum(feature(world, world.objects.land))
        .attr("d", path);

      // Initial render
      render();
    });

  // Setup controls
  setupControls(zoom, currentProjection, width, height, path, render, projections);

  // Handle window resize
  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth;
    svg.attr("width", newWidth).attr("viewBox", [0, 0, newWidth, height]);

    currentProjection.translate([newWidth / 2, height / 2]);
    render();
  });
});
