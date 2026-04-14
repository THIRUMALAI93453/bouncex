import * as THREE from 'three';
import { GAME, COLORS } from './constants';

export class Player {
  mesh: THREE.Mesh;
  trailParticles: THREE.Points;
  velocityY = 0;
  private targetLane = 0;
  private currentLaneX = 0;
  private isAlive = true;
  private trailPositions: Float32Array;
  private trailIndex = 0;
  private hasStarted = false; // Ball stays still until first bounce
  score = 0;
  combo = 0;
  diamonds = 0;
  distance = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(GAME.BALL_RADIUS, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.BALL_COLOR,
      emissive: COLORS.DIYA_GLOW,
      emissiveIntensity: 0.4,
      metalness: 0.1,
      roughness: 0.2,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    // Start on top of first tile: tile.y=0, so ball.y = TILE_HEIGHT/2 + BALL_RADIUS
    const startY = GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;
    this.mesh.position.set(0, startY, 0);
    scene.add(this.mesh);

    // Trail
    const trailCount = 60;
    this.trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: COLORS.TRAIL,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.trailParticles = new THREE.Points(trailGeo, trailMat);
    scene.add(this.trailParticles);
  }

  moveLeft() {
    if (this.targetLane > -1) this.targetLane--;
  }

  moveRight() {
    if (this.targetLane < 1) this.targetLane++;
  }

  startMoving() {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.velocityY = GAME.BOUNCE_VELOCITY;
    }
  }

  update(dt: number, forwardSpeed: number): { ballZ: number } {
    if (!this.isAlive) return { ballZ: this.mesh.position.z };

    // Don't move forward or apply gravity until started
    if (!this.hasStarted) {
      return { ballZ: this.mesh.position.z };
    }

    // Forward movement
    this.mesh.position.z -= forwardSpeed * dt;
    this.distance = Math.abs(this.mesh.position.z);

    // Gravity
    this.velocityY += GAME.GRAVITY * dt;
    this.mesh.position.y += this.velocityY * dt;

    // Lane movement
    const targetX = this.targetLane * GAME.LANE_OFFSET;
    const diff = targetX - this.currentLaneX;
    this.currentLaneX += diff * Math.min(1, GAME.LANE_MOVE_SPEED * dt);
    this.mesh.position.x = this.currentLaneX;

    // Trail update
    const i = (this.trailIndex % 20) * 3;
    this.trailPositions[i] = this.mesh.position.x + (Math.random() - 0.5) * 0.1;
    this.trailPositions[i + 1] = this.mesh.position.y - 0.2;
    this.trailPositions[i + 2] = this.mesh.position.z + 0.3;
    this.trailIndex++;
    this.trailParticles.geometry.attributes.position.needsUpdate = true;

    return { ballZ: this.mesh.position.z };
  }

  bounce(tileY: number) {
    this.velocityY = GAME.BOUNCE_VELOCITY;
    // Snap ball exactly on top of tile surface
    this.mesh.position.y = tileY + GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;
  }

  fall() {
    this.isAlive = false;
    this.velocityY = -2;
  }

  getIsAlive() { return this.isAlive; }
  getHasStarted() { return this.hasStarted; }
  getPosition() { return this.mesh.position; }
  getLane() { return this.targetLane; }

  reset() {
    const startY = GAME.TILE_HEIGHT / 2 + GAME.BALL_RADIUS;
    this.mesh.position.set(0, startY, 0);
    this.velocityY = 0;
    this.targetLane = 0;
    this.currentLaneX = 0;
    this.isAlive = true;
    this.hasStarted = false;
    this.score = 0;
    this.combo = 0;
    this.diamonds = 0;
    this.distance = 0;
    this.trailPositions.fill(0);
  }
}
