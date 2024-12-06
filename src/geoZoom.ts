import { select as d3Select, pointers as d3Pointers } from 'd3-selection';
import { zoom as d3Zoom, D3ZoomEvent, ZoomBehavior } from 'd3-zoom';
import { GeoProjection } from 'd3-geo';
import versor from 'versor';
import Kapsule from 'kapsule';

interface State {
  projection?: GeoProjection;
  unityScale: number;
  scaleExtent: [number, number];
  northUp: boolean;
  onMove: (params: { scale: number; rotation: [number, number, number] }) => void;
  zoom?: ZoomBehavior<Element, unknown>;
}

type GeoZoomInstance = (element: HTMLElement) => void;

export default Kapsule({
  props: {
    projection: {
      onChange(projection: GeoProjection | undefined, state: State) {
        state.unityScale = projection ? projection.scale() : 1;
      }
    },
    scaleExtent: {
      default: [0.1, 1e3] as [number, number],
      onChange(extent: [number, number], state: State) {
        state.zoom?.scaleExtent(extent);
      }
    },
    northUp: { default: false },
    onMove: { defaultVal: () => {} }
  },

  init(nodeEl: Element, state: State) {
    // Initialize zoom behavior
    d3Select(nodeEl).call(state.zoom = d3Zoom()
      .scaleExtent(state.scaleExtent)
      .on('start', zoomStarted)
      .on('zoom', zoomed)
    );

    let v0: [number, number, number] | null = null;
    let r0: [number, number, number] | null = null;
    let q0: [number, number, number, number] | null = null;

    function zoomStarted(ev: D3ZoomEvent<Element, unknown>) {
      if (!state.projection) return;

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const inverted = state.projection.invert(coords);
      if (!inverted) return;

      v0 = versor.cartesian(inverted);
      r0 = state.projection.rotate();
      q0 = versor(r0);
    }

    function zoomed(ev: D3ZoomEvent<Element, unknown>) {
      if (!state.projection || !v0 || !r0 || !q0) return;

      const scale = ev.transform.k * state.unityScale;
      state.projection.scale(scale);

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const inverted = state.projection.rotate(r0).invert(coords);
      if (!inverted) return;

      const v1 = versor.cartesian(inverted);
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      const rotation = versor.rotation(q1);

      if (state.northUp) {
        rotation[2] = 0; // Don't rotate on Z axis
      }

      // Cast to ensure correct type
      const finalRotation: [number, number, number] = [rotation[0], rotation[1], rotation[2]];
      state.projection.rotate(finalRotation);
      state.onMove({ scale, rotation: finalRotation });
    }

    function getPointerCoords(zoomEv: D3ZoomEvent<Element, unknown>): [number, number] | null {
      const avg = (vals: number[]): number => 
        vals.reduce((agg, v) => agg + v, 0) / vals.length;

      const pointers = d3Pointers(zoomEv, nodeEl);
      
      if (pointers && pointers.length > 1) {
        // Calculate centroid of all points if multi-touch
        return [0, 1].map(idx => avg(pointers.map(t => t[idx]))) as [number, number];
      }
      
      return pointers.length ? pointers[0] : null;
    }
  }
}) as (config?: any) => GeoZoomInstance;
