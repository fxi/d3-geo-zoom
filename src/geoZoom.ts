import { select as d3Select, pointers as d3Pointers } from 'd3-selection';
import { zoom as d3Zoom, D3ZoomEvent } from 'd3-zoom';
import { GeoProjection } from 'd3-geo';
import versor from 'versor';
import Kapsule from 'kapsule';

interface State {
  projection?: GeoProjection;
  unityScale: number;
  scaleExtent: [number, number];
  northUp: boolean;
  onMove: (params: { scale: number; rotation: [number, number, number] }) => void;
  zoom?: ReturnType<typeof d3Zoom>;
}

interface Props {
  projection?: GeoProjection;
  scaleExtent?: [number, number];
  northUp?: boolean;
  onMove?: (params: { scale: number; rotation: [number, number, number] }) => void;
}

export default Kapsule<Props, State>({
  props: {
    projection: {
      onChange(projection: GeoProjection | undefined, state: State) {
        state.unityScale = projection ? projection.scale() : 1;
      }
    },
    scaleExtent: {
      default: [0.1, 1e3] as [number, number],
      onChange(extent: [number, number], state: State) {
        state.zoom && state.zoom.scaleExtent(extent);
      }
    },
    northUp: { default: false },
    onMove: { defaultVal: () => {} }
  },

  init(nodeEl: HTMLElement, state: State) {
    // Initialize zoom behavior
    d3Select(nodeEl).call(state.zoom = d3Zoom<HTMLElement, unknown>()
      .scaleExtent(state.scaleExtent)
      .on('start', zoomStarted)
      .on('zoom', zoomed)
    );

    let v0: [number, number, number];
    let r0: [number, number, number];
    let q0: [number, number, number, number];

    function zoomStarted(ev: D3ZoomEvent<HTMLElement, unknown>) {
      if (!state.projection) return;

      const coords = getPointerCoords(ev);
      if (!coords[0] || !coords[1]) return;

      v0 = versor.cartesian(state.projection.invert(coords));
      r0 = state.projection.rotate();
      q0 = versor(r0);
    }

    function zoomed(ev: D3ZoomEvent<HTMLElement, unknown>) {
      if (!state.projection || !v0 || !r0 || !q0) return;

      const scale = ev.transform.k * state.unityScale;
      state.projection.scale(scale);

      const coords = getPointerCoords(ev);
      if (!coords[0] || !coords[1]) return;

      const v1 = versor.cartesian(state.projection.rotate(r0).invert(coords));
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      const rotation = versor.rotation(q1) as [number, number, number];

      if (state.northUp) {
        rotation[2] = 0; // Don't rotate on Z axis
      }

      state.projection.rotate(rotation);
      state.onMove({ scale, rotation });
    }

    function getPointerCoords(zoomEv: D3ZoomEvent<HTMLElement, unknown>): [number, number] {
      const avg = (vals: number[]): number => 
        vals.reduce((agg, v) => agg + v, 0) / vals.length;

      const pointers = d3Pointers(zoomEv, nodeEl);
      
      if (pointers && pointers.length > 1) {
        // Calculate centroid of all points if multi-touch
        return [0, 1].map(idx => avg(pointers.map(t => t[idx]))) as [number, number];
      }
      
      return pointers.length
        ? pointers[0]
        : [undefined, undefined];
    }
  }
});
