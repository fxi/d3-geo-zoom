/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { geoZoom } from './index';
import { geoOrthographic, GeoProjection } from 'd3-geo';

describe('d3-geo-zoom', () => {
  let projection: GeoProjection;
  let zoom: any;

  beforeEach(() => {
    // Setup projection
    projection = geoOrthographic()
      .scale(100)
      .translate([0, 0]);
    
    // Initialize zoom
    zoom = geoZoom();
  });

  describe('Basic Setup', () => {
    it('should create zoom instance', () => {
      expect(zoom).toBeDefined();
      expect(typeof zoom).toBe('function');
    });

    it('should accept a projection', () => {
      const zoomInstance = zoom.projection(projection);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });
  });

  describe('Configuration', () => {
    it('should set scale extent', () => {
      const extent: [number, number] = [0.5, 2.0];
      const zoomInstance = zoom.scaleExtent(extent);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should set north up constraint', () => {
      const zoomInstance = zoom.northUp(true);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should set onMove callback', () => {
      const callback = vi.fn();
      const zoomInstance = zoom.onMove(callback);
      expect(zoomInstance).toBe(zoom); // Check method chaining
    });

    it('should get current scale extent', () => {
      const extent: [number, number] = [0.5, 2.0];
      zoom.scaleExtent(extent);
      expect(zoom.scaleExtent()).toEqual(extent);
    });

    it('should get current north up setting', () => {
      zoom.northUp(true);
      expect(zoom.northUp()).toBe(true);
    });
  });

  describe('Projection Configuration', () => {
    beforeEach(() => {
      zoom.projection(projection);
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
      zoom.northUp(true);
      const rotation = projection.rotate();
      expect(rotation[2]).toBe(0); // Z-axis rotation should be 0
    });

    it('should allow rotation when north up is false', () => {
      zoom.northUp(false);
      projection.rotate([45, 45, 45]);
      const rotation = projection.rotate();
      expect(rotation[2]).toBe(45); // Z-axis rotation should be maintained
    });
  });

  describe('API Consistency', () => {
    it('should maintain method chaining', () => {
      const instance = zoom
        .projection(projection)
        .scaleExtent([0.5, 2.0])
        .northUp(true)
        .onMove(() => {});
      
      expect(instance).toBe(zoom);
    });

    it('should handle undefined values gracefully', () => {
      expect(() => {
        zoom.projection(undefined);
        zoom.scaleExtent(undefined);
        zoom.northUp(undefined);
        zoom.onMove(undefined);
      }).not.toThrow();
    });
  });
});
