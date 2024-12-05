declare module 'versor' {
  export interface Versor {
    cartesian: (λ: number, φ: number) => [number, number, number];
    rotation: (a: [number, number, number]) => [number, number, number, number];
    multiply: (a: [number, number, number, number], b: [number, number, number, number]) => [number, number, number, number];
    delta: (a: [number, number], b: [number, number]) => [number, number, number, number];
  }

  const versor: Versor;
  export default versor;
}
