declare module 'versor' {
  function versor(angles: [number, number, number]): [number, number, number, number];

  namespace versor {
    function multiply(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number];
    function rotation(angles: [number, number, number]): [number, number, number, number];
    function toAngles(quaternion: [number, number, number, number]): [number, number, number];
    function fromAngles(angles: [number, number, number]): [number, number, number, number];
    function interpolate(a: [number, number], b: [number, number]): (t: number) => [number, number, number];
    function cartesian(e: [number, number]): [number, number, number];
    function delta(v0: [number, number, number], v1: [number, number, number], alpha?: number): [number, number, number, number];
  }

  export = versor;
}
