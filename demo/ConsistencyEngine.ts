import { Observer } from './Observer';
import { Particle } from './Particle';

/**
 * ConsistencyEngine - enforces agreement between observers
 */
export class ConsistencyEngine {
  /**
   * Enforce consistency across multiple observers for a property
   * This is where "wave function collapse" emerges!
   */
  async enforceConsistency(
    observers: Observer[],
    particle: Particle,
    property: string
  ): Promise<any> {
    // Collect all measurements
    const measurements = observers.map(o => ({
      observer: o,
      value: o.measure(particle, property)
    }));

    // Check for agreement
    const firstValue = measurements[0].value;
    const allAgree = measurements.every(m => m.value === firstValue);

    if (allAgree) {
      console.log(`✓ All observers agree on ${property}: ${firstValue}`);
      return firstValue; // Already consistent
    }

    // Conflict detected!
    console.log(`⚠️  INCONSISTENCY DETECTED for ${property}!`);
    console.log(`   ${measurements.map(m => `${m.observer.id}: ${m.value}`).join(', ')}`);
    console.log('   Running consensus protocol...');

    // Resolve conflict
    const consensus = this.resolveConflict(measurements.map(m => m.value));
    console.log(`   Consensus reached: ${consensus}`);

    // Update all observers to agreed value
    observers.forEach(o => o.setCached(particle, property, consensus));

    // Force particle to collapse to consensus
    particle.forceCollapse(property, consensus);

    console.log(`✓ All observers updated to: ${consensus}`);

    return consensus;
  }

  /**
   * Resolve conflicting measurements
   * Can be enhanced with Born rule, observer weights, etc.
   */
  private resolveConflict(measurements: any[]): any {
    // Simple majority vote
    const counts = new Map<any, number>();
    
    measurements.forEach(m => {
      counts.set(m, (counts.get(m) || 0) + 1);
    });

    // Return most common value
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  /**
   * Enforce consistency for entangled pair
   */
  async enforceEntangledConsistency(
    observers: Observer[],
    particleA: Particle,
    particleB: Particle,
    property: string
  ): Promise<{ a: any; b: any }> {
    // Measure both particles
    const resultA = observers[0].measure(particleA, property);
    const resultB = observers[1]?.measure(particleB, property);

    // Check correlation
    if (particleA.correlation) {
      const correlated = particleA.correlation(resultA, resultB);
      if (!correlated) {
        console.log(`⚠️  Entanglement correlation violated! Enforcing...`);
        // Force correlation
        const validB = particleB.getSuperposition(property)!
          .possibilities
          .filter((v: any) => particleA.correlation!(resultA, v))[0];
        
        if (observers[1]) {
          observers[1].setCached(particleB, property, validB);
        }
        particleB.forceCollapse(property, validB);
        
        return { a: resultA, b: validB };
      }
    }

    return { a: resultA, b: resultB };
  }
}
