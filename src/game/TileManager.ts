import * as THREE from 'three';
import { GAME, COLORS } from './constants';

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
}

export class TileManager {
  private scene: THREE.Scene;
  private tilePool: THREE.Mesh[] = [];
  private diamondPool: THREE.Mesh[] = [];
  private tiles: Tile[] = [];
  private tileGeometry: THREE.BoxGeometry;
  private tileMaterials: THREE.MeshStandardMaterial[];
  private fakeTileMaterial: THREE.MeshStandardMaterial;
  private diamondGeometry: THREE.OctahedronGeometry;
  private diamondMaterial: THREE.MeshStandardMaterial;
  private nextZ = 0;
  private difficulty = 0;
  private lastLane = 0;

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

    // Pre-fill pool
    for (let i = 0; i < 50; i++) {
      this.tilePool.push(this.createTileMesh());
      this.diamondPool.push(this.createDiamondMesh());
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

  private getTileMesh(): THREE.Mesh {
    const mesh = this.tilePool.find(m => !m.visible);
    if (mesh) return mesh;
    const newMesh = this.createTileMesh();
    this.tilePool.push(newMesh);
    return newMesh;
  }

  private getDiamondMesh(): THREE.Mesh {
    const mesh = this.diamondPool.find(m => !m.visible);
    if (mesh) return mesh;
    const newMesh = this.createDiamondMesh();
    this.diamondPool.push(newMesh);
    return newMesh;
  }

  generateInitialTiles() {
    this.nextZ = 0;
    this.lastLane = 0;
    for (let i = 0; i < GAME.TILES_AHEAD; i++) {
      this.addTile(i < 5); // first 5 are safe
    }
  }

  private addTile(safe = false) {
    // Decide lane - sometimes shift, sometimes stay
    if (!safe && Math.random() < 0.4) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.lastLane = Math.max(-1, Math.min(1, this.lastLane + dir));
    }

    const fakeChance = Math.min(GAME.FAKE_TILE_CHANCE_BASE + this.difficulty * 0.001, GAME.FAKE_TILE_CHANCE_MAX);
    const isFake = !safe && Math.random() < fakeChance;
    const hasDiamond = !isFake && !safe && Math.random() < GAME.DIAMOND_CHANCE;

    const mesh = this.getTileMesh();
    const matIndex = Math.floor(Math.random() * this.tileMaterials.length);
    mesh.material = isFake ? this.fakeTileMaterial : this.tileMaterials[matIndex];
    mesh.position.set(this.lastLane * GAME.LANE_OFFSET, 0, -this.nextZ);
    mesh.scale.set(1, 1, 1);
    mesh.visible = true;

    let diamondMesh: THREE.Mesh | undefined;
    if (hasDiamond) {
      diamondMesh = this.getDiamondMesh();
      diamondMesh.position.set(this.lastLane * GAME.LANE_OFFSET, 0.6, -this.nextZ);
      diamondMesh.visible = true;
    }

    this.tiles.push({
      mesh, lane: this.lastLane, zPos: this.nextZ, isFake, hasDiamond,
      diamondMesh, collected: false, glowIntensity: 0, active: true,
    });

    this.nextZ += GAME.TILE_GAP;
  }

  update(ballZ: number, dt: number, time: number) {
    this.difficulty = Math.abs(ballZ) / 50;

    // Remove tiles behind
    while (this.tiles.length > 0 && this.tiles[0].zPos < Math.abs(ballZ) - GAME.TILES_BEHIND * GAME.TILE_GAP) {
      const tile = this.tiles.shift()!;
      tile.mesh.visible = false;
      if (tile.diamondMesh) tile.diamondMesh.visible = false;
    }

    // Add tiles ahead
    while (this.nextZ < Math.abs(ballZ) + GAME.TILES_AHEAD * GAME.TILE_GAP) {
      this.addTile();
    }

    // Animate
    for (const tile of this.tiles) {
      // Diya glow pulse
      const pulse = Math.sin(time * 3 + tile.zPos) * 0.15 + 0.3;
      if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
        tile.mesh.material.emissiveIntensity = pulse;
      }

      // Diamond rotation
      if (tile.diamondMesh && tile.diamondMesh.visible) {
        tile.diamondMesh.rotation.y += dt * 3;
        tile.diamondMesh.position.y = 0.6 + Math.sin(time * 4 + tile.zPos) * 0.1;
      }

      // Fake tile subtle wobble
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
    }
    this.tiles = [];
    this.nextZ = 0;
    this.lastLane = 0;
    this.difficulty = 0;
  }
}
