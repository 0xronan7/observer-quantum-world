/**
 * Networked Observer Quantum World - Interactive Visualization
 * Shows how classical reality emerges from local network consistency
 */

import * as PIXI from 'pixi.js';
import { NetworkedWorld, NetworkedObserver } from './NetworkedObserver';
import { Particle } from './Particle';

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
  colors: {
    background: 0x0a0a0f,
    observer: 0x00ffff,
    observerInconsistent: 0xff6600,
    particle: 0xff00ff,
    particleCollapsed: 0x00ff00,
    connection: 0xffff00,
    connectionWeak: 0x888800,
    measurementLine: 0xffffff,
    consensusWave: 0x00ff00,
    text: 0xe0e0e0,
  },
  sizes: {
    observer: 25,
    particle: 20,
    particleGlow: 35,
  },
  network: {
    defaultRadius: 150,
    maxConnections: 8,
  },
  animation: {
    superpositionPulse: 0.04,
    propagationSpeed: 100, // ms per hop
    waveDuration: 500,
  }
};

// ============================================================================
// Visual Classes
// ============================================================================

class NetworkedObserverVisual {
  container: PIXI.Container;
  circle: PIXI.Graphics;
  label: PIXI.Text;
  observer: NetworkedObserver;
  connectionLines: PIXI.Graphics[] = [];
  isMeasured: boolean = false;
  measuredValue: 'up' | 'down' | null = null;
  isConsistent: boolean = true;
  pulsePhase: number = 0;

  constructor(observer: NetworkedObserver, x: number, y: number, app: PIXI.Application) {
    this.observer = observer;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create observer circle
    this.circle = new PIXI.Graphics();
    this.updateAppearance();
    this.container.addChild(this.circle);

    // Create label
    this.label = new PIXI.Text(observer.id.split('-')[0], {
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: CONFIG.colors.text,
    });
    this.label.anchor.set(0.5);
    this.label.y = CONFIG.sizes.observer + 12;
    this.container.addChild(this.label);

    // Connection lines container (behind observer)
    app.stage.addChildAt(this.container, 0);
  }

  private updateAppearance(): void {
    this.circle.clear();
    
    if (!this.isConsistent && this.isMeasured) {
      // Inconsistent - orange
      this.circle.beginFill(CONFIG.colors.observerInconsistent, 0.6);
      this.circle.lineStyle(2, CONFIG.colors.observerInconsistent, 1);
    } else if (this.isMeasured) {
      // Measured and consistent - cyan
      this.circle.beginFill(CONFIG.colors.observer, 0.4);
      this.circle.lineStyle(2, CONFIG.colors.observer, 1);
    } else {
      // Not measured - dim
      this.circle.beginFill(CONFIG.colors.observer, 0.2);
      this.circle.lineStyle(1, CONFIG.colors.observer, 0.5);
    }
    
    this.circle.drawCircle(0, 0, CONFIG.sizes.observer);
    this.circle.endFill();
  }

  update(delta: number): void {
    if (!this.isMeasured) {
      // Subtle pulse for unmeasured observers
      this.pulsePhase += CONFIG.animation.superpositionPulse;
      const scale = 1 + Math.sin(this.pulsePhase) * 0.1;
      this.circle.scale.set(scale);
    } else {
      this.circle.scale.set(1);
    }

    this.updateAppearance();
  }

  setMeasured(value: 'up' | 'down'): void {
    this.isMeasured = true;
    this.measuredValue = value;
    
    // Flash effect
    this.circle.alpha = 0.3;
    setTimeout(() => {
      this.circle.alpha = 1;
    }, 300);
  }

  setConsistent(consistent: boolean): void {
    this.isConsistent = consistent;
  }

  drawConnections(observers: NetworkedObserverVisual[]): void {
    // Clear old connection lines
    this.connectionLines.forEach(line => line.clear());
    this.connectionLines = [];

    // Draw connections to neighbors
    for (const [neighbor, connection] of this.observer.neighbors.entries()) {
      const neighborVisual = observers.find(o => o.observer === neighbor);
      if (!neighborVisual) continue;

      const line = new PIXI.Graphics();
      const alpha = connection.strength;
      const color = connection.strength > 0.5 ? CONFIG.colors.connection : CONFIG.colors.connectionWeak;
      
      line.lineStyle(2 * alpha, color, alpha * 0.6);
      line.moveTo(0, 0);
      line.lineTo(
        neighborVisual.container.x - this.container.x,
        neighborVisual.container.y - this.container.y
      );

      this.container.addChildAt(line, 0); // Behind observer
      this.connectionLines.push(line);
    }
  }

  highlight(): void {
    this.circle.alpha = 1;
    setTimeout(() => {
      this.circle.alpha = this.isMeasured ? 0.4 : 0.2;
    }, 400);
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
  value: 'up' | 'down' | null = null;

  constructor(particle: Particle, x: number, y: number, app: PIXI.Application) {
    this.particle = particle;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create glow effect
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
    this.label = new PIXI.Text('↑↓', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: CONFIG.colors.text,
      fontWeight: 'bold',
    });
    this.label.anchor.set(0.5);
    this.label.y = CONFIG.sizes.particleGlow + 16;
    this.container.addChild(this.label);

    app.stage.addChild(this.container);
  }

  private updateCoreAppearance(): void {
    this.core.clear();
    
    if (this.isCollapsed) {
      this.core.beginFill(CONFIG.colors.particleCollapsed, 1);
      this.core.lineStyle(2, CONFIG.colors.particleCollapsed, 1);
    } else {
      this.core.beginFill(CONFIG.colors.particle, 0.8);
      this.core.lineStyle(2, CONFIG.colors.particle, 1);
    }
    
    this.core.drawCircle(0, 0, CONFIG.sizes.particle);
    this.core.endFill();
  }

  update(delta: number): void {
    if (!this.isCollapsed) {
      this.pulsePhase += CONFIG.animation.superpositionPulse;
      const scale = 1 + Math.sin(this.pulsePhase) * 0.15;
      this.glow.scale.set(scale);
      this.glow.alpha = 0.2 + Math.sin(this.pulsePhase) * 0.1;
    } else {
      this.glow.scale.set(1);
      this.glow.alpha = 0.1;
    }

    this.label.text = this.value === 'up' ? '↑' : (this.value === 'down' ? '↓' : '↑↓');
    this.updateCoreAppearance();
  }

  collapse(value: 'up' | 'down'): void {
    this.isCollapsed = true;
    this.value = value;
    
    // Flash effect
    this.core.alpha = 0;
    let flashAlpha = 1;
    const flashInterval = setInterval(() => {
      this.core.alpha = flashAlpha;
      flashAlpha -= 0.15;
      if (flashAlpha <= 0) {
        clearInterval(flashInterval);
        this.core.alpha = 1;
      }
    }, 50);
  }

  reset(): void {
    this.isCollapsed = false;
    this.value = null;
  }
}

class PropagationWave {
  graphics: PIXI.Graphics;
  targetX: number;
  targetY: number;
  progress: number = 0;
  speed: number;
  onComplete?: () => void;

  constructor(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    app: PIXI.Application,
    onComplete?: () => void
  ) {
    this.targetX = toX;
    this.targetY = toY;
    this.speed = 1000 / CONFIG.animation.propagationSpeed; // pixels per frame
    this.onComplete = onComplete;

    this.graphics = new PIXI.Graphics();
    this.graphics.lineStyle(3, CONFIG.colors.consensusWave, 0.8);
    this.graphics.moveTo(fromX, fromY);
    this.graphics.lineTo(fromX, fromY); // Start at source
    app.stage.addChild(this.graphics);
  }

  update(): boolean {
    const dx = this.targetX - this.graphics.x;
    const dy = this.targetY - this.graphics.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.speed) {
      // Reached target
      this.graphics.clear();
      this.graphics.lineStyle(3, CONFIG.colors.consensusWave, 0.8);
      this.graphics.moveTo(this.graphics.x, this.graphics.y);
      this.graphics.lineTo(this.targetX, this.targetY);
      
      if (this.onComplete) {
        setTimeout(this.onComplete, CONFIG.animation.waveDuration);
      }
      
      setTimeout(() => {
        this.graphics.clear();
      }, CONFIG.animation.waveDuration);
      
      return true; // Complete
    }

    // Move toward target
    const angle = Math.atan2(dy, dx);
    this.graphics.x += Math.cos(angle) * this.speed;
    this.graphics.y += Math.sin(angle) * this.speed;

    // Redraw line
    this.graphics.clear();
    this.graphics.lineStyle(3, CONFIG.colors.consensusWave, 0.8);
    this.graphics.moveTo(this.graphics.x - Math.cos(angle) * this.speed, this.graphics.y - Math.sin(angle) * this.speed);
    this.graphics.lineTo(this.graphics.x, this.graphics.y);

    return false; // Still propagating
  }
}

// ============================================================================
// Main Application
// ============================================================================

class NetworkedQuantumApp {
  app: PIXI.Application;
  world: NetworkedWorld;
  observers: NetworkedObserverVisual[] = [];
  particles: ParticleVisual[] = [];
  waves: PropagationWave[] = [];
  currentMode: 'free' | 'grid' | 'game' = 'free';
  isPropagating: boolean = false;

  constructor() {
    this.initPIXI();
    this.world = new NetworkedWorld();
    this.setupInteractions();
    this.setupButtons();
    this.setupModeSelector();
    this.animate();
    
    log('Networked Quantum World initialized', 'info');
    log('Click to create observers, they auto-connect to nearby neighbors', 'network');
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
    
    this.app.stage.interactive = true;
    this.app.stage.hitArea = this.app.screen;

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.app.stage.hitArea = this.app.screen;
    });
  }

  private setupInteractions(): void {
    this.app.stage.on('pointerdown', (e) => {
      const pos = e.global;
      
      // Check if clicked on particle
      const clickedParticle = this.particles.find(p => {
        const dx = p.container.x - pos.x;
        const dy = p.container.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.particleGlow;
      });

      if (clickedParticle) {
        this.handleParticleClick(clickedParticle);
      } else {
        // Check if clicked on observer
        const clickedObserver = this.observers.find(o => {
          const dx = o.container.x - pos.x;
          const dy = o.container.y - pos.y;
          return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.observer;
        });

        if (!clickedObserver && this.currentMode === 'free') {
          this.createObserver(pos.x, pos.y);
        }
      }
    });
  }

  private createObserver(x: number, y: number): NetworkedObserverVisual {
    const id = `O-${this.observers.length + 1}`;
    const observer = this.world.createObserver(id, x, y);
    const visual = new NetworkedObserverVisual(observer, x, y, this.app);
    this.observers.push(visual);
    
    // Update all connections
    this.updateAllConnections();
    
    updateStats();
    log(`Created ${id} at (${Math.round(x)}, ${Math.round(y)})`, 'info');
    log(`  Connected to ${observer.neighbors.size} neighbors`, 'network');
    
    return visual;
  }

  private createParticle(x: number, y: number): ParticleVisual {
    const particle = this.world.createParticle({ spin: ['up', 'down'] });
    const visual = new ParticleVisual(particle, x, y, this.app);
    this.particles.push(visual);
    
    updateStats();
    log(`Created particle at (${Math.round(x)}, ${Math.round(y)})`, 'quantum');
    
    return visual;
  }

  private updateAllConnections(): void {
    this.world.updateAllConnections();
    
    // Update visual connections
    this.observers.forEach(obs => {
      obs.drawConnections(this.observers);
    });
    
    updateStats();
  }

  private async handleParticleClick(particleVisual: ParticleVisual): Promise<void> {
    if (this.observers.length === 0) {
      log('Create observers first (click empty space)', 'warning');
      return;
    }

    // Find ALL observers within range of this particle (not just nearest)
    const nearbyObservers = this.observers.filter(obs => {
      const dx = obs.container.x - particleVisual.container.x;
      const dy = obs.container.y - particleVisual.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < CONFIG.network.defaultRadius; // Within communication radius
    });

    if (nearbyObservers.length === 0) {
      log('No observers near this particle', 'warning');
      return;
    }

    log(`${nearbyObservers.length} observer(s) measuring particle...`, 'info');

    // All nearby observers measure
    for (const obs of nearbyObservers) {
      const result = obs.observer.measure(particleVisual.particle, 'spin');
      obs.setMeasured(result);
      obs.highlight();
      log(`  ${obs.observer.id}: ${result}`, 'info');
    }

    // Collapse particle immediately
    const firstResult = nearbyObservers[0].observer.getCached(particleVisual.particle, 'spin');
    particleVisual.collapse(firstResult);

    // Update consistency state
    this.updateConsistencyState();

    // Auto-propagate if multiple observers
    if (this.observers.length > 1 && !this.isPropagating) {
      await sleep(500);
      this.propagateConsistency(particleVisual);
    }
  }

  private updateConsistencyState(): void {
    for (const obs of this.observers) {
      // Check consistency for each particle
      for (const particleVisual of this.particles) {
        const consistent = obs.observer.isConsistentWithNeighbors(
          particleVisual.particle,
          'spin'
        );
        obs.setConsistent(obs.isConsistent && consistent);
      }
    }
  }

  private async propagateConsistency(particleVisual: ParticleVisual): Promise<void> {
    if (this.isPropagating) return;
    this.isPropagating = true;

    log('Propagating consistency through network...', 'network');

    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      const result = this.world.propagateConsistency(particleVisual.particle, 'spin');
      
      // Update visuals
      this.updateConsistencyState();
      this.observers.forEach(obs => obs.update(0));
      
      if (result.updated > 0) {
        log(`  Iteration ${iterations + 1}: Updated ${result.updated} observers`, 'network');
      }
      
      if (result.stillInconsistent === 0) {
        log('✓ Full consensus reached!', 'success');
        break;
      }
      
      await sleep(CONFIG.animation.propagationSpeed);
      iterations++;
    }

    if (iterations >= maxIterations) {
      log('⚠️  Max iterations reached', 'warning');
    }

    // Update particle visual (already collapsed on measurement)
    const value = this.observers[0]?.observer.getCached(particleVisual.particle, 'spin');
    if (value && !particleVisual.value) {
      particleVisual.collapse(value);
    }

    this.isPropagating = false;
    updateStats();
  }

  private setupButtons(): void {
    document.getElementById('btn-create-particle')!.onclick = () => {
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
      this.createParticle(x, y);
    };

    document.getElementById('btn-measure-all')!.onclick = () => {
      if (this.particles.length === 0 || this.observers.length === 0) {
        log('Need both observers and particles', 'warning');
        return;
      }
      
      log('All observers measuring all nearby particles...', 'info');
      
      // Each observer measures ALL particles within range
      let totalMeasurements = 0;
      for (const obs of this.observers) {
        for (const particle of this.particles) {
          const dx = particle.container.x - obs.container.x;
          const dy = particle.container.y - obs.container.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < CONFIG.network.defaultRadius) {
            const result = obs.observer.measure(particle.particle, 'spin');
            obs.setMeasured(result);
            obs.highlight();
            
            // Collapse particle immediately
            particle.collapse(result);
            totalMeasurements++;
          }
        }
      }
      
      this.updateConsistencyState();
      log(`✓ ${totalMeasurements} measurements performed`, 'success');
      
      // Auto-propagate after measurement
      if (this.observers.length > 1 && this.particles.length > 0 && !this.isPropagating) {
        setTimeout(() => {
          this.propagateConsistency(this.particles[0]);
        }, 500);
      }
    };

    document.getElementById('btn-propagate')!.onclick = () => {
      if (this.particles.length > 0) {
        this.propagateConsistency(this.particles[0]);
      } else {
        log('Create a particle first', 'warning');
      }
    };

    document.getElementById('btn-grid')!.onclick = () => {
      this.createGrid();
    };

    document.getElementById('btn-clear')!.onclick = () => {
      this.reset();
    };
  }

  private setupModeSelector(): void {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        (btn as HTMLElement).classList.add('active');
        
        const mode = (btn as HTMLElement).dataset.mode as 'free' | 'grid' | 'game';
        this.currentMode = mode;
        
        document.getElementById('stat-mode')!.textContent = 
          mode.charAt(0).toUpperCase() + mode.slice(1);
        
        log(`Mode: ${mode}`, 'info');
        
        if (mode === 'grid') {
          this.createGrid();
        } else if (mode === 'game') {
          this.createGameOfLife();
        }
      });
    });
  }

  private createGrid(): void {
    this.reset();
    
    const cols = 6;
    const rows = 5;
    const spacing = 120;
    const startX = (window.innerWidth - (cols - 1) * spacing) / 2;
    const startY = (window.innerHeight - (rows - 1) * spacing) / 2;

    log('Creating observer grid...', 'info');

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = startX + x * spacing;
        const py = startY + y * spacing;
        this.createObserver(px, py);
      }
    }

    // Create particle in center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    this.createParticle(centerX, centerY);

    log(`Created ${cols}x${rows} grid`, 'success');
  }

  private createGameOfLife(): void {
    this.reset();
    
    const cols = 8;
    const rows = 6;
    const spacing = 100;
    const startX = (window.innerWidth - (cols - 1) * spacing) / 2;
    const startY = (window.innerHeight - (rows - 1) * spacing) / 2;

    log('Creating Game of Life scenario...', 'info');

    // Create observers
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.random() < 0.75) { // 75% density
          const px = startX + x * spacing;
          const py = startY + y * spacing;
          this.createObserver(px, py);
        }
      }
    }

    // Create multiple particles
    for (let i = 0; i < 3; i++) {
      const px = startX + Math.random() * (cols - 1) * spacing;
      const py = startY + Math.random() * (rows - 1) * spacing;
      this.createParticle(px, py);
    }

    log(`Created ${this.observers.length} observers, ${this.particles.length} particles`, 'success');
  }

  private findNearestParticle(observer: NetworkedObserverVisual): ParticleVisual | null {
    let nearest: ParticleVisual | null = null;
    let minDist = Infinity;

    for (const particle of this.particles) {
      const dx = particle.container.x - observer.container.x;
      const dy = particle.container.y - observer.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = particle;
      }
    }

    return nearest;
  }

  private reset(): void {
    // Clear all visuals
    this.observers.forEach(o => {
      o.connectionLines.forEach(line => line.clear());
      this.app.stage.removeChild(o.container);
    });
    this.particles.forEach(p => this.app.stage.removeChild(p.container));
    
    this.observers = [];
    this.particles = [];
    this.world.reset();
    
    updateStats();
    clearLog();
    log('World cleared', 'info');
  }

  private animate(): void {
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      this.observers.forEach(o => o.update(delta));
      this.particles.forEach(p => p.update(delta));
      
      // Update waves
      this.waves = this.waves.filter(wave => !wave.update());
    });
    ticker.start();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, type: 'info' | 'warning' | 'success' | 'quantum' | 'network' = 'info'): void {
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
  const app = (window as any).quantumApp as NetworkedQuantumApp;
  if (!app) return;
  
  document.getElementById('stat-observers')!.textContent = app.observers.length.toString();
  document.getElementById('stat-particles')!.textContent = app.particles.length.toString();
  
  // Count connections
  let totalConnections = 0;
  app.observers.forEach(obs => {
    totalConnections += obs.observer.neighbors.size;
  });
  totalConnections = Math.floor(totalConnections / 2); // Each connection counted twice
  
  document.getElementById('stat-connections')!.textContent = totalConnections.toString();
  
  // Calculate consistency
  if (app.observers.length > 0 && app.particles.length > 0) {
    let consistent = 0;
    let measured = 0;
    
    app.observers.forEach(obs => {
      if (obs.isMeasured) {
        measured++;
        if (obs.isConsistent) {
          consistent++;
        }
      }
    });
    
    const percentage = measured > 0 ? Math.round((consistent / measured) * 100) : 0;
    document.getElementById('stat-consistency')!.textContent = `${percentage}%`;
  } else {
    document.getElementById('stat-consistency')!.textContent = '-';
  }
}

/**
 * Display git commit hash from Vite build
 */
function displayVersion(): void {
  // Vite injects __GIT_COMMIT_HASH__ during build
  const versionEl = document.getElementById('stat-version');
  if (!versionEl) return;
  
  // @ts-ignore - Vite defines this at build time
  const hash = typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev';
  
  if (hash === 'dev' || !hash) {
    versionEl.textContent = 'dev';
    versionEl.style.color = '#888';
  } else {
    const shortHash = hash.substring(0, 7);
    versionEl.textContent = shortHash;
    versionEl.style.color = '#00ff00';
    versionEl.title = `Commit: ${hash}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Initialize
// ============================================================================

window.addEventListener('load', () => {
  const app = new NetworkedQuantumApp();
  (window as any).quantumApp = app;
  displayVersion();
});
