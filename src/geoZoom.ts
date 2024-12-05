import { select as d3Select, pointers as d3Pointers, BaseType } from 'd3-selection';
import { zoom as d3Zoom, D3ZoomEvent, ZoomBehavior } from 'd3-zoom';
import versor from 'versor';
import Kapsule from 'kapsule';
import { GeoProjection } from 'd3';

interface State {
  projection: GeoProjection | null;
  unityScale: number;
  scaleExtent: [number, number];
  northUp: boolean;
  onMove: (data: { scale: number; rotation: [number, number, number] }) => void;
  zoom: ZoomBehavior<Element, unknown>;
}

type ZoomEvent = D3ZoomEvent<Element, unknown>;

const geoZoom = Kapsule({
  props: {
    projection: {
      onChange(projection: GeoProjection | null, state: State) {
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
    onMove: { default: () => {} }
  },
  init(nodeEl: Element, state: State) {
    state.zoom = d3Zoom()
      .scaleExtent(state.scaleExtent)
      .on('start', zoomStarted)
      .on('zoom', zoomed);

    d3Select(nodeEl).call(state.zoom);

    let v0: [number, number, number];
    let r0: [number, number, number];
    let q0: [number, number, number, number];

    function zoomStarted(ev: ZoomEvent) {
      if (!state.projection) return;

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const [x, y] = coords;
      const projected = state.projection.invert?.([x, y]);
      if (!projected) return;

      v0 = versor.cartesian([projected[0], projected[1]]);
      r0 = state.projection.rotate();
      q0 = versor.rotation(r0);
    }

    function zoomed(ev: ZoomEvent) {
      if (!state.projection || !v0 || !r0 || !q0) return;

      const scale = ev.transform.k * state.unityScale;
      state.projection.scale(scale);

      const coords = getPointerCoords(ev);
      if (!coords) return;

      const [x, y] = coords;
      const projected = state.projection.rotate(r0).invert?.([x, y]);
      if (!projected) return;

      const v1 = versor.cartesian([projected[0], projected[1]]);
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      const rotation = versor.rotation(q1);

      if (state.northUp) {
        rotation[2] = 0; // Don't rotate on Z axis
      }

      // Cast to the correct tuple type
      const finalRotation: [number, number, number] = [rotation[0], rotation[1], rotation[2]];
      
      state.projection.rotate(finalRotation);
      state.onMove({ scale, rotation: finalRotation });
    }

    function getPointerCoords(zoomEv: ZoomEvent): [number, number] | null {
      const pointers = d3Pointers(zoomEv, nodeEl);
      
      if (pointers.length > 1) {
        // Calculate centroid for multi-touch
        const x = pointers.reduce((sum, p) => sum + p[0], 0) / pointers.length;
        const y = pointers.reduce((sum, p) => sum + p[1], 0) / pointers.length;
        return [x, y];
      }
      
      return pointers.length ? pointers[0] : null;
    }
  }
});

export default geoZoom;
