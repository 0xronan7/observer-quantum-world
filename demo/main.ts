/**
 * Observer-Quantum-World Demo
 * 
 * Shows how quantum superposition collapses to classical outcomes
 * through observer consistency requirements.
 */

import { World } from './World';
import { Particle } from './Particle';

console.log('='.repeat(60));
console.log('OBSERVER-QUANTUM-WORLD DEMO');
console.log('='.repeat(60));
console.log();

// ============================================================================
// Demo 1: Single Observer (Quantum Regime)
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 1: Single Observer (Quantum Regime)');
console.log('='.repeat(60));
console.log();

const world1 = new World();
const alice1 = world1.createObserver('Alice');

const particle1 = world1.createParticle({
  spin: ['up', 'down']
});

console.log();
console.log('Particle created in superposition:');
const superposition1 = particle1.getSuperposition('spin');
console.log(`  State: Superposition { possibilities: [${superposition1!.possibilities.join(', ')}], collapsed: ${superposition1!.collapsed} }`);
console.log();

console.log('Alice measures spin...');
const result1 = alice1.measure(particle1, 'spin');
console.log(`  Alice sees: ${result1}`);
console.log();

console.log('Particle state after measurement (for Alice):');
console.log(`  Collapsed: ${particle1.isCollapsed('spin')}`);
console.log();

console.log('Key insight: With only one observer, reality is observer-relative.');
console.log('No universal collapse needed - no one to compare with!');
console.log();

// ============================================================================
// Demo 2: Two Observers (Classical Emergence)
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 2: Two Observers (Classical Emergence)');
console.log('='.repeat(60));
console.log();

const world2 = new World();
const alice2 = world2.createObserver('Alice');
const bob2 = world2.createObserver('Bob');

const particle2 = world2.createParticle({
  spin: ['up', 'down']
});

console.log();
console.log('Both observers measure independently (no communication yet)...');
console.log();

const aliceResult2 = alice2.measure(particle2, 'spin');
const bobResult2 = bob2.measure(particle2, 'spin');

console.log(`Alice sees: ${aliceResult2}`);
console.log(`Bob sees: ${bobResult2}`);
console.log();

if (aliceResult2 !== bobResult2) {
  console.log('⚠️  They disagree! This cannot persist in shared reality.');
  console.log();
} else {
  console.log('✓ They happen to agree (random chance).');
  console.log('Let us force a disagreement to show consensus mechanism...');
  console.log();
  
  // Reset and force disagreement
  particle2.getSuperposition('spin')!.reset();
  alice2.setCached(particle2, 'spin', 'up');
  bob2.setCached(particle2, 'spin', 'down');
  console.log('Forced disagreement:');
  console.log(`  Alice: up`);
  console.log(`  Bob: down`);
  console.log();
}

console.log('Now they compare notes - CONSISTENCY REQUIRED!');
console.log();

await world2.enforceConsistency([alice2, bob2], particle2, 'spin');

console.log();
console.log('After consensus:');
console.log(`  Alice updated: ${alice2.getCached(particle2, 'spin')}`);
console.log(`  Bob updated: ${bob2.getCached(particle2, 'spin')}`);
console.log();

console.log('Key insight: Classical reality emerges from consistency requirement!');
console.log('"Collapse" is just consensus formation between observers.');
console.log();

// ============================================================================
// Demo 3: Entanglement (Non-local Consistency)
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 3: Entanglement (Non-local Consistency)');
console.log('='.repeat(60));
console.log();

const world3 = new World();
const alice3 = world3.createObserver('Alice');
const bob3 = world3.createObserver('Bob');

console.log('Creating entangled pair (anti-correlated spins)...');
const [particleA, particleB] = world3.createEntangledPair({
  initialStateA: { spin: ['up', 'down'] },
  initialStateB: { spin: ['up', 'down'] },
  correlation: (a: any, b: any) => a !== b  // Must be opposite
});
console.log();

console.log('Alice measures particle A...');
const resultA = alice3.measure(particleA, 'spin');
console.log(`  Alice sees: ${resultA}`);
console.log();

console.log('Bob measures particle B (far away)...');
const resultB = bob3.measure(particleB, 'spin');
console.log(`  Bob sees: ${resultB}`);
console.log();

console.log('Checking correlation...');
const correlated = resultA !== resultB;
console.log(`  Correlation maintained: ${correlated}`);
console.log();

if (correlated) {
  console.log('✓ Perfect anti-correlation!');
} else {
  console.log('⚠️  Correlation violated - enforcing consistency...');
  await world3.enforceConsistency([alice3, bob3], particleB, 'spin');
}

console.log();
console.log('Key insight: Entanglement = shared consistency constraint.');
console.log('No "spooky action" - just network consistency enforcement.');
console.log();

// ============================================================================
// Demo 4: Measurement Basis (Uncertainty)
// ============================================================================
console.log('='.repeat(60));
console.log('DEMO 4: Measurement Basis (Uncertainty)');
console.log('='.repeat(60));
console.log();

const world4 = new World();
const alice4 = world4.createObserver('Alice');

const particle4 = world4.createParticle({
  spinZ: ['up', 'down'],
  spinX: ['left', 'right']
});

console.log('Particle with incompatible spin measurements:');
console.log('  spinZ: [up, down]');
console.log('  spinX: [left, right]');
console.log('  These are incompatible bases (like real quantum spin)');
console.log();

console.log('Alice measures spin-Z...');
const resultZ1 = alice4.measure(particle4, 'spinZ');
console.log(`  Result: ${resultZ1}`);
console.log();

console.log('Alice measures spin-X (incompatible basis!)...');
const resultX = alice4.measure(particle4, 'spinX');
console.log(`  Result: ${resultX}`);
console.log();

console.log('Alice measures spin-Z again...');
const resultZ2 = alice4.measure(particle4, 'spinZ');
console.log(`  Result: ${resultZ2}`);
console.log();

if (resultZ1 !== resultZ2) {
  console.log('⚠️  Spin-Z value changed after measuring spin-X!');
  console.log('   This is the uncertainty principle in action.');
} else {
  console.log('✓ Spin-Z stayed the same (50% chance).');
  console.log('   Run again to see uncertainty effect.');
}

console.log();
console.log('Key insight: Uncertainty = incompatible consistency requirements.');
console.log('Measuring one property disturbs incompatible properties.');
console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log();
console.log('✓ Quantum behavior: Single observer, no consistency needed');
console.log('✓ Classical behavior: Multiple observers require agreement');
console.log('✓ Entanglement: Shared consistency constraints');
console.log('✓ Uncertainty: Incompatible measurement bases');
console.log();
console.log('The quantum-classical boundary = the consistency requirement boundary.');
console.log();
console.log('='.repeat(60));
console.log('DEMO COMPLETE');
console.log('='.repeat(60));
