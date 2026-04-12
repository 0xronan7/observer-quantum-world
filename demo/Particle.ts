import { Superposition } from './Superposition';

/**
 * Particle - has properties that can be in superposition
 */
export class Particle {
  properties: Map<string, Superposition<any>>;
  entangledWith: Particle | null = null;
  correlation?: (a: any, b: any) => boolean;
  id: string;

  constructor(id: string, initialState: Record<string, any>) {
    this.id = id;
    this.properties = new Map();
    
    // Initialize properties as superpositions
    for (const [key, value] of Object.entries(initialState)) {
      if (Array.isArray(value)) {
        // Array means superposition of possibilities
        this.properties.set(key, new Superposition(value));
      } else {
        // Single value means definite state
        this.properties.set(key, new Superposition([value]));
      }
    }
  }

  /**
   * Get property value (collapses superposition if needed)
   */
  getProperty(property: string): any {
    const superposition = this.properties.get(property);
    
    if (!superposition) {
      throw new Error(`Property ${property} does not exist`);
    }

    // Check if entangled - must collapse partner with correlation
    if (this.entangledWith && !superposition.collapsed) {
      // Measure this particle
      const result = superposition.measure();
      
      // Force entangled partner to collapse with correlation
      this.collapseEntangledPartner(result, property);
      
      return result;
    }

    // Normal measurement
    return superposition.measure();
  }

  /**
   * Force collapse to specific value (from consensus)
   */
  forceCollapse(property: string, value: any): void {
    const superposition = this.properties.get(property);
    
    if (!superposition) {
      throw new Error(`Property ${property} does not exist`);
    }

    superposition.collapsed = true;
    superposition.value = value;
  }

  /**
   * Check if property is collapsed
   */
  isCollapsed(property: string): boolean {
    const superposition = this.properties.get(property);
    return superposition ? superposition.collapsed : false;
  }

  /**
   * Get superposition state
   */
  getSuperposition(property: string): Superposition<any> | undefined {
    return this.properties.get(property);
  }

  /**
   * Collapse entangled partner with correlation constraint
   */
  private collapseEntangledPartner(myResult: any, myProperty: string): void {
    if (!this.entangledWith || !this.correlation) {
      return;
    }

    // Find partner's corresponding property
    const partnerProperty = myProperty; // Same property name for simplicity
    
    const partnerSuperposition = this.entangledWith.getSuperposition(partnerProperty);
    
    if (!partnerSuperposition) {
      return;
    }

    // Find value that satisfies correlation
    const validValues = partnerSuperposition.possibilities.filter(
      partnerValue => this.correlation!(myResult, partnerValue)
    );

    if (validValues.length === 0) {
      throw new Error('No valid correlated state exists!');
    }

    // Collapse partner to correlated state
    const correlatedValue = validValues[0]; // If multiple, pick first (could be random)
    this.entangledWith.forceCollapse(partnerProperty, correlatedValue);
  }

  /**
   * Reset particle to initial superposition state
   */
  reset(initialState: Record<string, any>): void {
    this.properties.clear();
    this.entangledWith = null;
    this.correlation = undefined;
    
    for (const [key, value] of Object.entries(initialState)) {
      if (Array.isArray(value)) {
        this.properties.set(key, new Superposition(value));
      } else {
        this.properties.set(key, new Superposition([value]));
      }
    }
  }
}
