import * as THREE from 'three';

export class CameraEffects {
  private shakeIntensity = 0;
  private shakeDecay = 5;
  private slowMoFactor = 1;
  private slowMoTarget = 1;
  private offset = new THREE.Vector3();

  shake(intensity = 0.3) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  triggerSlowMo(factor = 0.3, duration = 0.5) {
    this.slowMoFactor = factor;
    setTimeout(() => { this.slowMoTarget = 1; }, duration * 1000);
    this.slowMoTarget = factor;
  }

  update(dt: number): { offset: THREE.Vector3; timeScale: number } {
    // Shake
    if (this.shakeIntensity > 0.01) {
      this.offset.set(
        (Math.random() - 0.5) * this.shakeIntensity * 2,
        (Math.random() - 0.5) * this.shakeIntensity * 2,
        (Math.random() - 0.5) * this.shakeIntensity,
      );
      this.shakeIntensity *= Math.exp(-this.shakeDecay * dt);
    } else {
      this.offset.set(0, 0, 0);
      this.shakeIntensity = 0;
    }

    // Slow-mo lerp
    this.slowMoFactor += (this.slowMoTarget - this.slowMoFactor) * Math.min(1, 5 * dt);

    return { offset: this.offset, timeScale: this.slowMoFactor };
  }

  reset() {
    this.shakeIntensity = 0;
    this.slowMoFactor = 1;
    this.slowMoTarget = 1;
    this.offset.set(0, 0, 0);
  }
}
