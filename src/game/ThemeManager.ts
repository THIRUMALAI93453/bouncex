import * as THREE from 'three';

export interface ColorTheme {
  name: string;
  bg: number;
  fog: number;
  tileColors: number[];
  tileEmissive: number[];
  trailColor: number;
  particleColor: number;
  ambientColor: number;
  pointLightColor: number;
}

const THEMES: ColorTheme[] = [
  {
    name: 'Neon Purple',
    bg: 0x1a0533, fog: 0x1a0533,
    tileColors: [0xff8c00, 0xe84393, 0x00b894, 0xffd700],
    tileEmissive: [0xffaa33, 0xe84393, 0x00b894, 0xffd700],
    trailColor: 0xff8c00, particleColor: 0xffaa33,
    ambientColor: 0x332244, pointLightColor: 0xffaa33,
  },
  {
    name: 'Sunset Orange',
    bg: 0x1a0a00, fog: 0x1a0a00,
    tileColors: [0xff6b35, 0xff9f1c, 0xffbf69, 0xe63946],
    tileEmissive: [0xff6b35, 0xff9f1c, 0xffbf69, 0xe63946],
    trailColor: 0xff6b35, particleColor: 0xff9f1c,
    ambientColor: 0x442211, pointLightColor: 0xff6b35,
  },
  {
    name: 'Ice Blue',
    bg: 0x001122, fog: 0x001122,
    tileColors: [0x00b4d8, 0x48cae4, 0x90e0ef, 0xcaf0f8],
    tileEmissive: [0x00b4d8, 0x48cae4, 0x90e0ef, 0x0096c7],
    trailColor: 0x48cae4, particleColor: 0x90e0ef,
    ambientColor: 0x112233, pointLightColor: 0x48cae4,
  },
  {
    name: 'Toxic Green',
    bg: 0x001a00, fog: 0x001a00,
    tileColors: [0x70e000, 0x38b000, 0x9ef01a, 0xccff33],
    tileEmissive: [0x70e000, 0x38b000, 0x9ef01a, 0xccff33],
    trailColor: 0x70e000, particleColor: 0x9ef01a,
    ambientColor: 0x113311, pointLightColor: 0x70e000,
  },
  {
    name: 'Golden Hour',
    bg: 0x1a1000, fog: 0x1a1000,
    tileColors: [0xffd700, 0xffa500, 0xffcc00, 0xffe066],
    tileEmissive: [0xffd700, 0xffa500, 0xffcc00, 0xffe066],
    trailColor: 0xffd700, particleColor: 0xffe066,
    ambientColor: 0x332211, pointLightColor: 0xffd700,
  },
];

export class ThemeManager {
  private currentIndex = 0;
  private targetIndex = 0;
  private lerpProgress = 1;
  private lastThresholdScore = 0;

  private currentBg = new THREE.Color();
  private currentFog = new THREE.Color();
  private targetBg = new THREE.Color();
  private targetFog = new THREE.Color();

  constructor() {
    const t = THEMES[0];
    this.currentBg.setHex(t.bg);
    this.currentFog.setHex(t.fog);
    this.targetBg.copy(this.currentBg);
    this.targetFog.copy(this.currentFog);
  }

  update(score: number, dt: number, scene: THREE.Scene) {
    const thresholdScore = Math.floor(score / 50) * 50;
    if (thresholdScore > this.lastThresholdScore && thresholdScore > 0) {
      this.lastThresholdScore = thresholdScore;
      this.currentIndex = this.targetIndex;
      this.targetIndex = (this.targetIndex + 1) % THEMES.length;
      this.lerpProgress = 0;
      this.currentBg.copy(scene.background as THREE.Color);
      this.currentFog.copy((scene.fog as THREE.FogExp2).color);
      const t = THEMES[this.targetIndex];
      this.targetBg.setHex(t.bg);
      this.targetFog.setHex(t.fog);
    }

    if (this.lerpProgress < 1) {
      this.lerpProgress = Math.min(1, this.lerpProgress + dt * 0.5);
      const bg = this.currentBg.clone().lerp(this.targetBg, this.lerpProgress);
      const fog = this.currentFog.clone().lerp(this.targetFog, this.lerpProgress);
      (scene.background as THREE.Color).copy(bg);
      (scene.fog as THREE.FogExp2).color.copy(fog);
    }
  }

  getCurrentTheme(): ColorTheme {
    return THEMES[this.targetIndex];
  }

  getThemeIndex(): number {
    return this.targetIndex;
  }

  reset() {
    this.currentIndex = 0;
    this.targetIndex = 0;
    this.lerpProgress = 1;
    this.lastThresholdScore = 0;
  }
}
