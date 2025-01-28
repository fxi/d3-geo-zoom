import { select as d3Select, pointers as d3Pointers } from "d3-selection";
import {
  zoom as d3Zoom,
  D3ZoomEvent,
  ZoomBehavior,
  zoomIdentity,
} from "d3-zoom";
import { GeoProjection } from "d3-geo";
import versor from "versor";
import Kapsule from "kapsule";

type Direction = "left" | "right" | "up" | "down";

interface State {
  projection?: GeoProjection;
  unityScale: number;
  currentScale: number; // Track the actual scale value
  scaleExtent: [number, number];
  northUp: boolean;
  onMove: (params: {
    scale: number;
    rotation: [number, number, number];
  }) => void;
  zoom?: ZoomBehavior<Element, unknown>;
}

interface GeoZoomMethods {
  moveDirection: (
    direction: Direction,
    degrees?: number
  ) => [number, number, number];
  rotateTo: (rotation: [number, number, number]) => [number, number, number];
}

type GeoZoomInstance = ((element: HTMLElement) => void) &
  GeoZoomMethods & {
    projection: (proj: GeoProjection) => GeoZoomInstance;
    onMove: (
      callback: (params: {
        scale: number;
        rotation: [number, number, number];
      }) => void
    ) => GeoZoomInstance;
    northUp: (enabled: boolean) => GeoZoomInstance;
    scaleExtent: (extent: [number, number]) => GeoZoomInstance;
  };

export default Kapsule({
  props: {
    projection: {
      onChange(projection: GeoProjection | undefined, state: State) {
        if (!projection) {
          state.unityScale = 1;
          state.currentScale = 1;
          return;
        }

        // Get the new projection's base scale
        const newScale = projection.scale();

        if (!state.unityScale) {
          // First time initialization
          state.unityScale = newScale;
          state.currentScale = newScale;
        } else {
          // Keep the relative scale when changing projections
          const relativeScale = state.currentScale / state.unityScale;
          state.unityScale = newScale;
          state.currentScale = newScale * relativeScale;
          projection.scale(state.currentScale);
        }
      },
    },
    scaleExtent: {
      default: [0.1, 1e3] as [number, number],
      onChange(extent: [number, number], state: State) {
        state.zoom?.scaleExtent(extent);
      },
    },
    northUp: { default: false },
    onMove: { defaultVal: () => {} },
  },

  methods: {
    rotateTo(
      state: State,
      targetRotation: [number, number, number]
    ): [number, number, number] {
      const proj = state.projection;
      if (!proj) return [0, 0, 0];

      if (state.northUp) {
        targetRotation[2] = 0;
      }

      proj.rotate(targetRotation);
      state.onMove({ scale: state.currentScale, rotation: targetRotation });
      return targetRotation;
    },

    moveDirection(
      state: State,
      direction: Direction,
      degrees: number = 20
    ): [number, number, number] {
      const proj = state.projection;
      if (!proj) return [0, 0, 0];

      const r0 = proj.rotate();
      const q0 = versor(r0);

      // Calculate view-relative rotation
      let viewRotation: [number, number, number];
      switch (direction) {
        case "left":
          viewRotation = [-degrees, 0, 0];
          break;
        case "right":
          viewRotation = [degrees, 0, 0];
          break;
        case "up":
          viewRotation = [0, -degrees, 0];
          break;
        case "down":
          viewRotation = [0, degrees, 0];
          break;
      }

      const q1 = versor(viewRotation);
      const q2 = versor.multiply(q1, q0);
      let targetRotation = versor.rotation(q2);

      if (state.northUp) {
        targetRotation[2] = 0;
      }

      // Normalize targetRotation for shortest path
      targetRotation = targetRotation.map((target, index) => {
        let delta = target - r0[index];

        // Wrap delta to [-180, 180] for shortest rotation
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        return r0[index] + delta;
      }) as [number, number, number];

      proj.rotate(targetRotation);
      state.onMove({ scale: state.currentScale, rotation: targetRotation });
      return targetRotation;
    },
  },

  init(nodeEl: Element, state: State) {
    console.log("init");
    // Initialize state with defaults
    state.unityScale = state.projection?.scale() || 1;
    state.currentScale = state.unityScale;

    // Initialize zoom behavior
    state.zoom = d3Zoom()
      .scaleExtent(state.scaleExtent)
      .on("start", zoomStarted)
      .on("zoom", zoomed);

    // Initialize interaction state
    let v0: [number, number, number] | null = null;
    let r0: [number, number, number] | null = null;
    let q0: [number, number, number, number] | null = null;

    // Initialize zoom transform
    d3Select(nodeEl).call(state.zoom).call(state.zoom.transform, zoomIdentity);

    function zoomStarted(ev: D3ZoomEvent<Element, unknown>) {
      const proj = state.projection;
      if (!proj?.invert) return;

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const inverted = proj.invert(coords);
      if (!inverted) return;

      v0 = versor.cartesian(inverted);
      r0 = proj.rotate();
      q0 = versor(r0);
    }

    function zoomed(ev: D3ZoomEvent<Element, unknown>) {
      const proj = state.projection;
      if (!proj?.invert || !v0 || !r0 || !q0) return;

      // Update current scale
      state.currentScale = ev.transform.k * state.unityScale;
      proj.scale(state.currentScale);

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const rotated = proj.rotate(r0);
      if (!rotated.invert) return;

      const inverted = rotated.invert(coords);
      if (!inverted) return;

      const v1 = versor.cartesian(inverted);
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      const rotation = versor.rotation(q1);

      // Apply north up constraint if enabled
      const finalRotation: [number, number, number] = state.northUp
        ? [rotation[0], rotation[1], 0]
        : rotation;
      proj.rotate(finalRotation);
      state.onMove({ scale: state.currentScale, rotation: finalRotation });
    }

    function getPointerCoords(
      zoomEv: D3ZoomEvent<Element, unknown>
    ): [number, number] | null {
      const avg = (vals: number[]): number =>
        vals.reduce((agg, v) => agg + v, 0) / vals.length;

      const pointers = d3Pointers(zoomEv, nodeEl);

      if (pointers && pointers.length > 1) {
        // Calculate centroid of all points if multi-touch
        return [0, 1].map((idx) => avg(pointers.map((t) => t[idx]))) as [
          number,
          number
        ];
      }

      return pointers.length ? pointers[0] : null;
    }
  },
}) as (config?: any) => GeoZoomInstance;
