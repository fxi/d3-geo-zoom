declare module 'versor' {
  export interface Versor {
    cartesian: (λφ: [number, number]) => [number, number, number];
    rotation: (r: [number, number, number]) => [number, number, number, number];
    multiply: (a: [number, number, number, number], b: [number, number, number, number]) => [number, number, number, number];
    delta: (v0: [number, number, number], v1: [number, number, number]) => [number, number, number, number];
    (r: [number, number, number]): [number, number, number, number];
  }

  const versor: Versor;
  export default versor;
}
