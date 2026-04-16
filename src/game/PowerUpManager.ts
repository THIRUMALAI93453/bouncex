export type PowerUpType = 'shield' | 'magnet' | 'speed' | null;

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number;
  duration: number;
}

export class PowerUpManager {
  private activePowerUps: ActivePowerUp[] = [];
  hasShield = false;

  activate(type: PowerUpType, duration = 5) {
    if (!type) return;
    // Remove existing of same type
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);
    this.activePowerUps.push({ type, timeLeft: duration, duration });
    if (type === 'shield') this.hasShield = true;
  }

  update(dt: number) {
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      this.activePowerUps[i].timeLeft -= dt;
      if (this.activePowerUps[i].timeLeft <= 0) {
        if (this.activePowerUps[i].type === 'shield') this.hasShield = false;
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  isActive(type: PowerUpType): boolean {
    return this.activePowerUps.some(p => p.type === type);
  }

  useShield(): boolean {
    if (!this.hasShield) return false;
    this.hasShield = false;
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'shield');
    return true;
  }

  getActive(): ActivePowerUp[] {
    return [...this.activePowerUps];
  }

  getSpeedMultiplier(): number {
    return this.isActive('speed') ? 1.8 : 1;
  }

  getMagnetActive(): boolean {
    return this.isActive('magnet');
  }

  reset() {
    this.activePowerUps = [];
    this.hasShield = false;
  }
}
