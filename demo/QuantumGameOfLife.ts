/**
 * Quantum Game of Life
 * 
 * Observers arranged in a grid measure quantum particles.
 * Consistency propagates like cellular automata.
 * 
 * Shows how classical reality emerges from local quantum agreements.
 */

import { NetworkedWorld } from './NetworkedObserver';
import { Particle } from './Particle';

export interface CellState {
  observerPresent: boolean;
  measuredValue: 'up' | 'down' | null;
  isConsistent: boolean;
  confidence: number;
}

export class QuantumGameOfLife {
  world: NetworkedWorld;
  gridWidth: number;
  gridHeight: number;
  cellSize: number = 50;
  particles: Particle[] = [];
  grid: CellState[][];

  constructor(width: number, height: number) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.world = new NetworkedWorld();
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): CellState[][] {
    const grid: CellState[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row: CellState[] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push({
          observerPresent: false,
          measuredValue: null,
          isConsistent: true,
          confidence: 0,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Initialize grid with observers
   */
  initializeGrid(observerDensity: number = 0.8): void {
    this.grid = this.createEmptyGrid();

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (Math.random() < observerDensity) {
          const observer = this.world.createObserver(
            `O-${x}-${y}`,
            x * this.cellSize,
            y * this.cellSize
          );
          
          this.grid[y][x] = {
            observerPresent: true,
            measuredValue: null,
            isConsistent: true,
            confidence: 0,
          };
        }
      }
    }

    console.log(`Created grid: ${this.gridWidth}x${this.gridHeight}`);
    console.log(`Observers: ${this.world.observers.length}`);
  }

  /**
   * Create quantum particles at specific positions
   */
  createParticles(pattern: 'single' | 'double' | 'grid' | 'random'): void {
    this.particles = [];

    switch (pattern) {
      case 'single':
        // One particle in center
        const cx = Math.floor(this.gridWidth / 2);
        const cy = Math.floor(this.gridHeight / 2);
        const p1 = this.world.createParticle({ spin: ['up', 'down'] });
        p1.gridX = cx;
        p1.gridY = cy;
        this.particles.push(p1);
        break;

      case 'double':
        // Two particles
        const pA = this.world.createParticle({ spin: ['up', 'down'] });
        pA.gridX = Math.floor(this.gridWidth / 3);
        pA.gridY = Math.floor(this.gridHeight / 2);
        
        const pB = this.world.createParticle({ spin: ['up', 'down'] });
        pB.gridX = Math.floor(2 * this.gridWidth / 3);
        pB.gridY = Math.floor(this.gridHeight / 2);
        
        this.particles.push(pA, pB);
        break;

      case 'grid':
        // Particle at each grid intersection
        for (let y = 1; y < this.gridHeight - 1; y += 2) {
          for (let x = 1; x < this.gridWidth - 1; x += 2) {
            const p = this.world.createParticle({ spin: ['up', 'down'] });
            p.gridX = x;
            p.gridY = y;
            this.particles.push(p);
          }
        }
        break;

      case 'random':
        const count = Math.floor((this.gridWidth * this.gridHeight) / 10);
        for (let i = 0; i < count; i++) {
          const p = this.world.createParticle({ spin: ['up', 'down'] });
          p.gridX = Math.floor(Math.random() * this.gridWidth);
          p.gridY = Math.floor(Math.random() * this.gridHeight);
          this.particles.push(p);
        }
        break;
    }

    console.log(`Created ${this.particles.length} particles`);
  }

  /**
   * Find nearest observer to a particle
   */
  findNearestObserver(particle: Particle): any | null {
    const gridX = (particle as any).gridX;
    const gridY = (particle as any).gridY;

    if (gridX === undefined || gridY === undefined) {
      return null;
    }

    // Find closest observer in grid
    let nearest = null;
    let minDist = Infinity;

    for (const observer of this.world.observers) {
      const ox = Math.round(observer.x / this.cellSize);
      const oy = Math.round(observer.y / this.cellSize);
      const dist = Math.sqrt(Math.pow(ox - gridX, 2) + Math.pow(oy - gridY, 2));

      if (dist < minDist) {
        minDist = dist;
        nearest = observer;
      }
    }

    return nearest;
  }

  /**
   * Initial measurement phase - observers near particles measure
   */
  initialMeasurements(): void {
    console.log('\n=== Initial Measurements ===');

    for (const particle of this.particles) {
      const observer = this.findNearestObserver(particle);
      
      if (observer) {
        const result = observer.measure(particle, 'spin');
        const gridX = (particle as any).gridX;
        const gridY = (particle as any).gridY;
        
        if (gridX !== undefined && gridY !== undefined) {
          this.grid[gridY][gridX] = {
            observerPresent: true,
            measuredValue: result,
            isConsistent: true,
            confidence: 1.0,
          };
        }

        console.log(`Particle at (${gridX},${gridY}): ${observer.id} measures ${result}`);
      }
    }
  }

  /**
   * Run one timestep of consistency propagation
   */
  tick(): { updated: number; totalInconsistent: number } {
    let totalUpdated = 0;
    let totalInconsistent = 0;

    // Update network connections
    this.world.updateAllConnections();

    // Propagate consistency for each particle
    for (const particle of this.particles) {
      const result = this.world.propagateConsistency(particle, 'spin');
      totalUpdated += result.updated;
      totalInconsistent += result.stillInconsistent;
    }

    // Update grid visualization state
    this.updateGridState();

    return { updated: totalUpdated, totalInconsistent };
  }

  /**
   * Update grid state for visualization
   */
  private updateGridState(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        
        if (!cell.observerPresent) {
          continue;
        }

        // Find observer at this position
        const observer = this.world.observers.find(o => 
          Math.round(o.x / this.cellSize) === x &&
          Math.round(o.y / this.cellSize) === y
        );

        if (observer) {
          // Check if observer has measured any particle
          let measuredValue: 'up' | 'down' | null = null;
          let isConsistent = true;
          let confidence = 0;

          for (const particle of this.particles) {
            const value = observer.getCached(particle, 'spin');
            if (value !== undefined) {
              measuredValue = value;
              
              const consensus = observer.getNeighborConsensus(particle, 'spin');
              if (consensus) {
                confidence = consensus.confidence;
                isConsistent = (value === consensus.value);
              }
              break; // Just use first measurement
            }
          }

          cell.measuredValue = measuredValue;
          cell.isConsistent = isConsistent;
          cell.confidence = confidence;
        }
      }
    }
  }

  /**
   * Run simulation until consensus or max steps
   */
  async run(maxSteps: number = 100, delayMs: number = 100): Promise<{ converged: boolean; steps: number }> {
    console.log('\n=== Starting Consistency Propagation ===');

    for (let step = 0; step < maxSteps; step++) {
      const result = this.tick();
      
      console.log(`Step ${step + 1}: Updated ${result.updated}, Inconsistent ${result.totalInconsistent}`);

      if (result.totalInconsistent === 0) {
        console.log('✓ Full consensus reached!');
        return { converged: true, steps: step + 1 };
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    console.log('⚠️  Max steps reached without full consensus');
    return { converged: false, steps: maxSteps };
  }

  /**
   * Print grid state (ASCII visualization)
   */
  printGrid(): void {
    console.log('\n=== Grid State ===');
    
    let output = '';
    for (let y = 0; y < this.gridHeight; y++) {
      let row = '';
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        
        if (!cell.observerPresent) {
          row += '· '; // Empty
        } else if (cell.measuredValue === null) {
          row += '? '; // Unmeasured
        } else if (!cell.isConsistent) {
          row += cell.measuredValue === 'up' ? '↑' : '↓'; // Inconsistent
        } else {
          row += cell.measuredValue === 'up' ? '↑' : '↓'; // Consistent
        }
      }
      output += row + '\n';
    }
    console.log(output);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalObservers: number;
    measuredObservers: number;
    consistentObservers: number;
    consistencyPercentage: number;
  } {
    let measured = 0;
    let consistent = 0;

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.observerPresent) {
          if (cell.measuredValue !== null) {
            measured++;
            if (cell.isConsistent) {
              consistent++;
            }
          }
        }
      }
    }

    return {
      totalObservers: this.world.observers.length,
      measuredObservers: measured,
      consistentObservers: consistent,
      consistencyPercentage: measured > 0 ? (consistent / measured) * 100 : 0,
    };
  }

  reset(): void {
    this.world.reset();
    this.particles = [];
    this.grid = this.createEmptyGrid();
  }
}

// ============================================================================
// Demo Runner
// ============================================================================

async function runDemo(): Promise<void> {
  console.log('='.repeat(60));
  console.log('QUANTUM GAME OF LIFE DEMO');
  console.log('='.repeat(60));
  console.log();

  // Create 10x10 grid
  const game = new QuantumGameOfLife(10, 10);
  
  console.log('Creating observer network...');
  game.initializeGrid(0.7); // 70% density
  
  console.log('Creating quantum particles...');
  game.createParticles('random');
  
  console.log('\nInitial state:');
  game.printGrid();
  
  await sleep(1000);
  
  console.log('\nObservers near particles measure...');
  game.initialMeasurements();
  game.printGrid();
  
  await sleep(1000);
  
  console.log('\nPropagating consistency through network...');
  const result = await game.run(50, 200);
  
  console.log('\nFinal state:');
  game.printGrid();
  
  const stats = game.getStats();
  console.log('\n=== Statistics ===');
  console.log(`Total observers: ${stats.totalObservers}`);
  console.log(`Measured: ${stats.measuredObservers}`);
  console.log(`Consistent: ${stats.consistentObservers}`);
  console.log(`Consistency: ${stats.consistencyPercentage.toFixed(1)}%`);
  console.log(`Converged: ${result.converged} (${result.steps} steps)`);
  
  console.log('\n' + '='.repeat(60));
  console.log('DEMO COMPLETE');
  console.log('='.repeat(60));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runDemo();
}

export { runDemo };
