/**
 * Networked Observer Model
 * 
 * Observers form a network and only enforce consistency with neighbors.
 * Classical reality emerges from local consensus propagation.
 */

import { Particle } from './Particle';
import { Superposition } from './Superposition';

export interface ObserverConnection {
  strength: number; // 0-1, how strongly connected
  distance: number;
}

export class NetworkedObserver {
  id: string;
  x: number;
  y: number;
  measurements: Map<Particle, Map<string, any>>;
  neighbors: Map<NetworkedObserver, ObserverConnection>;
  coherenceLevel: number = 1.0;
  communicationRadius: number = 100;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.measurements = new Map();
    this.neighbors = new Map();
  }

  /**
   * Measure a particle's property
   */
  measure(particle: Particle, property: string): any {
    const cached = this.getCached(particle, property);
    if (cached !== undefined) {
      return cached;
    }

    const result = particle.getProperty(property);
    this.cache(particle, property, result);

    return result;
  }

  /**
   * Get measurement from memory
   */
  getCached(particle: Particle, property: string): any | undefined {
    const particleMeasurements = this.measurements.get(particle);
    if (!particleMeasurements) {
      return undefined;
    }
    return particleMeasurements.get(property);
  }

  /**
   * Cache a measurement
   */
  private cache(particle: Particle, property: string, result: any): void {
    if (!this.measurements.has(particle)) {
      this.measurements.set(particle, new Map());
    }
    this.measurements.get(particle)!.set(property, result);
  }

  /**
   * Force update from neighbor consensus
   */
  updateFromConsensus(particle: Particle, property: string, value: any): void {
    this.cache(particle, property, value);
  }

  /**
   * Add/remove neighbors based on distance
   */
  updateNeighbors(allObservers: NetworkedObserver[]): void {
    this.neighbors.clear();

    for (const other of allObservers) {
      if (other === this) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.communicationRadius) {
        // Closer = stronger connection
        const strength = 1 - (distance / this.communicationRadius);
        this.neighbors.set(other, { strength, distance });
      }
    }
  }

  /**
   * Get weighted consensus from neighbors
   */
  getNeighborConsensus(particle: Particle, property: string): { value: any; confidence: number } | null {
    if (this.neighbors.size === 0) {
      return null;
    }

    const votes = new Map<any, number>();
    let totalWeight = 0;

    for (const [neighbor, connection] of this.neighbors.entries()) {
      const neighborValue = neighbor.getCached(particle, property);
      if (neighborValue !== undefined) {
        const currentWeight = votes.get(neighborValue) || 0;
        votes.set(neighborValue, currentWeight + connection.strength);
        totalWeight += connection.strength;
      }
    }

    if (votes.size === 0) {
      return null;
    }

    // Find majority
    let bestValue: any = null;
    let bestWeight = 0;

    for (const [value, weight] of votes.entries()) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestValue = value;
      }
    }

    const confidence = bestWeight / totalWeight;
    return { value: bestValue, confidence };
  }

  /**
   * Check if this observer agrees with neighbors
   */
  isConsistentWithNeighbors(particle: Particle, property: string): boolean {
    const myValue = this.getCached(particle, property);
    if (myValue === undefined) {
      return true; // Haven't measured yet, no inconsistency
    }

    const consensus = this.getNeighborConsensus(particle, property);
    if (!consensus) {
      return true; // No neighbors have measured
    }

    return myValue === consensus.value;
  }
}

/**
 * Networked Consistency Engine
 * 
 * Consistency propagates through the network like a wave.
 * No instant global collapse - only local agreements that spread.
 */
export class NetworkedConsistencyEngine {
  /**
   * Run one iteration of consistency propagation
   * Call this repeatedly to simulate time evolution
   */
  propagateConsistency(
    observers: NetworkedObserver[],
    particle: Particle,
    property: string
  ): { updated: number; stillInconsistent: number } {
    // Find observers who have measured this particle
    const measuredObservers = observers.filter(o => 
      o.getCached(particle, property) !== undefined
    );

    if (measuredObservers.length === 0) {
      return { updated: 0, stillInconsistent: 0 };
    }

    // Find inconsistent observers
    const inconsistentObservers = measuredObservers.filter(o => 
      !o.isConsistentWithNeighbors(particle, property)
    );

    let updatedCount = 0;

    // Each inconsistent observer updates based on neighbor consensus
    for (const observer of inconsistentObservers) {
      const consensus = observer.getNeighborConsensus(particle, property);
      
      if (consensus && consensus.confidence > 0.5) {
        // Update to match neighbors
        observer.updateFromConsensus(particle, property, consensus.value);
        updatedCount++;
      }
    }

    return {
      updated: updatedCount,
      stillInconsistent: inconsistentObservers.length - updatedCount
    };
  }

  /**
   * Run until full consensus or max iterations
   */
  async reachConsensus(
    observers: NetworkedObserver[],
    particle: Particle,
    property: string,
    maxIterations: number = 100
  ): Promise<{ converged: boolean; iterations: number; finalValue: any }> {
    for (let i = 0; i < maxIterations; i++) {
      const result = this.propagateConsistency(observers, particle, property);
      
      if (result.stillInconsistent === 0) {
        // All consistent!
        const finalValue = observers[0].getCached(particle, property);
        return { converged: true, iterations: i + 1, finalValue };
      }

      // Small delay to visualize propagation
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { 
      converged: false, 
      iterations: maxIterations, 
      finalValue: observers[0].getCached(particle, property) 
    };
  }
}

/**
 * Networked World - manages networked observers
 */
export class NetworkedWorld {
  observers: NetworkedObserver[] = [];
  particles: Particle[] = [];
  consistencyEngine: NetworkedConsistencyEngine;

  constructor() {
    this.consistencyEngine = new NetworkedConsistencyEngine();
  }

  createObserver(id: string, x: number, y: number): NetworkedObserver {
    const observer = new NetworkedObserver(id, x, y);
    this.observers.push(observer);
    this.updateAllConnections();
    return observer;
  }

  createParticle(initialState: Record<string, any>): Particle {
    const particle = new Particle(`particle-${this.particles.length}`, initialState);
    this.particles.push(particle);
    return particle;
  }

  updateAllConnections(): void {
    for (const observer of this.observers) {
      observer.updateNeighbors(this.observers);
    }
  }

  propagateConsistency(particle: Particle, property: string) {
    return this.consistencyEngine.propagateConsistency(
      this.observers,
      particle,
      property
    );
  }

  async reachConsensus(particle: Particle, property: string) {
    return this.consistencyEngine.reachConsensus(
      this.observers,
      particle,
      property
    );
  }

  reset(): void {
    this.observers = [];
    this.particles = [];
  }
}
