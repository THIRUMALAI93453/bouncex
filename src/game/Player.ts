import * as THREE from 'three';
import { GAME, COLORS } from './constants';

export class Player {
  mesh: THREE.Mesh;
  trailParticles: THREE.Points;
  private velocity = { x: 0, y: GAME.BOUNCE_VELOCITY, z: 0 };
  private targetLane = 0;
  private currentLaneX = 0;
  private isAlive = true;
  private trailPositions: Float32Array;
  private trailIndex = 0;
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
    this.mesh.position.set(0, 2, 0);
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

  update(dt: number, forwardSpeed: number): { landed: boolean; ballZ: number } {
    if (!this.isAlive) return { landed: false, ballZ: this.mesh.position.z };

    // Forward
    this.mesh.position.z -= forwardSpeed * dt;
    this.distance = Math.abs(this.mesh.position.z);

    // Gravity
    this.velocity.y += GAME.GRAVITY * dt;
    this.mesh.position.y += this.velocity.y * dt;

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

    // Check ground bounce (will be overridden by tile collision)
    let landed = false;
    if (this.mesh.position.y <= GAME.BALL_RADIUS + GAME.TILE_HEIGHT / 2) {
      landed = true;
    }

    return { landed, ballZ: this.mesh.position.z };
  }

  bounce() {
    this.velocity.y = GAME.BOUNCE_VELOCITY;
    this.mesh.position.y = GAME.BALL_RADIUS + GAME.TILE_HEIGHT / 2;
  }

  fall() {
    this.isAlive = false;
    this.velocity.y = -2;
  }

  getIsAlive() { return this.isAlive; }
  getPosition() { return this.mesh.position; }
  getLane() { return this.targetLane; }

  reset() {
    this.mesh.position.set(0, 2, 0);
    this.velocity = { x: 0, y: GAME.BOUNCE_VELOCITY, z: 0 };
    this.targetLane = 0;
    this.currentLaneX = 0;
    this.isAlive = true;
    this.score = 0;
    this.combo = 0;
    this.diamonds = 0;
    this.distance = 0;
    this.trailPositions.fill(0);
  }
}
