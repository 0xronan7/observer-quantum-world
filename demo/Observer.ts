import { Particle } from './Particle';
import { Superposition } from './Superposition';

/**
 * Observer - an entity that can make measurements
 */
export class Observer {
  id: string;
  measurements: Map<Particle, Map<string, any>>;
  coherenceLevel: number = 1.0; // How consistent with network

  constructor(id: string) {
    this.id = id;
    this.measurements = new Map();
  }

  /**
   * Measure a particle's property
   */
  measure(particle: Particle, property: string): any {
    // Check if already measured this property
    const cached = this.getCached(particle, property);
    if (cached !== undefined) {
      return cached;
    }

    // Perform measurement (collapses superposition for this observer)
    const result = particle.getProperty(property);

    // Cache result
    this.cache(particle, property, result);

    return result;
  }

  /**
   * Force update a measurement (from consensus)
   */
  setCached(particle: Particle, property: string, value: any): void {
    if (!this.measurements.has(particle)) {
      this.measurements.set(particle, new Map());
    }
    this.measurements.get(particle)!.set(property, value);
  }

  /**
   * Get cached measurement
   */
  getCached(particle: Particle, property: string): any | undefined {
    const particleMeasurements = this.measurements.get(particle);
    if (!particleMeasurements) {
      return undefined;
    }
    return particleMeasurements.get(property);
  }

  /**
   * Cache a measurement result
   */
  private cache(particle: Particle, property: string, result: any): void {
    if (!this.measurements.has(particle)) {
      this.measurements.set(particle, new Map());
    }
    this.measurements.get(particle)!.set(property, result);
  }

  /**
   * Check if observer has measured a property
   */
  hasMeasured(particle: Particle, property: string): boolean {
    return this.getCached(particle, property) !== undefined;
  }

  /**
   * Get all measurements for a particle
   */
  getMeasurementsForParticle(particle: Particle): Map<string, any> {
    return this.measurements.get(particle) || new Map();
  }
}
