export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.audioContext = new AudioContext();
    this.isInitialized = true;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  playBounce() {
    this.playTone(523, 0.12, 'sine', 0.1);
    this.playTone(659, 0.08, 'sine', 0.08);
  }

  playDiamond() {
    this.playTone(880, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(1108, 0.15, 'sine', 0.1), 60);
    setTimeout(() => this.playTone(1318, 0.2, 'sine', 0.08), 120);
  }

  playCombo() {
    this.playTone(784, 0.1, 'triangle', 0.1);
    setTimeout(() => this.playTone(988, 0.1, 'triangle', 0.08), 80);
    setTimeout(() => this.playTone(1175, 0.15, 'triangle', 0.06), 160);
  }

  playGameOver() {
    this.playTone(440, 0.3, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(330, 0.3, 'sawtooth', 0.08), 200);
    setTimeout(() => this.playTone(262, 0.5, 'sawtooth', 0.06), 400);
  }

  // Simple rhythmic background using tabla-like patterns
  private bgInterval: number | null = null;
  startBeat(bpm = 120) {
    if (!this.audioContext) return;
    const interval = (60 / bpm) * 1000;
    let beat = 0;
    this.bgInterval = window.setInterval(() => {
      const emphasis = beat % 4 === 0;
      // Tabla-like: low thud
      this.playTone(emphasis ? 80 : 120, 0.08, 'sine', emphasis ? 0.06 : 0.03);
      // High tap
      if (beat % 2 === 0) {
        this.playTone(emphasis ? 400 : 350, 0.04, 'triangle', 0.02);
      }
      beat++;
    }, interval);
  }

  stopBeat() {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
  }

  getBeatPulse(time: number, bpm = 120): number {
    const beatDuration = 60 / bpm;
    const phase = (time % beatDuration) / beatDuration;
    return Math.max(0, 1 - phase * 3);
  }
}
