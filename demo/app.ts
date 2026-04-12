/**
 * Interactive Visualization for Observer Quantum World
 * Uses PIXI.js for rendering
 */

import * as PIXI from 'pixi.js';
import { World } from './World';
import { Particle } from './Particle';
import { Observer } from './Observer';

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
  colors: {
    background: 0x0a0a0f,
    observer: 0x00ffff,
    particle: 0xff00ff,
    particleCollapsed: 0x00ff00,
    measurementLine: 0xffffff,
    consensusLine: 0xff6600,
    entanglementLine: 0xff00ff,
    text: 0xe0e0e0,
  },
  sizes: {
    observer: 30,
    particle: 25,
    particleGlow: 40,
  },
  animation: {
    superpositionPulse: 0.05,
    collapseSpeed: 0.3,
  }
};

// ============================================================================
// Visual Classes
// ============================================================================

class ObserverVisual {
  container: PIXI.Container;
  circle: PIXI.Graphics;
  label: PIXI.Text;
  observer: Observer;

  constructor(observer: Observer, x: number, y: number, app: PIXI.Application) {
    this.observer = observer;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create observer circle
    this.circle = new PIXI.Graphics();
    this.circle.beginFill(CONFIG.colors.observer, 0.3);
    this.circle.lineStyle(2, CONFIG.colors.observer, 1);
    this.circle.drawCircle(0, 0, CONFIG.sizes.observer);
    this.circle.endFill();
    this.container.addChild(this.circle);

    // Create label
    this.label = new PIXI.Text(observer.id, {
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: CONFIG.colors.text,
    });
    this.label.anchor.set(0.5);
    this.label.y = CONFIG.sizes.observer + 15;
    this.container.addChild(this.label);

    app.stage.addChild(this.container);
  }

  highlight(): void {
    this.circle.alpha = 1;
    setTimeout(() => {
      this.circle.alpha = 0.3;
    }, 500);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }
}

class ParticleVisual {
  container: PIXI.Container;
  glow: PIXI.Graphics;
  core: PIXI.Graphics;
  label: PIXI.Text;
  particle: Particle;
  isCollapsed: boolean = false;
  pulsePhase: number = 0;

  constructor(particle: Particle, x: number, y: number, app: PIXI.Application) {
    this.particle = particle;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.isCollapsed = particle.isCollapsed('spin');

    // Create glow effect (for superposition)
    this.glow = new PIXI.Graphics();
    this.glow.beginFill(CONFIG.colors.particle, 0.2);
    this.glow.drawCircle(0, 0, CONFIG.sizes.particleGlow);
    this.glow.endFill();
    this.container.addChild(this.glow);

    // Create core
    this.core = new PIXI.Graphics();
    this.updateCoreAppearance();
    this.container.addChild(this.core);

    // Create label
    this.label = new PIXI.Text(this.getSpinText(), {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: CONFIG.colors.text,
      fontWeight: 'bold',
    });
    this.label.anchor.set(0.5);
    this.label.y = CONFIG.sizes.particleGlow + 18;
    this.container.addChild(this.label);

    app.stage.addChild(this.container);
  }

  private getSpinText(): string {
    if (!this.isCollapsed) {
      return '↑↓';
    }
    const value = this.particle.getSuperposition('spin')?.value;
    return value === 'up' ? '↑' : '↓';
  }

  private updateCoreAppearance(): void {
    this.core.clear();
    
    if (this.isCollapsed) {
      // Collapsed state - solid
      this.core.beginFill(CONFIG.colors.particleCollapsed, 1);
      this.core.lineStyle(2, CONFIG.colors.particleCollapsed, 1);
    } else {
      // Superposition - gradient effect
      this.core.beginFill(CONFIG.colors.particle, 0.8);
      this.core.lineStyle(2, CONFIG.colors.particle, 1);
    }
    
    this.core.drawCircle(0, 0, CONFIG.sizes.particle);
    this.core.endFill();
  }

  update(delta: number): void {
    if (!this.isCollapsed) {
      // Pulse animation for superposition
      this.pulsePhase += CONFIG.animation.superpositionPulse;
      const scale = 1 + Math.sin(this.pulsePhase) * 0.2;
      this.glow.scale.set(scale);
      this.glow.alpha = 0.2 + Math.sin(this.pulsePhase) * 0.1;
    } else {
      // Steady state for collapsed
      this.glow.scale.set(1);
      this.glow.alpha = 0.1;
    }

    this.label.text = this.getSpinText();
    this.updateCoreAppearance();
  }

  collapse(): void {
    this.isCollapsed = true;
    
    // Flash effect
    this.core.alpha = 0;
    let flashAlpha = 1;
    const flashInterval = setInterval(() => {
      this.core.alpha = flashAlpha;
      flashAlpha -= 0.1;
      if (flashAlpha <= 0) {
        clearInterval(flashInterval);
        this.core.alpha = 1;
      }
    }, 50);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }
}

class MeasurementLine {
  line: PIXI.Graphics;
  from: PIXI.Container;
  to: PIXI.Container;
  app: PIXI.Application;

  constructor(
    from: PIXI.Container,
    to: PIXI.Container,
    app: PIXI.Application,
    color: number = CONFIG.colors.measurementLine
  ) {
    this.from = from;
    this.to = to;
    this.app = app;
    
    this.line = new PIXI.Graphics();
    this.line.lineStyle(2, color, 0.5);
    this.app.stage.addChildAt(this.line, 0); // Behind other elements
    
    this.draw();
  }

  draw(): void {
    this.line.clear();
    this.line.lineStyle(2, CONFIG.colors.measurementLine, 0.5);
    this.line.moveTo(this.from.x, this.from.y);
    this.line.lineTo(this.to.x, this.to.y);
  }

  setConsensusMode(): void {
    this.line.clear();
    this.line.lineStyle(3, CONFIG.colors.consensusLine, 1);
    this.draw();
  }

  remove(): void {
    this.app.stage.removeChild(this.line);
  }
}

// ============================================================================
// Main Application
// ============================================================================

class QuantumWorldApp {
  app: PIXI.Application;
  world: World;
  observers: ObserverVisual[] = [];
  particles: ParticleVisual[] = [];
  measurementLines: MeasurementLine[] = [];
  currentScenario: string = '';

  constructor() {
    this.initPIXI();
    this.world = new World();
    this.setupInteractions();
    this.setupButtons();
    this.animate();
    
    log('System initialized. Click to create observers.', 'info');
  }

  private initPIXI(): void {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: CONFIG.colors.background,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    const container = document.getElementById('canvas-container')!;
    container.appendChild(this.app.view);
    
    // Make stage interactive (PIXI v7)
    this.app.stage.interactive = true;
    this.app.stage.hitArea = this.app.screen;

    // Handle resize
    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.app.stage.hitArea = this.app.screen;
    });
  }

  private setupInteractions(): void {
    // Click handler (PIXI v7 uses pointer events)
    this.app.stage.on('pointerdown', (e) => {
      const pos = e.global;
      
      // Check if clicked on existing particle
      const clickedParticle = this.particles.find(p => {
        const dx = p.container.x - pos.x;
        const dy = p.container.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.particleGlow;
      });

      if (clickedParticle) {
        this.handleParticleClick(clickedParticle);
      } else {
        // Check if clicked on existing observer
        const clickedObserver = this.observers.find(o => {
          const dx = o.container.x - pos.x;
          const dy = o.container.y - pos.y;
          return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.observer;
        });

        if (!clickedObserver) {
          // Create new observer
          this.createObserver(pos.x, pos.y);
        }
      }
    });
  }

  private createObserver(x: number, y: number): ObserverVisual {
    const id = `Observer-${this.observers.length + 1}`;
    const observer = this.world.createObserver(id);
    const visual = new ObserverVisual(observer, x, y, this.app);
    this.observers.push(visual);
    
    updateStats();
    log(`Created ${id} at (${Math.round(x)}, ${Math.round(y)})`, 'info');
    
    return visual;
  }

  private createParticle(x: number, y: number, entangledWith?: ParticleVisual): ParticleVisual {
    const particle = this.world.createParticle({
      spin: ['up', 'down']
    });
    
    const visual = new ParticleVisual(particle, x, y, this.app);
    this.particles.push(visual);
    
    if (entangledWith) {
      // Create entanglement line
      this.createEntanglementLine(visual, entangledWith);
    }
    
    updateStats();
    log(`Created particle at (${Math.round(x)}, ${Math.round(y)})`, 'quantum');
    
    return visual;
  }

  private createEntangledParticlePair(x1: number, y1: number, x2: number, y2: number): [ParticleVisual, ParticleVisual] {
    const [particleA, particleB] = this.world.createEntangledPair({
      initialStateA: { spin: ['up', 'down'] },
      initialStateB: { spin: ['up', 'down'] },
      correlation: (a: any, b: any) => a !== b
    });

    const visualA = new ParticleVisual(particleA, x1, y1, this.app);
    const visualB = new ParticleVisual(particleB, x2, y2, this.app);
    
    this.particles.push(visualA, visualB);
    
    // Create entanglement line
    this.createEntanglementLine(visualA, visualB);
    
    updateStats();
    log('Created entangled pair', 'quantum');
    
    return [visualA, visualB];
  }

  private createEntanglementLine(particleA: ParticleVisual, particleB: ParticleVisual): void {
    const line = new PIXI.Graphics();
    line.lineStyle(2, CONFIG.colors.entanglementLine, 0.5);
    line.moveTo(particleA.container.x, particleA.container.y);
    line.lineTo(particleB.container.x, particleB.container.y);
    this.app.stage.addChildAt(line, 0);
    
    // Store reference for cleanup
    (line as any)._isEntanglementLine = true;
  }

  private async handleParticleClick(particleVisual: ParticleVisual): Promise<void> {
    if (this.observers.length === 0) {
      log('Create an observer first (click empty space)', 'warning');
      return;
    }

    // Use first observer for simplicity
    const observer = this.observers[0];
    
    log(`${observer.observer.id} measuring particle...`, 'info');
    
    const result = observer.observer.measure(particleVisual.particle, 'spin');
    observer.highlight();
    
    log(`  Result: ${result}`, 'info');
    
    if (this.observers.length > 1) {
      // Multiple observers - enforce consistency
      await this.enforceConsistency(particleVisual);
    }
  }

  private async enforceConsistency(particleVisual: ParticleVisual): Promise<void> {
    log('Multiple observers detected - enforcing consistency...', 'warning');
    
    // Draw consensus lines
    const consensusLines: PIXI.Graphics[] = [];
    this.observers.forEach(obs => {
      const line = new PIXI.Graphics();
      line.lineStyle(3, CONFIG.colors.consensusLine, 0.8);
      line.moveTo(obs.container.x, obs.container.y);
      line.lineTo(particleVisual.container.x, particleVisual.container.y);
      this.app.stage.addChild(line);
      consensusLines.push(line);
    });

    // Enforce consistency
    await this.world.enforceConsistency(
      this.observers.map(o => o.observer),
      particleVisual.particle,
      'spin'
    );

    // Collapse visual
    particleVisual.collapse();
    
    // Remove consensus lines after delay
    setTimeout(() => {
      consensusLines.forEach(line => this.app.stage.removeChild(line));
    }, 1500);

    log('Consensus reached - classical outcome emerged!', 'success');
  }

  private setupButtons(): void {
    document.getElementById('btn-single')!.onclick = () => this.runSingleObserverScenario();
    document.getElementById('btn-double')!.onclick = () => this.runTwoObserversScenario();
    document.getElementById('btn-entangle')!.onclick = () => this.runEntanglementScenario();
    document.getElementById('btn-reset')!.onclick = () => this.reset();
  }

  private async runSingleObserverScenario(): Promise<void> {
    this.reset();
    this.currentScenario = 'single';
    
    log('=== SCENARIO 1: Single Observer (Quantum Regime) ===', 'info');
    
    // Create one observer
    const obs = this.createObserver(window.innerWidth * 0.2, window.innerHeight * 0.5);
    
    // Create particle in superposition
    const particle = this.createParticle(window.innerWidth * 0.5, window.innerHeight * 0.5);
    
    await sleep(1000);
    
    log('Particle is in superposition (↑↓) - no definite state', 'quantum');
    
    await sleep(1000);
    
    log(`${obs.observer.id} measures the particle...`, 'info');
    const result = obs.observer.measure(particle.particle, 'spin');
    obs.highlight();
    
    log(`  Result: ${result}`, 'info');
    log('For single observer, reality is relative - no universal collapse needed', 'quantum');
  }

  private async runTwoObserversScenario(): Promise<void> {
    this.reset();
    this.currentScenario = 'double';
    
    log('=== SCENARIO 2: Two Observers (Classical Emergence) ===', 'info');
    
    // Create two observers
    const obs1 = this.createObserver(window.innerWidth * 0.2, window.innerHeight * 0.3);
    const obs2 = this.createObserver(window.innerWidth * 0.2, window.innerHeight * 0.7);
    
    // Create particle
    const particle = this.createParticle(window.innerWidth * 0.5, window.innerHeight * 0.5);
    
    await sleep(1000);
    
    log('Both observers measure independently...', 'info');
    
    const result1 = obs1.observer.measure(particle.particle, 'spin');
    const result2 = obs2.observer.measure(particle.particle, 'spin');
    
    obs1.highlight();
    obs2.highlight();
    
    log(`  ${obs1.observer.id}: ${result1}`, 'info');
    log(`  ${obs2.observer.id}: ${result2}`, 'info');
    
    await sleep(1000);
    
    if (result1 !== result2) {
      log('⚠️  INCONSISTENCY! They disagree - this cannot persist!', 'warning');
      await sleep(1000);
      await this.enforceConsistency(particle);
    } else {
      log('✓ They agree (by chance) - consistency maintained', 'success');
    }
  }

  private async runEntanglementScenario(): Promise<void() {
    this.reset();
    this.currentScenario = 'entangle';
    
    log('=== SCENARIO 3: Entanglement (Non-local Consistency) ===', 'info');
    
    // Create two observers far apart
    const alice = this.createObserver(window.innerWidth * 0.2, window.innerHeight * 0.5);
    const bob = this.createObserver(window.innerWidth * 0.8, window.innerHeight * 0.5);
    
    // Create entangled pair
    const [particleA, particleB] = this.createEntangledParticlePair(
      window.innerWidth * 0.4, window.innerHeight * 0.5,
      window.innerWidth * 0.6, window.innerHeight * 0.5
    );
    
    await sleep(1000);
    
    log('Alice measures particle A...', 'info');
    const resultA = alice.observer.measure(particleA.particle, 'spin');
    alice.highlight();
    particleA.collapse();
    
    log(`  Alice sees: ${resultA}`, 'info');
    
    await sleep(1000);
    
    log('Bob measures particle B (far away)...', 'info');
    const resultB = bob.observer.measure(particleB.particle, 'spin');
    bob.highlight();
    particleB.collapse();
    
    log(`  Bob sees: ${resultB}`, 'info');
    
    await sleep(1000);
    
    const correlated = resultA !== resultB;
    log(`Correlation check: ${correlated ? '✓ PASS' : '✗ FAIL'}`, correlated ? 'success' : 'warning');
    log('Entanglement = shared consistency constraint', 'quantum');
  }

  private reset(): void {
    // Clear all visuals
    this.observers.forEach(o => this.app.stage.removeChild(o.container));
    this.particles.forEach(p => this.app.stage.removeChild(p.container));
    this.measurementLines.forEach(l => l.remove());
    
    // Remove entanglement lines
    this.app.stage.children.forEach(child => {
      if ((child as any)._isEntanglementLine) {
        this.app.stage.removeChild(child);
      }
    });
    
    this.observers = [];
    this.particles = [];
    this.measurementLines = [];
    this.world.reset();
    
    updateStats();
    clearLog();
    log('World reset', 'info');
  }

  private animate(): void {
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      this.particles.forEach(p => p.update(delta));
    });
    ticker.start();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, type: 'info' | 'warning' | 'success' | 'quantum' = 'info'): void {
  const logEl = document.getElementById('log')!;
  const entry = document.createElement('div');
  entry.className = `entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog(): void {
  document.getElementById('log')!.innerHTML = '';
}

function updateStats(): void {
  const app = (window as any).quantumApp as QuantumWorldApp;
  if (!app) return;
  
  document.getElementById('stat-observers')!.textContent = app.observers.length.toString();
  document.getElementById('stat-particles')!.textContent = app.particles.length.toString();
  
  const mode = app.observers.length <= 1 ? 'Quantum' : 'Classical';
  document.getElementById('stat-mode')!.textContent = mode;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Initialize
// ============================================================================

window.addEventListener('load', () => {
  const app = new QuantumWorldApp();
  (window as any).quantumApp = app;
});
