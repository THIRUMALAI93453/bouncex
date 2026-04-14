import * as THREE from 'three';
import { GAME, COLORS } from './constants';
import { TileManager } from './TileManager';
import { Player } from './Player';
import { AudioManager } from './AudioManager';

export type GameState = 'menu' | 'playing' | 'gameover';

export interface GameCallbacks {
  onScoreUpdate: (score: number, combo: number, diamonds: number) => void;
  onGameOver: (score: number, highScore: number, diamonds: number) => void;
  onStateChange: (state: GameState) => void;
}

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private tileManager: TileManager;
  private player: Player;
  private audio: AudioManager;
  private callbacks: GameCallbacks;
  private state: GameState = 'menu';
  private animationId = 0;
  private lastTime = 0;
  private gameTime = 0;
  private particleSystem: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleLifetimes: Float32Array;
  private highScore = 0;
  private lastBounceZ = 0;
  private isFalling = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.highScore = parseInt(localStorage.getItem('diyaJumperHighScore') || '0');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.BG_TOP);
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, 0.012);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, GAME.CAMERA_HEIGHT, GAME.CAMERA_DISTANCE);

    // Lights
    const ambient = new THREE.AmbientLight(0x332244, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffcc88, 1.0);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    this.scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(COLORS.DIYA_GLOW, 2, 30);
    pointLight1.position.set(0, 3, 0);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(COLORS.RANGOLI_PINK, 1, 20);
    pointLight2.position.set(-3, 2, -5);
    this.scene.add(pointLight2);

    this.createBackground();

    // Particle system
    const pCount = 200;
    this.particlePositions = new Float32Array(pCount * 3);
    this.particleVelocities = new Float32Array(pCount * 3);
    this.particleLifetimes = new Float32Array(pCount);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: COLORS.DIYA_GLOW, size: 0.06, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.particleSystem = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particleSystem);

    // Systems
    this.tileManager = new TileManager(this.scene);
    this.player = new Player(this.scene);
    this.audio = new AudioManager();

    // Input
    this.setupInput();
    window.addEventListener('resize', this.onResize);
  }

  private createBackground() {
    const mountainGeo = new THREE.PlaneGeometry(200, 40, 40, 10);
    const positions = mountainGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      positions[i + 1] += Math.sin(x * 0.1) * 5 + Math.sin(x * 0.3) * 3 + Math.cos(x * 0.05) * 8;
    }
    mountainGeo.computeVertexNormals();
    const mountainMat = new THREE.MeshBasicMaterial({ color: 0x1a0033, side: THREE.DoubleSide });
    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    mountain.position.set(0, 5, -80);
    this.scene.add(mountain);

    const gridHelper = new THREE.GridHelper(200, 80, COLORS.FESTIVAL_PURPLE, 0x220044);
    gridHelper.position.y = -0.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    this.scene.add(gridHelper);

    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 100;
      starPos[i + 1] = Math.random() * 30 + 5;
      starPos[i + 2] = -Math.random() * 80 - 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.7 });
    this.scene.add(new THREE.Points(starGeo, starMat));
  }

  private setupInput() {
    let touchStartX = 0;
    let mouseStartX = 0;
    let isDragging = false;

    const handleInput = (direction: 'left' | 'right') => {
      if (this.state !== 'playing') return;
      // First input starts the ball moving
      this.player.startMoving();
      if (direction === 'left') this.player.moveLeft();
      else this.player.moveRight();
    };

    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') return;
      this.player.startMoving();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleInput('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleInput('right');
      // Any key starts the game
      if (!this.player.getHasStarted()) this.player.startMoving();
    });

    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      if (this.state === 'playing' && !this.player.getHasStarted()) {
        this.player.startMoving();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.state !== 'playing') return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > GAME.SWIPE_THRESHOLD) {
        handleInput(dx < 0 ? 'left' : 'right');
      }
    });

    window.addEventListener('mousedown', (e) => {
      mouseStartX = e.clientX;
      isDragging = true;
      if (this.state === 'playing' && !this.player.getHasStarted()) {
        this.player.startMoving();
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (!isDragging || this.state !== 'playing') { isDragging = false; return; }
      isDragging = false;
      const dx = e.clientX - mouseStartX;
      if (Math.abs(dx) > GAME.SWIPE_THRESHOLD) {
        handleInput(dx < 0 ? 'left' : 'right');
      }
    });
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  start() {
    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.player.reset();
    this.tileManager.reset();
    this.tileManager.generateInitialTiles();
    this.gameTime = 0;
    this.lastBounceZ = 0;
    this.isFalling = false;
    this.lastTime = performance.now();
    this.audio.init();
    this.audio.startBeat(120);
    this.loop(performance.now());
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    this.audio.stopBeat();
  }

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.gameTime += dt;

    if (this.state === 'playing') {
      this.updateGame(dt);
    } else if (this.state === 'gameover') {
      this.player.mesh.position.y -= 3 * dt;
      this.player.mesh.rotation.x += dt * 2;
    }

    // Camera follow
    const p = this.player.getPosition();
    this.camera.position.x += (p.x * 0.5 - this.camera.position.x) * 3 * dt;
    this.camera.position.z = p.z + GAME.CAMERA_DISTANCE;
    this.camera.position.y += (p.y + GAME.CAMERA_HEIGHT - this.camera.position.y) * 2 * dt;
    this.camera.lookAt(p.x * 0.3, p.y + 0.5, p.z - GAME.CAMERA_LOOK_AHEAD);

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private updateGame(dt: number) {
    if (this.isFalling) return;

    const speed = this.tileManager.getForwardSpeed();
    const { ballZ } = this.player.update(dt, speed);
    this.tileManager.update(ballZ, dt, this.gameTime);

    // Skip collision if ball hasn't started yet (sitting on first tile)
    if (!this.player.getHasStarted()) {
      this.callbacks.onScoreUpdate(this.player.score, this.player.combo, this.player.diamonds);
      return;
    }

    const tiles = this.tileManager.getTiles();
    const ballPos = this.player.getPosition();
    const tileTop = GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;

    // Collision detection: check if ball is descending and near tile surface
    let onTile = false;
    if (this.player.velocityY <= 0) {
      for (const tile of tiles) {
        if (!tile.active) continue;
        const dx = Math.abs(ballPos.x - tile.mesh.position.x);
        const dz = Math.abs(ballPos.z - tile.mesh.position.z);

        // Check horizontal overlap
        if (dx < GAME.TILE_WIDTH / 2 + 0.15 && dz < GAME.TILE_DEPTH / 2 + 0.25) {
          // Check vertical: ball must be near or below tile surface
          const tileSurface = tile.mesh.position.y + GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;
          if (ballPos.y <= tileSurface + 0.1) {
            if (tile.isFake) {
              tile.active = false;
              tile.mesh.position.y -= 0.5;
              setTimeout(() => { tile.mesh.visible = false; }, 300);
              continue;
            }

            onTile = true;

            // Only bounce if we moved far enough from last bounce
            if (Math.abs(ballPos.z - this.lastBounceZ) > GAME.TILE_GAP * 0.4) {
              this.player.bounce(tile.mesh.position.y);
              this.lastBounceZ = ballPos.z;
              this.player.combo++;
              this.player.score += 10 + (this.player.combo >= GAME.COMBO_THRESHOLD ? this.player.combo * 2 : 0);
              this.audio.playBounce();
              this.spawnParticles(ballPos.x, tile.mesh.position.y + GAME.TILE_HEIGHT / 2, ballPos.z);

              if (this.player.combo > 0 && this.player.combo % GAME.COMBO_THRESHOLD === 0) {
                this.audio.playCombo();
              }
            } else {
              // Still on tile, snap position to prevent sinking
              this.player.mesh.position.y = Math.max(ballPos.y, tileSurface);
            }

            // Diamond collection
            if (tile.hasDiamond && !tile.collected && tile.diamondMesh) {
              tile.collected = true;
              tile.diamondMesh.visible = false;
              this.player.diamonds++;
              this.player.score += 50;
              this.audio.playDiamond();
            }
            break;
          }
        }
      }
    }

    // Fall to death
    if (ballPos.y < -5) {
      this.gameOver();
      return;
    }

    // If ball is below tile level and not on any tile, start falling
    if (!onTile && this.player.velocityY <= 0 && ballPos.y < tileTop - 0.3) {
      this.isFalling = true;
      this.player.fall();
      setTimeout(() => this.gameOver(), 800);
    }

    this.callbacks.onScoreUpdate(this.player.score, this.player.combo, this.player.diamonds);
  }

  private gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.audio.stopBeat();
    this.audio.playGameOver();
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem('diyaJumperHighScore', String(this.highScore));
    }
    this.callbacks.onGameOver(this.player.score, this.highScore, this.player.diamonds);
    this.callbacks.onStateChange('gameover');
  }

  private spawnParticles(x: number, y: number, z: number) {
    for (let i = 0; i < 15; i++) {
      const idx = i * 3;
      this.particlePositions[idx] = x;
      this.particlePositions[idx + 1] = y;
      this.particlePositions[idx + 2] = z;
      this.particleVelocities[idx] = (Math.random() - 0.5) * 3;
      this.particleVelocities[idx + 1] = Math.random() * 4 + 1;
      this.particleVelocities[idx + 2] = (Math.random() - 0.5) * 3;
      this.particleLifetimes[i] = 1.0;
    }
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.particleLifetimes.length; i++) {
      if (this.particleLifetimes[i] <= 0) continue;
      this.particleLifetimes[i] -= dt * 2;
      const idx = i * 3;
      this.particlePositions[idx] += this.particleVelocities[idx] * dt;
      this.particlePositions[idx + 1] += this.particleVelocities[idx + 1] * dt;
      this.particleVelocities[idx + 1] -= 10 * dt;
      this.particlePositions[idx + 2] += this.particleVelocities[idx + 2] * dt;
      if (this.particleLifetimes[i] <= 0) {
        this.particlePositions[idx + 1] = -100;
      }
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  goToMenu() {
    this.stop();
    this.state = 'menu';
    this.callbacks.onStateChange('menu');
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
