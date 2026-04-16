import * as THREE from 'three';
import { COLORS } from './constants';

export interface BallSkin {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  color: number;
  emissive: number;
  emissiveIntensity: number;
  trailColor: number;
  particleColor: number;
  metalness: number;
  roughness: number;
}

export const SKINS: BallSkin[] = [
  { id: 'default', name: 'Classic', emoji: '⚪', cost: 0, color: 0xffffff, emissive: COLORS.DIYA_GLOW, emissiveIntensity: 0.4, trailColor: COLORS.TRAIL, particleColor: COLORS.DIYA_GLOW, metalness: 0.1, roughness: 0.2 },
  { id: 'fire', name: 'Fire Ball', emoji: '🔥', cost: 50, color: 0xff4400, emissive: 0xff6600, emissiveIntensity: 0.8, trailColor: 0xff4400, particleColor: 0xff6600, metalness: 0.3, roughness: 0.1 },
  { id: 'ice', name: 'Ice Ball', emoji: '❄️', cost: 75, color: 0x88ddff, emissive: 0x00bbff, emissiveIntensity: 0.6, trailColor: 0x00bbff, particleColor: 0x88ddff, metalness: 0.5, roughness: 0.05 },
  { id: 'galaxy', name: 'Galaxy Ball', emoji: '🌌', cost: 100, color: 0x8844ff, emissive: 0xaa66ff, emissiveIntensity: 0.7, trailColor: 0x8844ff, particleColor: 0xaa66ff, metalness: 0.4, roughness: 0.1 },
  { id: 'disco', name: 'Disco Ball', emoji: '🪩', cost: 150, color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 0.5, trailColor: 0xff00ff, particleColor: 0x00ffff, metalness: 0.9, roughness: 0.0 },
  { id: 'gold', name: 'Golden Ball', emoji: '🏆', cost: 200, color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.6, trailColor: 0xffd700, particleColor: 0xffe066, metalness: 0.7, roughness: 0.1 },
];

export class SkinManager {
  private owned: Set<string>;
  private equipped: string;

  constructor() {
    const saved = localStorage.getItem('bounceX_ownedSkins');
    this.owned = new Set(saved ? JSON.parse(saved) : ['default']);
    this.equipped = localStorage.getItem('bounceX_equippedSkin') || 'default';
  }

  getEquipped(): BallSkin {
    return SKINS.find(s => s.id === this.equipped) || SKINS[0];
  }

  isOwned(id: string): boolean {
    return this.owned.has(id);
  }

  buy(id: string, diamonds: number): { success: boolean; remaining: number } {
    const skin = SKINS.find(s => s.id === id);
    if (!skin || this.owned.has(id) || diamonds < skin.cost) {
      return { success: false, remaining: diamonds };
    }
    this.owned.add(id);
    localStorage.setItem('bounceX_ownedSkins', JSON.stringify([...this.owned]));
    return { success: true, remaining: diamonds - skin.cost };
  }

  equip(id: string): boolean {
    if (!this.owned.has(id)) return false;
    this.equipped = id;
    localStorage.setItem('bounceX_equippedSkin', id);
    return true;
  }

  applyToMesh(mesh: THREE.Mesh) {
    const skin = this.getEquipped();
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.color.setHex(skin.color);
    mat.emissive.setHex(skin.emissive);
    mat.emissiveIntensity = skin.emissiveIntensity;
    mat.metalness = skin.metalness;
    mat.roughness = skin.roughness;
  }

  applyToTrail(trailMat: THREE.PointsMaterial) {
    const skin = this.getEquipped();
    trailMat.color.setHex(skin.trailColor);
  }

  getTotalDiamonds(): number {
    return parseInt(localStorage.getItem('bounceX_totalDiamonds') || '0');
  }

  setTotalDiamonds(d: number) {
    localStorage.setItem('bounceX_totalDiamonds', String(d));
  }

  getAllSkins(): BallSkin[] {
    return SKINS;
  }
}
