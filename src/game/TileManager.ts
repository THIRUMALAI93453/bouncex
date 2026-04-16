import * as THREE from 'three';
import { GAME, COLORS } from './constants';
import { PowerUpType } from './PowerUpManager';

export interface Tile {
  mesh: THREE.Mesh;
  lane: number;
  zPos: number;
  isFake: boolean;
  hasDiamond: boolean;
  diamondMesh?: THREE.Mesh;
  collected: boolean;
  glowIntensity: number;
  active: boolean;
  powerUp: PowerUpType;
  powerUpMesh?: THREE.Mesh;
}

const POWERUP_COLORS: Record<string, number> = {
  shield: 0x00b4d8,
  magnet: 0xe84393,
  speed: 0x70e000,
};

export class TileManager {
  private scene: THREE.Scene;
  private tilePool: THREE.Mesh[] = [];
  private diamondPool: THREE.Mesh[] = [];
  private powerUpPool: THREE.Mesh[] = [];
  private tiles: Tile[] = [];
  private tileGeometry: THREE.BoxGeometry;
  private tileMaterials: THREE.MeshStandardMaterial[];
  private fakeTileMaterial: THREE.MeshStandardMaterial;
  private diamondGeometry: THREE.OctahedronGeometry;
  private diamondMaterial: THREE.MeshStandardMaterial;
  private nextZ = 0;
  private difficulty = 0;
  private lastLane = 0;
  private seedRng: (() => number) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.tileGeometry = new THREE.BoxGeometry(GAME.TILE_WIDTH, GAME.TILE_HEIGHT, GAME.TILE_DEPTH);
    
    this.tileMaterials = [
      new THREE.MeshStandardMaterial({ color: COLORS.DIYA_ORANGE, emissive: COLORS.DIYA_GLOW, emissiveIntensity: 0.3, metalness: 0.3, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: COLORS.RANGOLI_PINK, emissive: COLORS.RANGOLI_PINK, emissiveIntensity: 0.2, metalness: 0.3, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: COLORS.RANGOLI_TEAL, emissive: COLORS.RANGOLI_TEAL, emissiveIntensity: 0.2, metalness: 0.3, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: COLORS.RANGOLI_GOLD, emissive: COLORS.RANGOLI_GOLD, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3 }),
    ];

    this.fakeTileMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.FAKE_TILE, emissive: COLORS.FAKE_TILE, emissiveIntensity: 0.15,
      metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.85,
    });

    this.diamondGeometry = new THREE.OctahedronGeometry(0.15);
    this.diamondMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.DIAMOND_COLOR, emissive: COLORS.DIAMOND_COLOR, emissiveIntensity: 0.5,
      metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.9,
    });

    for (let i = 0; i < 50; i++) {
      this.tilePool.push(this.createTileMesh());
      this.diamondPool.push(this.createDiamondMesh());
      this.powerUpPool.push(this.createPowerUpMesh());
    }
  }

  private createTileMesh(): THREE.Mesh {
    const mesh = new THREE.Mesh(this.tileGeometry, this.tileMaterials[0]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  private createDiamondMesh(): THREE.Mesh {
    const mesh = new THREE.Mesh(this.diamondGeometry, this.diamondMaterial);
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  private createPowerUpMesh(): THREE.Mesh {
    const geo = new THREE.TorusGeometry(0.18, 0.06, 8, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8,
      metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  private getFromPool(pool: THREE.Mesh[], createFn: () => THREE.Mesh): THREE.Mesh {
    const mesh = pool.find(m => !m.visible);
    if (mesh) return mesh;
    const newMesh = createFn();
    pool.push(newMesh);
    return newMesh;
  }

  private rand(): number {
    return this.seedRng ? this.seedRng() : Math.random();
  }

  setSeed(seed: number) {
    // Simple seeded RNG (mulberry32)
    let s = seed;
    this.seedRng = () => {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  clearSeed() {
    this.seedRng = null;
  }

  generateInitialTiles() {
    this.nextZ = 0;
    this.lastLane = 0;
    for (let i = 0; i < GAME.TILES_AHEAD; i++) {
      this.addTile(i < 5);
    }
  }

  private addTile(safe = false) {
    if (!safe && this.rand() < 0.4) {
      const dir = this.rand() < 0.5 ? -1 : 1;
      this.lastLane = Math.max(-1, Math.min(1, this.lastLane + dir));
    }

    const fakeChance = Math.min(GAME.FAKE_TILE_CHANCE_BASE + this.difficulty * 0.001, GAME.FAKE_TILE_CHANCE_MAX);
    const isFake = !safe && this.rand() < fakeChance;
    const hasDiamond = !isFake && !safe && this.rand() < GAME.DIAMOND_CHANCE;

    // Power-up: ~5% chance on non-fake, non-safe tiles
    let powerUp: PowerUpType = null;
    if (!isFake && !safe && !hasDiamond && this.rand() < 0.05) {
      const types: PowerUpType[] = ['shield', 'magnet', 'speed'];
      powerUp = types[Math.floor(this.rand() * types.length)];
    }

    const mesh = this.getFromPool(this.tilePool, () => this.createTileMesh());
    const matIndex = Math.floor(this.rand() * this.tileMaterials.length);
    mesh.material = isFake ? this.fakeTileMaterial : this.tileMaterials[matIndex];
    mesh.position.set(this.lastLane * GAME.LANE_OFFSET, 0, -this.nextZ);
    mesh.scale.set(1, 1, 1);
    mesh.visible = true;

    let diamondMesh: THREE.Mesh | undefined;
    if (hasDiamond) {
      diamondMesh = this.getFromPool(this.diamondPool, () => this.createDiamondMesh());
      diamondMesh.position.set(this.lastLane * GAME.LANE_OFFSET, 0.6, -this.nextZ);
      diamondMesh.visible = true;
    }

    let powerUpMesh: THREE.Mesh | undefined;
    if (powerUp) {
      powerUpMesh = this.getFromPool(this.powerUpPool, () => this.createPowerUpMesh());
      const color = POWERUP_COLORS[powerUp] || 0xffffff;
      const mat = powerUpMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(color);
      mat.emissive.setHex(color);
      powerUpMesh.position.set(this.lastLane * GAME.LANE_OFFSET, 0.7, -this.nextZ);
      powerUpMesh.visible = true;
    }

    this.tiles.push({
      mesh, lane: this.lastLane, zPos: this.nextZ, isFake, hasDiamond,
      diamondMesh, collected: false, glowIntensity: 0, active: true,
      powerUp, powerUpMesh,
    });

    this.nextZ += GAME.TILE_GAP;
  }

  update(ballZ: number, dt: number, time: number) {
    this.difficulty = Math.abs(ballZ) / 50;

    while (this.tiles.length > 0 && this.tiles[0].zPos < Math.abs(ballZ) - GAME.TILES_BEHIND * GAME.TILE_GAP) {
      const tile = this.tiles.shift()!;
      tile.mesh.visible = false;
      if (tile.diamondMesh) tile.diamondMesh.visible = false;
      if (tile.powerUpMesh) tile.powerUpMesh.visible = false;
    }

    while (this.nextZ < Math.abs(ballZ) + GAME.TILES_AHEAD * GAME.TILE_GAP) {
      this.addTile();
    }

    for (const tile of this.tiles) {
      const pulse = Math.sin(time * 3 + tile.zPos) * 0.15 + 0.3;
      if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
        tile.mesh.material.emissiveIntensity = pulse;
      }

      if (tile.diamondMesh && tile.diamondMesh.visible) {
        tile.diamondMesh.rotation.y += dt * 3;
        tile.diamondMesh.position.y = 0.6 + Math.sin(time * 4 + tile.zPos) * 0.1;
      }

      if (tile.powerUpMesh && tile.powerUpMesh.visible) {
        tile.powerUpMesh.rotation.y += dt * 4;
        tile.powerUpMesh.rotation.x += dt * 2;
        tile.powerUpMesh.position.y = 0.7 + Math.sin(time * 3 + tile.zPos) * 0.15;
      }

      if (tile.isFake && tile.active) {
        tile.mesh.position.y = Math.sin(time * 5 + tile.zPos * 2) * 0.02;
      }
    }
  }

  getTiles(): Tile[] {
    return this.tiles;
  }

  getForwardSpeed(): number {
    return Math.min(GAME.FORWARD_SPEED_INITIAL + this.difficulty * GAME.SPEED_INCREMENT * 500, GAME.FORWARD_SPEED_MAX);
  }

  reset() {
    for (const tile of this.tiles) {
      tile.mesh.visible = false;
      if (tile.diamondMesh) tile.diamondMesh.visible = false;
      if (tile.powerUpMesh) tile.powerUpMesh.visible = false;
    }
    this.tiles = [];
    this.nextZ = 0;
    this.lastLane = 0;
    this.difficulty = 0;
  }
}
