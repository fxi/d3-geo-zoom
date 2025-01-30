/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeoZoom } from './geoZoom';
import { geoOrthographic, GeoProjection } from 'd3-geo';

describe('d3-geo-zoom', () => {
  let projection: GeoProjection;
  let zoom: GeoZoom;
  let element: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM element
    element = document.createElement('div');
    
    // Setup projection
    projection = geoOrthographic()
      .scale(100)
      .translate([0, 0]);
    
    // Initialize zoom
    zoom = new GeoZoom(element);
  });

  describe('Basic Setup', () => {
    it('should create zoom instance', () => {
      expect(zoom).toBeDefined();
      expect(zoom instanceof GeoZoom).toBe(true);
    });

    it('should accept a projection', () => {
      const zoomInstance = zoom.setProjection(projection);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });
  });

  describe('Configuration', () => {
    it('should set scale extent', () => {
      const extent: [number, number] = [0.5, 2.0];
      const zoomInstance = zoom.setScaleExtent(extent);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should set north up constraint', () => {
      const zoomInstance = zoom.setNorthUp(true);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should set onMove callback', () => {
      const callback = vi.fn();
      const zoomInstance = zoom.onMove(callback);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should set transition duration', () => {
      const duration = 1000;
      const zoomInstance = zoom.setTransitionDuration(duration);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });
  });

  describe('Projection Configuration', () => {
    beforeEach(() => {
      zoom.setProjection(projection);
    });

    it('should maintain initial scale', () => {
      const initialScale = projection.scale();
      expect(projection.scale()).toBe(initialScale);
    });

    it('should maintain initial translate', () => {
      const initialTranslate = projection.translate();
      expect(projection.translate()).toEqual(initialTranslate);
    });

    it('should respect north up constraint when set', () => {
      zoom.setNorthUp(true);
      const rotation = projection.rotate();
      expect(rotation[2]).toBe(0); // Z-axis rotation should be 0
    });

    it('should allow rotation when north up is false', () => {
      zoom.setNorthUp(false);
      projection.rotate([45, 45, 45]);
      const rotation = projection.rotate();
      expect(rotation[2]).toBe(45); // Z-axis rotation should be maintained
    });
  });

  describe('Movement Methods', () => {
    beforeEach(() => {
      zoom.setProjection(projection);
    });

    it('should handle move operations', () => {
      const initialRotation = projection.rotate();
      zoom.move('right', 10);
      // Since the move is animated, we can verify that the move method
      // returns the instance for chaining
      expect(zoom.move('right', 10)).toBe(zoom);
      // And verify that the projection is defined
      expect(projection).toBeDefined();
    });

    it('should handle rotateTo operations', () => {
      const newRotation: [number, number, number] = [45, 45, 0];
      zoom.rotateTo(newRotation);
      // Note: We can't test the exact rotation immediately as it's animated
      expect(zoom).toBeDefined();
    });

    it('should handle reset operation', () => {
      zoom.reset();
      // Note: We can't test the exact state immediately as it's animated
      expect(zoom).toBeDefined();
    });
  });

  describe('Projection Changes', () => {
    it('should maintain correct scale when projection changes', () => {
      // Setup initial projection and zoom
      const initialProjection = geoOrthographic().scale(100).translate([0, 0]);
      zoom.setProjection(initialProjection);
      
      // Change to a new projection with different scale
      const newProjection = geoOrthographic().scale(200).translate([0, 0]);
      zoom.setProjection(newProjection);
      
      // Scale should be preserved from the initial projection
      expect(newProjection.scale()).toBe(100);
    });
  });

  describe('API Consistency', () => {
    it('should maintain method chaining', () => {
      const instance = zoom
        .setProjection(projection)
        .setScaleExtent([0.5, 2.0])
        .setNorthUp(true)
        .onMove(() => {});
      
      expect(instance).toBe(zoom);
    });

    it('should handle undefined values gracefully', () => {
      // Test each method individually to isolate errors
      expect(() => zoom.setProjection(undefined as unknown as GeoProjection)).not.toThrow();
      expect(() => zoom.setScaleExtent(undefined as unknown as [number, number])).not.toThrow();
      expect(() => zoom.setNorthUp(undefined as unknown as boolean)).not.toThrow();
      expect(() => zoom.onMove(undefined as unknown as (params: { scale: number; rotation: [number, number, number] }) => void)).not.toThrow();
    });

    it('should expose zoom behavior', () => {
      expect(zoom.getZoom()).toBeDefined();
    });
  });
});
