import { interpolate } from "d3-interpolate";
import { select as d3Select, pointers as d3Pointers } from "d3-selection";
import {
  zoom as d3Zoom,
  ZoomBehavior,
  zoomIdentity,
  D3ZoomEvent,
} from "d3-zoom";
import { GeoProjection } from "d3-geo";
import { easeCubicInOut } from "d3-ease";
import { GeoRotation } from "./geoRotation";

export class GeoZoom {
  private element: Element;
  private projection?: GeoProjection;
  private zoom?: ZoomBehavior<Element, unknown>;
  private unityScale: number = 1;
  private currentScale: number = 1;
  private initialScale: number = 1;
  private initialRotation: [number, number, number] = [0, 0, 0];
  private scaleExtent: [number, number] = [0.1, 1e3];
  private northUp: boolean = false;
  private transitionDuration: number = 750;
  private onMoveCallback?: (params: {
    scale: number;
    rotation: [number, number, number];
  }) => void;

  // Zoom state
  private v0: [number, number, number] | null = null;
  private r0: [number, number, number] | null = null;
  private q0: [number, number, number, number] | null = null;

  constructor(element: Element) {
    this.element = element;
    this.initializeZoom();
  }

  private initializeZoom() {
    this.zoom = d3Zoom()
      .scaleExtent(this.scaleExtent)
      .on("start", this.zoomStarted.bind(this))
      .on("zoom", this.zoomed.bind(this));

    d3Select(this.element)
      .call(this.zoom)
      .call(this.zoom.transform, zoomIdentity);
  }

  setProjection(newProjection?: GeoProjection): this {
    if (!newProjection?.rotate || !this.element) return this;

    const oldProjection = this.projection;
    if (!oldProjection) {
      this.projection = newProjection;
      // Store initial scale when first setting the projection
      this.initialScale = newProjection.scale();
      this.unityScale = this.initialScale;
      return this;
    }

    // Store current state
    const oldRotation = oldProjection.rotate();
    const oldScale = oldProjection.scale();

    // Set initial state
    this.projection = newProjection;
    this.projection.rotate(oldRotation);
    this.projection.scale(oldScale);

    return this;
  }

  rotateTo(rotation?: [number, number, number]): this {
    if (!this.projection?.rotate || !this.element || !rotation) return this;

    const selection = d3Select(this.element);
    const currentRotation = this.projection.rotate();

    selection
      .transition()
      .duration(this.transitionDuration)
      .ease(easeCubicInOut)
      .tween("rotate", () => {
        const r = [
          interpolate(currentRotation[0], rotation[0]),
          interpolate(currentRotation[1], rotation[1]),
          interpolate(currentRotation[2], rotation[2]),
        ];
        return (t: number) => {
          this.projection!.rotate([r[0](t), r[1](t), r[2](t)]);
          this.notifyMove();
        };
      });

    return this;
  }

  move(
    direction: "left" | "right" | "up" | "down" | "north",
    step: number = 10
  ): this {
    if (!this.projection?.rotate) return this;

    const [lambda, phi, gamma] = this.projection.rotate();
    let newRotation: [number, number, number] = [lambda, phi, gamma];

    switch (direction) {
      case "up":
        newRotation[1] -= step;
        break;
      case "down":
        newRotation[1] += step;
        break;
      case "left":
        newRotation[0] -= step;
        break;
      case "right":
        newRotation[0] += step;
        break;
      case "north":
        newRotation[2] = 0;
        break;
    }

    if (this.northUp) {
      newRotation[2] = 0;
    }

    this.rotateTo(newRotation);
    return this;
  }

  reset(): this {
    if (!this.projection?.rotate || !this.element) return this;

    const selection = d3Select(this.element);

    // Reset zoom
    selection
      .transition()
      .duration(this.transitionDuration)
      .ease(easeCubicInOut)
      .call(this.zoom!.transform, zoomIdentity);

    // Reset rotation
    this.rotateTo(this.initialRotation);
    return this;
  }

  private notifyMove() {
    if (this.onMoveCallback && this.projection) {
      this.onMoveCallback({
        scale: this.currentScale,
        rotation: this.projection.rotate(),
      });
    }
  }

  // Zoom event handlers
  private zoomStarted(ev: D3ZoomEvent<Element, unknown>) {
    const proj = this.projection;
    if (!proj?.invert) return;

    const coords = this.getPointerCoords(ev);
    if (!coords) return;

    const inverted = proj.invert(coords);
    if (!inverted) return;

    this.v0 = GeoRotation.cartesian(inverted);
    this.r0 = proj.rotate();
    this.q0 = GeoRotation.fromAngles(this.r0);
  }

  private zoomed(ev: D3ZoomEvent<Element, unknown>) {
    const proj = this.projection;
    if (!proj?.invert) return;

    // Update current scale
    this.currentScale = ev.transform.k * this.unityScale;
    proj.scale(this.currentScale);

    // For user interactions, initialize state if needed
    if (!this.v0 || !this.r0 || !this.q0) {
      const coords = this.getPointerCoords(ev);
      if (!coords) return;

      const inverted = proj.invert(coords);
      if (!inverted) return;

      this.v0 = GeoRotation.cartesian(inverted);
      this.r0 = proj.rotate();
      this.q0 = GeoRotation.fromAngles(this.r0) as [
        number,
        number,
        number,
        number
      ];
      return;
    }

    const coords = this.getPointerCoords(ev);
    if (!coords) return;

    const rotated = proj.rotate(this.r0);
    if (!rotated.invert) return;

    const inverted = rotated.invert(coords);
    if (!inverted) return;

    const v1 = GeoRotation.cartesian(inverted);
    const q1 = GeoRotation.multiply(this.q0, GeoRotation.delta(this.v0, v1));
    const rotation = GeoRotation.toAngles(q1);

    // Apply north up constraint if enabled
    const finalRotation: [number, number, number] = this.northUp
      ? [rotation[0], rotation[1], 0]
      : rotation;

    proj.rotate(finalRotation);
    this.notifyMove();
  }

  private getPointerCoords(
    zoomEv: D3ZoomEvent<Element, unknown>
  ): [number, number] | null {
    const pointers = d3Pointers(zoomEv, this.element);

    if (pointers && pointers.length > 1) {
      // Calculate centroid of all points if multi-touch
      const avg = (vals: number[]): number =>
        vals.reduce((agg, v) => agg + v, 0) / vals.length;
      return [0, 1].map((idx) => avg(pointers.map((t) => t[idx]))) as [
        number,
        number
      ];
    }

    const coord = pointers.length ? pointers[0] : null;

    if (!coord) {
      return null;
    }

    if (coord[0] === 0 && coord[1] === 0) {
      // For programmatic zooms, use the element's center
      return this.getCenter();
    }
    return coord;
  }

  private getCenter(): [number, number] | null {
    const rect = this.element.getBoundingClientRect();
    return [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }

  // Setters
  setNorthUp(enabled?: boolean): this {
    if (enabled === undefined) return this;
    this.northUp = enabled;
    if (enabled && this.projection?.rotate) {
      const [lambda, phi] = this.projection.rotate();
      this.projection.rotate([lambda, phi, 0]);
    }
    return this;
  }

  setScaleExtent(extent?: [number, number]): this {
    if (!extent) return this;
    this.scaleExtent = extent;
    this.zoom?.scaleExtent(extent);
    return this;
  }

  setTransitionDuration(duration?: number): this {
    if (duration === undefined) return this;
    this.transitionDuration = duration;
    return this;
  }

  onMove(
    callback?: (params: {
      scale: number;
      rotation: [number, number, number];
    }) => void
  ): this {
    this.onMoveCallback = callback;
    return this;
  }

  // Getter for the zoom behavior
  getZoom(): ZoomBehavior<Element, unknown> {
    if (!this.zoom) {
      throw new Error("Zoom behavior not initialized");
    }
    return this.zoom;
  }
}
