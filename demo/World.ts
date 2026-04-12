import { Observer } from './Observer';
import { Particle } from './Particle';
import { ConsistencyEngine } from './ConsistencyEngine';

/**
 * World - manages observers, particles, and consistency enforcement
 */
export class World {
  observers: Map<string, Observer> = new Map();
  particles: Particle[] = [];
  consistencyEngine: ConsistencyEngine;
  particleCounter: number = 0;

  constructor() {
    this.consistencyEngine = new ConsistencyEngine();
  }

  /**
   * Create a new observer
   */
  createObserver(id: string): Observer {
    const observer = new Observer(id);
    this.observers.set(id, observer);
    console.log(`✓ Created observer: ${id}`);
    return observer;
  }

  /**
   * Create a new particle with properties in superposition
   */
  createParticle(initialState: Record<string, any>): Particle {
    const id = `particle-${this.particleCounter++}`;
    const particle = new Particle(id, initialState);
    this.particles.push(particle);
    console.log(`✓ Created particle: ${id}`);
    return particle;
  }

  /**
   * Create an entangled pair of particles
   */
  createEntangledPair(options: {
    initialStateA: Record<string, any>;
    initialStateB: Record<string, any>;
    correlation: (a: any, b: any) => boolean;
  }): [Particle, Particle] {
    const particleA = this.createParticle(options.initialStateA);
    const particleB = this.createParticle(options.initialStateB);

    // Link them as entangled
    particleA.entangledWith = particleB;
    particleB.entangledWith = particleA;
    particleA.correlation = options.correlation;
    particleB.correlation = options.correlation;

    console.log(`✓ Created entangled pair: ${particleA.id} ↔ ${particleB.id}`);

    return [particleA, particleB];
  }

  /**
   * Enforce consistency between observers for a particle property
   */
  async enforceConsistency(
    observers: Observer[],
    particle: Particle,
    property: string
  ): Promise<any> {
    return this.consistencyEngine.enforceConsistency(observers, particle, property);
  }

  /**
   * Get observer by ID
   */
  getObserver(id: string): Observer | undefined {
    return this.observers.get(id);
  }

  /**
   * Get all observers
   */
  getAllObservers(): Observer[] {
    return Array.from(this.observers.values());
  }

  /**
   * Reset the world (for experiments)
   */
  reset(): void {
    this.observers.clear();
    this.particles = [];
    this.particleCounter = 0;
  }
}
