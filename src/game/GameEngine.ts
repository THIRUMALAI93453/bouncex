import * as THREE from 'three';
import { GAME, COLORS } from './constants';
import { TileManager } from './TileManager';
import { Player } from './Player';
import { AudioManager } from './AudioManager';
import { ThemeManager } from './ThemeManager';
import { PowerUpManager } from './PowerUpManager';
import { CameraEffects } from './CameraEffects';
import { SkinManager } from './SkinManager';

export type GameState = 'menu' | 'playing' | 'gameover';

export interface GameCallbacks {
  onScoreUpdate: (score: number, combo: number, diamonds: number) => void;
  onGameOver: (score: number, highScore: number, diamonds: number) => void;
  onStateChange: (state: GameState) => void;
  onFloatingText?: (text: string, color?: string, size?: string) => void;
  onPowerUp?: (type: string, timeLeft: number, duration: number) => void;
  onComboMilestone?: (combo: number) => void;
}

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private tileManager: TileManager;
  private player: Player;
  private audio: AudioManager;
  private themeManager: ThemeManager;
  private powerUpManager: PowerUpManager;
  private cameraEffects: CameraEffects;
  skinManager: SkinManager;
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
  private comboFlameParticles: THREE.Points;
  private comboFlamePositions: Float32Array;
  private comboFlameVelocities: Float32Array;
  private comboFlameLifetimes: Float32Array;
  private lastComboMilestone = 0;
  private isDailyChallenge = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.highScore = parseInt(localStorage.getItem('diyaJumperHighScore') || '0');

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.BG_TOP);
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, 0.012);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, GAME.CAMERA_HEIGHT, GAME.CAMERA_DISTANCE);

    this.setupLights();
    this.createBackground();
    this.setupParticles();
    this.setupComboFlameParticles();

    this.tileManager = new TileManager(this.scene);
    this.player = new Player(this.scene);
    this.audio = new AudioManager();
    this.themeManager = new ThemeManager();
    this.powerUpManager = new PowerUpManager();
    this.cameraEffects = new CameraEffects();
    this.skinManager = new SkinManager();

    this.setupInput();
    window.addEventListener('resize', this.onResize);
  }

  private setupLights() {
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

  private setupParticles() {
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
  }

  private setupComboFlameParticles() {
    const count = 100;
    this.comboFlamePositions = new Float32Array(count * 3);
    this.comboFlameVelocities = new Float32Array(count * 3);
    this.comboFlameLifetimes = new Float32Array(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.comboFlamePositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff4400, size: 0.1, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.comboFlameParticles = new THREE.Points(geo, mat);
    this.scene.add(this.comboFlameParticles);
  }

  private setupInput() {
    let touchStartX = 0;
    let mouseStartX = 0;
    let isDragging = false;

    const handleInput = (direction: 'left' | 'right') => {
      if (this.state !== 'playing') return;
      this.player.startMoving();
      if (direction === 'left') this.player.moveLeft();
      else this.player.moveRight();
    };

    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') return;
      this.player.startMoving();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleInput('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleInput('right');
      if (!this.player.getHasStarted()) this.player.startMoving();
    });

    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      if (this.state === 'playing' && !this.player.getHasStarted()) this.player.startMoving();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.state !== 'playing') return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > GAME.SWIPE_THRESHOLD) handleInput(dx < 0 ? 'left' : 'right');
    });

    window.addEventListener('mousedown', (e) => {
      mouseStartX = e.clientX;
      isDragging = true;
      if (this.state === 'playing' && !this.player.getHasStarted()) this.player.startMoving();
    });
    window.addEventListener('mouseup', (e) => {
      if (!isDragging || this.state !== 'playing') { isDragging = false; return; }
      isDragging = false;
      const dx = e.clientX - mouseStartX;
      if (Math.abs(dx) > GAME.SWIPE_THRESHOLD) handleInput(dx < 0 ? 'left' : 'right');
    });
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  start(dailyChallenge = false) {
    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.player.reset();
    this.tileManager.reset();
    this.themeManager.reset();
    this.powerUpManager.reset();
    this.cameraEffects.reset();
    this.lastComboMilestone = 0;
    this.isDailyChallenge = dailyChallenge;

    if (dailyChallenge) {
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      this.tileManager.setSeed(seed);
    } else {
      this.tileManager.clearSeed();
    }

    // Apply skin
    this.skinManager.applyToMesh(this.player.mesh);
    this.skinManager.applyToTrail(this.player.trailParticles.material as THREE.PointsMaterial);

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
    const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    const { offset, timeScale } = this.cameraEffects.update(rawDt);
    const dt = rawDt * timeScale;
    this.gameTime += dt;

    if (this.state === 'playing') {
      this.updateGame(dt);
      this.powerUpManager.update(dt);

      // Report active power-ups
      if (this.callbacks.onPowerUp) {
        const active = this.powerUpManager.getActive();
        for (const p of active) {
          this.callbacks.onPowerUp(p.type!, p.timeLeft, p.duration);
        }
      }
    } else if (this.state === 'gameover') {
      this.player.mesh.position.y -= 3 * dt;
      this.player.mesh.rotation.x += dt * 2;
    }

    // Camera follow with shake
    const p = this.player.getPosition();
    this.camera.position.x += (p.x * 0.5 - this.camera.position.x) * 3 * rawDt;
    this.camera.position.z = p.z + GAME.CAMERA_DISTANCE;
    this.camera.position.y += (p.y + GAME.CAMERA_HEIGHT - this.camera.position.y) * 2 * rawDt;
    this.camera.position.x += offset.x;
    this.camera.position.y += offset.y;
    this.camera.lookAt(p.x * 0.3, p.y + 0.5, p.z - GAME.CAMERA_LOOK_AHEAD);

    // Theme
    this.themeManager.update(this.player.score, rawDt, this.scene);

    this.updateParticles(dt);
    this.updateComboFlame(dt);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private updateGame(dt: number) {
    if (this.isFalling) return;

    const baseSpeed = this.tileManager.getForwardSpeed();
    const speed = baseSpeed * this.powerUpManager.getSpeedMultiplier();
    const { ballZ } = this.player.update(dt, speed);
    this.tileManager.update(ballZ, dt, this.gameTime);

    if (!this.player.getHasStarted()) {
      this.callbacks.onScoreUpdate(this.player.score, this.player.combo, this.player.diamonds);
      return;
    }

    const tiles = this.tileManager.getTiles();
    const ballPos = this.player.getPosition();
    const tileTop = GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;

    let onTile = false;
    if (this.player.velocityY <= 0) {
      for (const tile of tiles) {
        if (!tile.active) continue;
        const dx = Math.abs(ballPos.x - tile.mesh.position.x);
        const dz = Math.abs(ballPos.z - tile.mesh.position.z);

        if (dx < GAME.TILE_WIDTH / 2 + 0.15 && dz < GAME.TILE_DEPTH / 2 + 0.25) {
          const tileSurface = tile.mesh.position.y + GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;
          if (ballPos.y <= tileSurface + 0.1) {
            if (tile.isFake) {
              tile.active = false;
              tile.mesh.position.y -= 0.5;
              setTimeout(() => { tile.mesh.visible = false; }, 300);
              continue;
            }

            onTile = true;

            if (Math.abs(ballPos.z - this.lastBounceZ) > GAME.TILE_GAP * 0.4) {
              this.player.bounce(tile.mesh.position.y);
              this.lastBounceZ = ballPos.z;
              this.player.combo++;
              const comboBonus = this.player.combo >= GAME.COMBO_THRESHOLD ? this.player.combo * 2 : 0;
              this.player.score += 10 + comboBonus;
              this.audio.playBounce();
              this.spawnParticles(ballPos.x, tile.mesh.position.y + GAME.TILE_HEIGHT / 2, ballPos.z);

              // Floating text
              if (this.callbacks.onFloatingText) {
                const centerDist = Math.abs(ballPos.x - tile.mesh.position.x);
                if (centerDist < 0.15) {
                  this.callbacks.onFloatingText('PERFECT!', '#00ff88', '2rem');
                  this.player.score += 5;
                }
                const pts = 10 + comboBonus;
                this.callbacks.onFloatingText(`+${pts}`, '#ffd700');
              }

              // Combo milestones
              if (this.player.combo >= 3 && this.player.combo !== this.lastComboMilestone) {
                if (this.player.combo % 3 === 0 || this.player.combo % 5 === 0 || this.player.combo % 10 === 0) {
                  this.lastComboMilestone = this.player.combo;
                  if (this.callbacks.onFloatingText) {
                    this.callbacks.onFloatingText(`COMBO x${this.player.combo} 🔥`, '#ff4400', '2.5rem');
                  }
                  if (this.callbacks.onComboMilestone) {
                    this.callbacks.onComboMilestone(this.player.combo);
                  }
                  this.cameraEffects.shake(0.15 + this.player.combo * 0.02);
                  if (this.player.combo >= 10) {
                    this.cameraEffects.triggerSlowMo(0.4, 0.3);
                  }
                  this.audio.playCombo();
                }
              }

              // Power-up collection
              if (tile.powerUp && tile.powerUpMesh) {
                tile.powerUpMesh.visible = false;
                this.powerUpManager.activate(tile.powerUp);
                this.cameraEffects.triggerSlowMo(0.5, 0.3);
                if (this.callbacks.onFloatingText) {
                  const icons: Record<string, string> = { shield: '🛡️ SHIELD', magnet: '🧲 MAGNET', speed: '⚡ SPEED' };
                  this.callbacks.onFloatingText(icons[tile.powerUp] || 'POWER UP', '#00ffff', '2rem');
                }
                tile.powerUp = null;
              }

              // Diamond collection
              if (tile.hasDiamond && !tile.collected && tile.diamondMesh) {
                tile.collected = true;
                tile.diamondMesh.visible = false;
                this.player.diamonds++;
                this.player.score += 50;
                this.audio.playDiamond();
                if (this.callbacks.onFloatingText) {
                  this.callbacks.onFloatingText('+50 💎', '#00e5ff', '1.8rem');
                }
              }
            } else {
              this.player.mesh.position.y = Math.max(ballPos.y, tileSurface);
            }

            // Magnet: auto-collect nearby diamonds
            if (this.powerUpManager.getMagnetActive()) {
              for (const t of tiles) {
                if (t.hasDiamond && !t.collected && t.diamondMesh) {
                  const dist = Math.abs(t.mesh.position.z - ballPos.z);
                  if (dist < 5) {
                    t.collected = true;
                    t.diamondMesh.visible = false;
                    this.player.diamonds++;
                    this.player.score += 50;
                    if (this.callbacks.onFloatingText) {
                      this.callbacks.onFloatingText('+50 💎', '#00e5ff');
                    }
                  }
                }
              }
            }

            break;
          }
        }
      }
    }

    if (ballPos.y < -5) {
      this.gameOver();
      return;
    }

    if (!onTile && this.player.velocityY <= 0 && ballPos.y < tileTop - 0.3) {
      // Shield save
      if (this.powerUpManager.useShield()) {
        this.player.bounce(0);
        this.cameraEffects.shake(0.5);
        if (this.callbacks.onFloatingText) {
          this.callbacks.onFloatingText('🛡️ SAVED!', '#00b4d8', '2.5rem');
        }
      } else {
        this.isFalling = true;
        this.player.fall();
        setTimeout(() => this.gameOver(), 800);
      }
    }

    // Combo flame trail when combo >= 3
    if (this.player.combo >= 3 && this.player.getHasStarted()) {
      this.spawnComboFlame(ballPos.x, ballPos.y, ballPos.z);
    }

    this.callbacks.onScoreUpdate(this.player.score, this.player.combo, this.player.diamonds);
  }

  private gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.audio.stopBeat();
    this.audio.playGameOver();

    // Save diamonds
    const totalDiamonds = this.skinManager.getTotalDiamonds() + this.player.diamonds;
    this.skinManager.setTotalDiamonds(totalDiamonds);

    // Daily challenge score
    if (this.isDailyChallenge) {
      const today = new Date().toISOString().split('T')[0];
      const key = `bounceX_daily_${today}`;
      const best = parseInt(localStorage.getItem(key) || '0');
      if (this.player.score > best) localStorage.setItem(key, String(this.player.score));
    }

    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem('diyaJumperHighScore', String(this.highScore));
    }
    this.callbacks.onGameOver(this.player.score, this.highScore, this.player.diamonds);
    this.callbacks.onStateChange('gameover');
  }

  private spawnParticles(x: number, y: number, z: number) {
    const skin = this.skinManager.getEquipped();
    (this.particleSystem.material as THREE.PointsMaterial).color.setHex(skin.particleColor);
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

  private spawnComboFlame(x: number, y: number, z: number) {
    const intensity = Math.min(this.player.combo / 10, 1);
    const count = Math.floor(2 + intensity * 3);
    for (let i = 0; i < count; i++) {
      const slot = this.comboFlameLifetimes.findIndex(l => l <= 0);
      if (slot === -1) continue;
      const idx = slot * 3;
      this.comboFlamePositions[idx] = x + (Math.random() - 0.5) * 0.2;
      this.comboFlamePositions[idx + 1] = y - 0.2;
      this.comboFlamePositions[idx + 2] = z + 0.3;
      this.comboFlameVelocities[idx] = (Math.random() - 0.5) * 0.5;
      this.comboFlameVelocities[idx + 1] = Math.random() * 2 + 0.5;
      this.comboFlameVelocities[idx + 2] = Math.random() * 1;
      this.comboFlameLifetimes[slot] = 0.5 + Math.random() * 0.3;
    }
    // Color based on combo level
    const mat = this.comboFlameParticles.material as THREE.PointsMaterial;
    if (this.player.combo >= 10) mat.color.setHex(0xff00ff);
    else if (this.player.combo >= 5) mat.color.setHex(0xff8800);
    else mat.color.setHex(0xff4400);
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
      if (this.particleLifetimes[i] <= 0) this.particlePositions[idx + 1] = -100;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  private updateComboFlame(dt: number) {
    for (let i = 0; i < this.comboFlameLifetimes.length; i++) {
      if (this.comboFlameLifetimes[i] <= 0) continue;
      this.comboFlameLifetimes[i] -= dt * 2;
      const idx = i * 3;
      this.comboFlamePositions[idx] += this.comboFlameVelocities[idx] * dt;
      this.comboFlamePositions[idx + 1] += this.comboFlameVelocities[idx + 1] * dt;
      this.comboFlamePositions[idx + 2] += this.comboFlameVelocities[idx + 2] * dt;
      if (this.comboFlameLifetimes[i] <= 0) this.comboFlamePositions[idx + 1] = -100;
    }
    this.comboFlameParticles.geometry.attributes.position.needsUpdate = true;
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
