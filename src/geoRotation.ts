/**
 * A modern TypeScript implementation for handling geographic rotations using quaternions.
 * This replaces the older versor library with a more type-safe and maintainable solution.
 */

const EPSILON = 1e-6;

export type Quaternion = [number, number, number, number];
export type Vector3 = [number, number, number];
export type Angles = [number, number, number];

export class GeoRotation {
  private static readonly RAD_TO_DEG = 180 / Math.PI;
  private static readonly DEG_TO_RAD = Math.PI / 180;

  /**
   * Convert geographic angles (lambda, phi, gamma) to a quaternion
   * @param angles [lambda, phi, gamma] in degrees
   */
  static fromAngles(angles: Angles): Quaternion {
    
    if(!Array.isArray(angles)){
      throw new Error('fromAngles requires an array');
    }

    const [lambda, phi, gamma] = angles.map(a => a * GeoRotation.DEG_TO_RAD);
    const halfLambda = lambda / 2;
    const halfPhi = phi / 2;
    const halfGamma = gamma / 2;

    const cl = Math.cos(halfLambda);
    const sl = Math.sin(halfLambda);
    const cp = Math.cos(halfPhi);
    const sp = Math.sin(halfPhi);
    const cg = Math.cos(halfGamma);
    const sg = Math.sin(halfGamma);

    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }

  /**
   * Convert a quaternion back to geographic angles
   * @param q quaternion
   * @returns [lambda, phi, gamma] in degrees
   */
  static toAngles(q: Quaternion): Angles {
    const [a, b, c, d] = q;
    return [
      Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * GeoRotation.RAD_TO_DEG,
      Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * GeoRotation.RAD_TO_DEG,
      Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * GeoRotation.RAD_TO_DEG
    ];
  }

  /**
   * Multiply two quaternions
   */
  static multiply(a: Quaternion, b: Quaternion): Quaternion {
    const [a1, b1, c1, d1] = a;
    const [a2, b2, c2, d2] = b;
    return [
      a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2,
      a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2,
      a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2,
      a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2
    ];
  }

  /**
   * Convert spherical coordinates to cartesian coordinates
   */
  static cartesian([lambda, phi]: [number, number]): Vector3 {
    const l = lambda * GeoRotation.DEG_TO_RAD;
    const p = phi * GeoRotation.DEG_TO_RAD;
    const cp = Math.cos(p);
    return [cp * Math.cos(l), cp * Math.sin(l), Math.sin(p)];
  }

  /**
   * Calculate the quaternion to rotate between two cartesian points on the sphere
   */
  static delta(v0: Vector3, v1: Vector3, alpha: number = 1): Quaternion {
    function cross([x0, y0, z0]: Vector3, [x1, y1, z1]: Vector3): Vector3 {
      return [
        y0 * z1 - z0 * y1,
        z0 * x1 - x0 * z1,
        x0 * y1 - y0 * x1
      ];
    }

    function dot([x0, y0, z0]: Vector3, [x1, y1, z1]: Vector3): number {
      return x0 * x1 + y0 * y1 + z0 * z1;
    }

    const w = cross(v0, v1);
    const l = Math.sqrt(dot(w, w));
    
    if (l < EPSILON) return [1, 0, 0, 0];
    
    const t = alpha * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))) / 2;
    const s = Math.sin(t);
    
    return [Math.cos(t), w[2] / l * s, -w[1] / l * s, w[0] / l * s];
  }

  /**
   * Interpolate between two sets of angles
   * @param a Starting angles [lambda, phi, gamma] in degrees
   * @param b Ending angles [lambda, phi, gamma] in degrees
   * @param t Interpolation parameter [0-1]
   * @returns Interpolated angles [lambda, phi, gamma] in degrees
   */
  static interpolateAngles(a: Angles, b: Angles, t: number): Angles {
    // Convert angles to quaternions
    const qa = GeoRotation.fromAngles(a);
    const qb = GeoRotation.fromAngles(b);

    // Calculate dot product to determine shortest path
    let dot = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];

    // If dot is negative, we need to negate one quaternion to take shortest path
    if (dot < 0) {
      qb[0] = -qb[0];
      qb[1] = -qb[1];
      qb[2] = -qb[2];
      qb[3] = -qb[3];
      dot = -dot;
    }

    // Use linear interpolation for very close quaternions
    if (dot > 0.9995) {
      return a.map((start, i) => {
        let end = b[i];
        const diff = ((end - start + 180) % 360) - 180;
        return start + diff * t;
      }) as Angles;
    }

    // Use spherical interpolation (slerp) for other cases
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const theta = theta0 * t;
    const s = Math.sin(theta);
    const c = Math.cos(theta);

    // Calculate interpolated quaternion
    const scale1 = c;
    const scale2 = s / Math.sin(theta0);

    const qi: Quaternion = [
      qa[0] * scale1 + qb[0] * scale2,
      qa[1] * scale1 + qb[1] * scale2,
      qa[2] * scale1 + qb[2] * scale2,
      qa[3] * scale1 + qb[3] * scale2
    ];

    // Convert back to angles
    return GeoRotation.toAngles(qi);
  }
}
