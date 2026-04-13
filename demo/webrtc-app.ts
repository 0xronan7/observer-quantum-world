/**
 * Multiplayer Quantum World - WebRTC Edition
 * Real humans as observers connected via WebRTC
 * Each peer controls their own observer(s)
 */

import * as PIXI from 'pixi.js';
import { NetworkedWorld, NetworkedObserver } from './NetworkedObserver';
import { Particle } from './Particle';

// ============================================================================
// Message Types for Peer Communication
// ============================================================================

interface PeerMessage {
  type: 'observer-created' | 'observer-measured' | 'particle-created' | 'consistency-update' | 'sync-request' | 'sync-response';
  payload: any;
  senderId: string;
  timestamp: number;
}

interface ObserverData {
  id: string;
  ownerId: string; // Peer ID of owner
  x: number;
  y: number;
  isMeasured: boolean;
  measuredValue: 'up' | 'down' | null;
  isConsistent: boolean;
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  isCollapsed: boolean;
  value: 'up' | 'down' | null;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  colors: {
    background: 0x0a0a0f,
    text: 0xe0e0e0,
    myObserver: 0x00ffff,
    peerObserver: 0xff00ff,
    observerInconsistent: 0xff6600,
    particle: 0xff00ff,
    particleCollapsed: 0x00ff00,
    connection: 0xffff00,
    connectionWeak: 0x888800,
    myConnection: 0x00ffff,
    peerConnection: 0xff00ff,
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
    propagationSpeed: 100,
    waveDuration: 500,
  },
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }
};

// ============================================================================
// Visual Classes
// ============================================================================

class ObserverVisual {
  container: PIXI.Container;
  circle: PIXI.Graphics;
  label: PIXI.Text;
  ownerLabel: PIXI.Text;
  observer: NetworkedObserver;
  ownerId: string;
  connectionLines: PIXI.Graphics[] = [];
  isMeasured: boolean = false;
  measuredValue: 'up' | 'down' | null = null;
  isConsistent: boolean = true;
  pulsePhase: number = 0;

  constructor(observer: NetworkedObserver, ownerId: string, x: number, y: number, app: PIXI.Application) {
    this.observer = observer;
    this.ownerId = ownerId;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create observer circle
    this.circle = new PIXI.Graphics();
    this.updateAppearance();
    this.container.addChild(this.circle);

    // Create label
    this.label = new PIXI.Text('O', {
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: CONFIG.colors.background,
      fontWeight: 'bold',
    });
    this.label.anchor.set(0.5);
    this.container.addChild(this.label);

    // Owner label (peer ID short)
    this.ownerLabel = new PIXI.Text(ownerId.substring(0, 6), {
      fontFamily: 'Courier New',
      fontSize: 9,
      fill: ownerId === window.myPeerId ? CONFIG.colors.myObserver : CONFIG.colors.peerObserver,
    });
    this.ownerLabel.anchor.set(0.5);
    this.ownerLabel.y = CONFIG.sizes.observer + 10;
    this.container.addChild(this.ownerLabel);

    app.stage.addChildAt(this.container, 0);
  }

  private updateAppearance(): void {
    this.circle.clear();
    
    const color = this.ownerId === window.myPeerId ? CONFIG.colors.myObserver : CONFIG.colors.peerObserver;
    
    if (!this.isConsistent && this.isMeasured) {
      this.circle.beginFill(CONFIG.colors.observerInconsistent, 0.6);
      this.circle.lineStyle(2, CONFIG.colors.observerInconsistent, 1);
    } else if (this.isMeasured) {
      this.circle.beginFill(color, 0.4);
      this.circle.lineStyle(2, color, 1);
    } else {
      this.circle.beginFill(color, 0.2);
      this.circle.lineStyle(1, color, 0.5);
    }
    
    this.circle.drawCircle(0, 0, CONFIG.sizes.observer);
    this.circle.endFill();
  }

  update(delta: number): void {
    if (!this.isMeasured) {
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
    this.circle.alpha = 0.3;
    setTimeout(() => {
      this.circle.alpha = 1;
    }, 300);
  }

  setConsistent(consistent: boolean): void {
    this.isConsistent = consistent;
  }

  drawConnections(observers: ObserverVisual[]): void {
    this.connectionLines.forEach(line => line.clear());
    this.connectionLines = [];

    for (const [neighbor, connection] of this.observer.neighbors.entries()) {
      const neighborVisual = observers.find(o => o.observer === neighbor);
      if (!neighborVisual) continue;

      const line = new PIXI.Graphics();
      const alpha = connection.strength;
      const isMyObserver = neighborVisual.ownerId === window.myPeerId;
      const color = isMyObserver ? CONFIG.colors.myConnection : CONFIG.colors.peerConnection;
      
      line.lineStyle(2 * alpha, color, alpha * 0.6);
      line.moveTo(0, 0);
      line.lineTo(
        neighborVisual.container.x - this.container.x,
        neighborVisual.container.y - this.container.y
      );

      this.container.addChildAt(line, 0);
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

    this.glow = new PIXI.Graphics();
    this.glow.beginFill(CONFIG.colors.particle, 0.2);
    this.glow.drawCircle(0, 0, CONFIG.sizes.particleGlow);
    this.glow.endFill();
    this.container.addChild(this.glow);

    this.core = new PIXI.Graphics();
    this.updateCoreAppearance();
    this.container.addChild(this.core);

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

// ============================================================================
// Main Application
// ============================================================================

class WebRTCQuantumApp {
  app: PIXI.Application;
  world: NetworkedWorld;
  observers: ObserverVisual[] = [];
  particles: ParticleVisual[] = [];
  peer: any = null;
  connections: Map<string, any> = new Map();
  peerObservers: Map<string, ObserverData[]> = new Map(); // peerId -> observers
  isPropagating: boolean = false;
  myObservers: NetworkedObserver[] = [];

  constructor() {
    this.initPIXI();
    this.world = new NetworkedWorld();
    this.initWebRTC();
    this.setupInteractions();
    this.setupButtons();
    this.animate();
    
    log('Multiplayer Quantum World initialized', 'info');
    log('Connecting to WebRTC signaling server...', 'network');
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

  private initWebRTC(): void {
    // Generate unique peer ID
    const peerId = 'observer-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36).substring(4);
    window.myPeerId = peerId;

    // Initialize PeerJS
    this.peer = new Peer(peerId, {
      debug: 2,
      config: {
        iceServers: CONFIG.webrtc.iceServers,
      },
    });

    this.peer.on('open', (id: string) => {
      log(`Connected to signaling server`, 'success');
      log(`Your ID: ${id}`, 'peer');
      document.getElementById('my-peer-id')!.textContent = id;
      document.getElementById('connection-status')!.textContent = '🌐 Connected - Share your ID!';
      document.getElementById('connection-status')!.className = 'connected';
      this.enableControls();
      updateStats();
    });

    this.peer.on('connection', (conn: any) => {
      this.handleConnection(conn);
    });

    this.peer.on('error', (err: any) => {
      log(`WebRTC Error: ${err.type}`, 'warning');
      log(`  ${err.message}`, 'warning');
      document.getElementById('connection-status')!.textContent = '❌ Connection Error';
      document.getElementById('connection-status')!.className = 'disconnected';
    });

    this.peer.on('disconnected', () => {
      log('Disconnected from signaling server', 'warning');
      document.getElementById('connection-status')!.textContent = '🔄 Reconnecting...';
      document.getElementById('connection-status')!.className = 'connecting';
      
      // Try to reconnect
      setTimeout(() => {
        this.peer.reconnect();
      }, 3000);
    });
  }

  private handleConnection(conn: any): void {
    const peerId = conn.peer;
    log(`Incoming connection from ${peerId}`, 'peer');
    
    this.connections.set(peerId, conn);
    this.peerObservers.set(peerId, []);
    
    conn.on('open', () => {
      log(`✓ Connected to ${peerId}`, 'success');
      this.updatePeersList();
      
      // Send sync request
      this.sendToPeer(peerId, {
        type: 'sync-request',
        payload: {},
      });
    });

    conn.on('data', (data: PeerMessage) => {
      this.handlePeerMessage(data, peerId);
    });

    conn.on('close', () => {
      log(`Disconnected from ${peerId}`, 'warning');
      this.connections.delete(peerId);
      this.removePeerObservers(peerId);
      this.updatePeersList();
      updateStats();
    });

    conn.on('error', (err: any) => {
      log(`Connection error with ${peerId}: ${err}`, 'warning');
    });
  }

  private handlePeerMessage(data: PeerMessage, senderId: string): void {
    switch (data.type) {
      case 'observer-created':
        this.handleRemoteObserverCreated(data.payload, senderId);
        break;
      case 'observer-measured':
        this.handleRemoteMeasurement(data.payload, senderId);
        break;
      case 'particle-created':
        this.handleRemoteParticleCreated(data.payload, senderId);
        break;
      case 'consistency-update':
        this.handleConsistencyUpdate(data.payload, senderId);
        break;
      case 'sync-request':
        this.handleSyncRequest(senderId);
        break;
      case 'sync-response':
        this.handleSyncResponse(data.payload, senderId);
        break;
    }
  }

  private handleRemoteObserverCreated(data: ObserverData, senderId: string): void {
    log(`Peer ${senderId.substring(0, 8)} created observer at (${data.x}, ${data.y})`, 'peer');
    
    const observer = this.world.createObserver(data.id, data.x, data.y);
    const visual = new ObserverVisual(observer, senderId, data.x, data.y, this.app);
    this.observers.push(visual);
    
    this.updateAllConnections();
    updateStats();
  }

  private handleRemoteMeasurement(data: any, senderId: string): void {
    const { observerId, particleId, value } = data;
    
    const observerVisual = this.observers.find(o => o.observer.id === observerId);
    const particleVisual = this.particles.find(p => p.particle.id === particleId);
    
    if (observerVisual && particleVisual) {
      observerVisual.setMeasured(value);
      observerVisual.highlight();
      log(`Peer ${senderId.substring(0, 8)} measured ${value}`, 'quantum');
      
      this.updateConsistencyState();
    }
  }

  private handleRemoteParticleCreated(data: ParticleData, senderId: string): void {
    log(`Peer ${senderId.substring(0, 8)} created particle`, 'quantum');
    
    const particle = this.world.createParticle({ spin: ['up', 'down'] });
    const visual = new ParticleVisual(particle, data.x, data.y, this.app);
    this.particles.push(visual);
    
    updateStats();
  }

  private handleConsistencyUpdate(data: any, senderId: string): void {
    // Remote peer propagated consistency - update local state
    log(`Consistency update from ${senderId.substring(0, 8)}`, 'network');
    this.updateConsistencyState();
  }

  private handleSyncRequest(senderId: string): void {
    log(`Sync request from ${senderId.substring(0, 8)}`, 'network');
    
    // Send all my observers and particles
    const observersData = this.myObservers.map((obs, idx) => ({
      id: obs.id,
      ownerId: window.myPeerId,
      x: obs.x,
      y: obs.y,
      isMeasured: false,
      measuredValue: null as 'up' | 'down' | null,
      isConsistent: true,
    }));

    const particlesData = this.particles.map(p => ({
      id: p.particle.id,
      x: p.container.x,
      y: p.container.y,
      isCollapsed: p.isCollapsed,
      value: p.value,
    }));

    this.sendToPeer(senderId, {
      type: 'sync-response',
      payload: {
        observers: observersData,
        particles: particlesData,
      },
    });
  }

  private handleSyncResponse(data: any, senderId: string): void {
    log(`Sync response from ${senderId.substring(0, 8)}`, 'network');
    
    // Add remote observers
    if (data.observers) {
      for (const obsData of data.observers) {
        const observer = this.world.createObserver(obsData.id, obsData.x, obsData.y);
        const visual = new ObserverVisual(observer, senderId, obsData.x, obsData.y, this.app);
        this.observers.push(visual);
      }
    }
    
    // Add remote particles
    if (data.particles) {
      for (const pData of data.particles) {
        const particle = this.world.createParticle({ spin: ['up', 'down'] });
        const visual = new ParticleVisual(particle, pData.x, pData.y, this.app);
        if (pData.isCollapsed) {
          visual.collapse(pData.value!);
        }
        this.particles.push(visual);
      }
    }
    
    this.updateAllConnections();
    updateStats();
  }

  private sendToPeer(peerId: string, message: PeerMessage): void {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
    }
  }

  private broadcast(message: PeerMessage): void {
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  private connectToPeer(peerId: string): void {
    if (peerId === window.myPeerId) {
      log('Cannot connect to yourself!', 'warning');
      return;
    }

    if (this.connections.has(peerId)) {
      log(`Already connected to ${peerId}`, 'warning');
      return;
    }

    log(`Connecting to ${peerId}...`, 'network');
    const conn = this.peer.connect(peerId);
    this.handleConnection(conn);
  }

  private createObserver(x: number, y: number): ObserverVisual {
    const id = `O-${window.myPeerId.substring(0, 6)}-${this.myObservers.length + 1}`;
    const observer = this.world.createObserver(id, x, y);
    this.myObservers.push(observer);
    
    const visual = new ObserverVisual(observer, window.myPeerId, x, y, this.app);
    this.observers.push(visual);
    
    this.updateAllConnections();
    
    // Broadcast to peers
    this.broadcast({
      type: 'observer-created',
      payload: {
        id: observer.id,
        ownerId: window.myPeerId,
        x: x,
        y: y,
        isMeasured: false,
        measuredValue: null,
        isConsistent: true,
      },
      senderId: window.myPeerId,
      timestamp: Date.now(),
    });
    
    updateStats();
    log(`Created observer at (${Math.round(x)}, ${Math.round(y)})`, 'info');
    
    return visual;
  }

  private createParticle(x: number, y: number): ParticleVisual {
    try {
      const particle = this.world.createParticle({ spin: ['up', 'down'] });
      const visual = new ParticleVisual(particle, x, y, this.app);
      this.particles.push(visual);
      
      // Broadcast to peers
      this.broadcast({
        type: 'particle-created',
        payload: {
          id: particle.id,
          x: x,
          y: y,
          isCollapsed: false,
          value: null,
        },
        senderId: window.myPeerId,
        timestamp: Date.now(),
      });
      
      updateStats();
      log(`Created particle at (${Math.round(x)}, ${Math.round(y)})`, 'quantum');
      
      return visual;
    } catch (error) {
      log(`Error creating particle: ${error}`, 'warning');
      console.error(error);
      throw error;
    }
  }

  private updateAllConnections(): void {
    this.world.updateAllConnections();
    this.observers.forEach(obs => obs.drawConnections(this.observers));
    updateStats();
  }

  private updateConsistencyState(): void {
    for (const obs of this.observers) {
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

    // Broadcast consistency update
    this.broadcast({
      type: 'consistency-update',
      payload: {},
      senderId: window.myPeerId,
      timestamp: Date.now(),
    });

    this.isPropagating = false;
    updateStats();
  }

  private setupInteractions(): void {
    this.app.stage.on('pointerdown', (e) => {
      const pos = e.global;
      
      const clickedParticle = this.particles.find(p => {
        const dx = p.container.x - pos.x;
        const dy = p.container.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.particleGlow;
      });

      if (clickedParticle) {
        this.handleParticleClick(clickedParticle);
      } else {
        const clickedObserver = this.observers.find(o => {
          const dx = o.container.x - pos.x;
          const dy = o.container.y - pos.y;
          return Math.sqrt(dx * dx + dy * dy) < CONFIG.sizes.observer;
        });

        if (!clickedObserver) {
          this.createObserver(pos.x, pos.y);
        }
      }
    });
  }

  private async handleParticleClick(particleVisual: ParticleVisual): Promise<void> {
    if (this.myObservers.length === 0) {
      log('Create your observer first (click empty space)', 'warning');
      return;
    }

    const nearbyObservers = this.observers.filter(obs => {
      const dx = obs.container.x - particleVisual.container.x;
      const dy = obs.container.y - particleVisual.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < CONFIG.network.defaultRadius;
    });

    if (nearbyObservers.length === 0) {
      log('No observers near this particle', 'warning');
      return;
    }

    log(`${nearbyObservers.length} observer(s) measuring particle...`, 'info');

    for (const obs of nearbyObservers) {
      const result = obs.observer.measure(particleVisual.particle, 'spin');
      obs.setMeasured(result);
      obs.highlight();
      
      // Broadcast measurement
      this.broadcast({
        type: 'observer-measured',
        payload: {
          observerId: obs.observer.id,
          particleId: particleVisual.particle.id,
          value: result,
        },
        senderId: window.myPeerId,
        timestamp: Date.now(),
      });
    }

    const firstResult = nearbyObservers[0].observer.getCached(particleVisual.particle, 'spin');
    particleVisual.collapse(firstResult);
    this.updateConsistencyState();

    if (this.observers.length > 1 && !this.isPropagating) {
      await sleep(500);
      this.propagateConsistency(particleVisual);
    }
  }

  private setupButtons(): void {
    document.getElementById('connect-btn')!.onclick = () => {
      const peerId = (document.getElementById('peer-id-input') as HTMLInputElement).value.trim();
      if (peerId) {
        this.connectToPeer(peerId);
      }
    };

    document.getElementById('copy-btn')!.onclick = () => {
      const id = window.myPeerId;
      navigator.clipboard.writeText(id).then(() => {
        log('ID copied to clipboard!', 'success');
      });
    };

    document.getElementById('btn-create-observer')!.onclick = () => {
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 300;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
      this.createObserver(x, y);
    };

    document.getElementById('btn-create-particle')!.onclick = () => {
      log('Creating particle...', 'info');
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
      try {
        this.createParticle(x, y);
        log('✓ Particle created successfully', 'success');
      } catch (error) {
        log(`✗ Failed to create particle: ${error}`, 'warning');
      }
    };

    document.getElementById('btn-measure-all')!.onclick = () => {
      if (this.particles.length === 0 || this.myObservers.length === 0) {
        log('Need both observers and particles', 'warning');
        return;
      }
      
      log('All observers measuring all nearby particles...', 'info');
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
            particle.collapse(result);
            totalMeasurements++;
            
            this.broadcast({
              type: 'observer-measured',
              payload: {
                observerId: obs.observer.id,
                particleId: particle.particle.id,
                value: result,
              },
              senderId: window.myPeerId,
              timestamp: Date.now(),
            });
          }
        }
      }
      
      this.updateConsistencyState();
      log(`✓ ${totalMeasurements} measurements performed`, 'success');
      
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

    document.getElementById('btn-clear')!.onclick = () => {
      this.reset();
    };
  }

  private updatePeersList(): void {
    const listEl = document.getElementById('peers-list')!;
    
    if (this.connections.size === 0) {
      listEl.innerHTML = '<div style="color: #666; font-size: 11px; padding: 8px;">No peers connected yet</div>';
      return;
    }

    listEl.innerHTML = '';
    this.connections.forEach((conn, peerId) => {
      const entry = document.createElement('div');
      entry.className = `peer-entry ${conn.open ? 'connected' : 'connecting'}`;
      
      const idSpan = document.createElement('span');
      idSpan.className = 'peer-id';
      idSpan.textContent = peerId;
      
      const statusSpan = document.createElement('span');
      statusSpan.className = `peer-status ${conn.open ? 'connected' : 'connecting'}`;
      statusSpan.textContent = conn.open ? 'Connected' : 'Connecting';
      
      entry.appendChild(idSpan);
      entry.appendChild(statusSpan);
      listEl.appendChild(entry);
    });
    
    updateStats();
  }

  private removePeerObservers(peerId: string): void {
    const peerObs = this.observers.filter(o => o.ownerId === peerId);
    peerObs.forEach(obs => {
      this.observers = this.observers.filter(o => o !== obs);
      this.app.stage.removeChild(obs.container);
    });
  }

  private enableControls(): void {
    const buttons = document.querySelectorAll('#controls button');
    buttons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = false;
    });
    log('Controls enabled - you can create observers and particles!', 'success');
  }

  private reset(): void {
    this.observers.forEach(o => {
      o.connectionLines.forEach(line => line.clear());
      this.app.stage.removeChild(o.container);
    });
    this.particles.forEach(p => this.app.stage.removeChild(p.container));
    
    this.observers = [];
    this.particles = [];
    this.myObservers = [];
    this.world.reset();
    
    // Broadcast reset
    this.broadcast({
      type: 'sync-request',
      payload: { reset: true },
      senderId: window.myPeerId,
      timestamp: Date.now(),
    });
    
    updateStats();
    clearLog();
    log('World cleared', 'info');
  }

  private animate(): void {
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      this.observers.forEach(o => o.update(delta));
      this.particles.forEach(p => p.update(delta));
    });
    ticker.start();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, type: string = 'info'): void {
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
  const app = (window as any).quantumApp as WebRTCQuantumApp;
  if (!app) return;
  
  document.getElementById('stat-my-observers')!.textContent = app.myObservers.length.toString();
  document.getElementById('stat-total-observers')!.textContent = app.observers.length.toString();
  document.getElementById('stat-peers')!.textContent = app.connections.size.toString();
  document.getElementById('stat-particles')!.textContent = app.particles.length.toString();
  
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

function displayVersion(): void {
  const versionEl = document.getElementById('stat-version');
  if (!versionEl) return;
  
  // @ts-ignore
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

declare global {
  interface Window {
    myPeerId: string;
    quantumApp: WebRTCQuantumApp;
  }
}

window.addEventListener('load', () => {
  const app = new WebRTCQuantumApp();
  window.quantumApp = app;
  displayVersion();
});
