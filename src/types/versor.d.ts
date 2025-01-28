declare module 'versor' {
  // Main function (fromAngles)
  function versor(angles: [number, number, number]): [number, number, number, number];

  namespace versor {
    export function multiply(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number];
    export function rotation(quaternion: [number, number, number, number]): [number, number, number];
    export function cartesian(e: [number, number]): [number, number, number];
    export function delta(v0: [number, number, number], v1: [number, number, number], alpha?: number): [number, number, number, number];
  }

  export default versor;
}
