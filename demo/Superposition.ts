/**
 * Superposition - represents a quantum property in superposition
 */
export class Superposition<T> {
  possibilities: T[];
  collapsed: boolean = false;
  value: T | null = null;
  amplitude?: Map<T, number>; // Optional probability amplitudes

  constructor(possibilities: T[], amplitudes?: Map<T, number>) {
    this.possibilities = possibilities;
    this.amplitude = amplitudes;
  }

  /**
   * Measure the superposition - collapses to definite value
   */
  measure(): T {
    if (this.collapsed) {
      return this.value!;
    }

    // If amplitudes provided, use weighted probability (Born rule)
    if (this.amplitude) {
      this.value = this.weightedRandom();
    } else {
      // Equal probability for all possibilities
      const index = Math.floor(Math.random() * this.possibilities.length);
      this.value = this.possibilities[index];
    }

    this.collapsed = true;
    return this.value;
  }

  /**
   * Reset superposition (for experiments)
   */
  reset(): void {
    this.collapsed = false;
    this.value = null;
  }

  /**
   * Weighted random selection based on amplitudes
   */
  private weightedRandom(): T {
    if (!this.amplitude) {
      throw new Error('No amplitudes defined');
    }

    // Calculate probabilities from amplitudes (|ψ|²)
    const probabilities: Map<T, number> = new Map();
    let total = 0;

    for (const [state, amp] of this.amplitude.entries()) {
      const prob = Math.pow(Math.abs(amp), 2);
      probabilities.set(state, prob);
      total += prob;
    }

    // Normalize
    const normalized = Math.random() * total;
    let cumulative = 0;

    for (const [state, prob] of probabilities.entries()) {
      cumulative += prob;
      if (normalized <= cumulative) {
        return state;
      }
    }

    // Fallback (shouldn't reach here)
    return this.possibilities[0];
  }
}
