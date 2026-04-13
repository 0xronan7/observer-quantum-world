/**
 * Networked Observer Quantum World - Demos
 */

import { NetworkedWorld } from './NetworkedObserver';
import { QuantumGameOfLife } from './QuantumGameOfLife';

console.log('='.repeat(60));
console.log('NETWORKED OBSERVER DEMOS');
console.log('='.repeat(60));
console.log();

// ============================================================================
// Demo 1: Networked Consistency Propagation
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 1: Networked Consistency (Local Propagation)');
console.log('='.repeat(60));
console.log();

const world1 = new NetworkedWorld();

// Create observers in a line
const positions = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 100, y: 0 },
  { x: 150, y: 0 },
  { x: 200, y: 0 },
];

console.log('Creating observer network (line formation)...');
positions.forEach((pos, i) => {
  world1.createObserver(`Obs-${i}`, pos.x, pos.y);
});

console.log(`Created ${world1.observers.length} observers`);
console.log();

// Create one particle near first observer
const particle1 = world1.createParticle({ spin: ['up', 'down'] });
particle1.gridX = 0;
particle1.gridY = 0;

console.log('Particle created near first observer');
console.log();

// First observer measures
const firstObserver = world1.observers[0];
const result1 = firstObserver.measure(particle1, 'spin');
console.log(`First observer measures: ${result1}`);
console.log();

console.log('Initial state: Only first observer has measured');
console.log('Other observers: No measurement yet');
console.log();

await sleep(1000);

console.log('Propagating consistency through network...');
const consensusResult = await world1.reachConsensus(particle1, 'spin');

console.log();
console.log(`Converged: ${consensusResult.converged}`);
console.log(`Iterations: ${consensusResult.iterations}`);
console.log(`Final value: ${consensusResult.finalValue}`);
console.log();

console.log('Key insight: Consistency spreads like a wave through the network!');
console.log('No instant collapse - local agreements propagate gradually.');
console.log();

// ============================================================================
// Demo 2: Quantum Game of Life
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 2: Quantum Game of Life (Cellular Automaton)');
console.log('='.repeat(60));
console.log();

const game = new QuantumGameOfLife(8, 8);

console.log('Creating 8x8 observer grid...');
game.initializeGrid(0.75); // 75% density
console.log();

console.log('Creating quantum particles (random pattern)...');
game.createParticles('random');
console.log();

console.log('Initial grid state:');
game.printGrid();
console.log();

await sleep(1000);

console.log('Observers near particles perform initial measurements...');
game.initialMeasurements();
console.log();

console.log('Grid after initial measurements:');
game.printGrid();
console.log();

await sleep(1000);

console.log('Running consistency propagation (cellular automaton style)...');
console.log('Each timestep: observers update based on neighbor consensus');
console.log();

const result = await game.run(30, 300);

console.log();
console.log('Final grid state:');
game.printGrid();

const stats = game.getStats();
console.log();
console.log('=== Final Statistics ===');
console.log(`Total observers: ${stats.totalObservers}`);
console.log(`Measured: ${stats.measuredObservers}`);
console.log(`Consistent: ${stats.consistentObservers}`);
console.log(`Consistency: ${stats.consistencyPercentage.toFixed(1)}%`);
console.log(`Convergence: ${result.converged ? `Yes (${result.steps} steps)` : 'No'}`);
console.log();

console.log('Key insight: Classical reality emerges from local quantum agreements!');
console.log('The grid shows how consensus spreads like cellular automata.');
console.log();

// ============================================================================
// Demo 3: Multiple Domains (Temporary Disagreement)
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 3: Multiple Domains (Regional Disagreements)');
console.log('='.repeat(60));
console.log();

const world3 = new NetworkedWorld();

// Create two clusters far apart
console.log('Creating two observer clusters (far apart)...');

// Cluster A
for (let i = 0; i < 3; i++) {
  world3.createObserver(`A-${i}`, i * 30, 0);
}

// Cluster B (far away)
for (let i = 0; i < 3; i++) {
  world3.createObserver(`B-${i}`, 300 + i * 30, 0);
}

console.log(`Created ${world3.observers.length} observers in 2 clusters`);
console.log();

// Create one particle measured by both clusters
const particle3 = world3.createParticle({ spin: ['up', 'down'] });

// Both clusters measure independently
const clusterAObserver = world3.observers[0];
const clusterBObserver = world3.observers[3];

const resultA = clusterAObserver.measure(particle3, 'spin');
const resultB = clusterBObserver.measure(particle3, 'spin');

console.log(`Cluster A measures: ${resultA}`);
console.log(`Cluster B measures: ${resultB}`);
console.log();

if (resultA !== resultB) {
  console.log('⚠️  Clusters disagree!');
  console.log('Because they are far apart, no direct communication.');
  console.log('Each cluster is internally consistent, but not globally.');
  console.log();
  
  console.log('This shows how different "realities" can coexist');
  console.log('until information propagates between domains.');
} else {
  console.log('✓ Clusters happen to agree (random chance)');
}

console.log();
console.log('Key insight: Distant regions can have temporary disagreements!');
console.log('Global classical reality requires time for information to propagate.');
console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(60));
console.log('SUMMARY: Networked Observer Model');
console.log('='.repeat(60));
console.log();
console.log('✓ Local consistency: Only neighbors enforce agreement');
console.log('✓ Wave propagation: Consensus spreads gradually');
console.log('✓ Cellular automaton: Grid-based evolution');
console.log('✓ Regional domains: Temporary disagreements possible');
console.log('✓ Emergent classicality: Global agreement from local rules');
console.log();
console.log('This is more realistic than instant global collapse!');
console.log('Information has finite speed → reality emerges locally first.');
console.log();
console.log('='.repeat(60));
console.log('DEMOS COMPLETE');
console.log('='.repeat(60));

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
