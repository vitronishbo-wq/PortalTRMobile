// src/engine/hapticEngine.ts — Motor de Feedback Háptico e Acústico (Camada 47)
// Suporte a navigator.vibrate e síntese subsónica Web Audio API para browsers

export type HapticPattern = 
  | 'KEYPRESS' 
  | 'DTMF' 
  | 'VOLUME' 
  | 'POWER' 
  | 'LOCK' 
  | 'UNLOCK' 
  | 'COMMAND_EXECUTED'
  | 'ERROR';

export class HapticEngine {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
        } catch {
          this.audioCtx = null;
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Executa vibração física via Vibration API se disponível
   */
  private static triggerVibration(pattern: number | number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignora silenciosamente caso permissão não concedida
      }
    }
  }

  /**
   * Sintetiza um pulso acústico mecânico tátil
   */
  private static playSyntheticHapticClick(frequency: number, durationMs: number, gainValue: number = 0.05): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio context não inicializado
    }
  }

  /**
   * Despoleta evento de feedback háptico
   */
  public static trigger(type: HapticPattern): void {
    switch (type) {
      case 'KEYPRESS':
        this.triggerVibration(8);
        this.playSyntheticHapticClick(180, 10, 0.03);
        break;

      case 'DTMF':
        this.triggerVibration(15);
        this.playSyntheticHapticClick(240, 18, 0.04);
        break;

      case 'VOLUME':
        this.triggerVibration(12);
        this.playSyntheticHapticClick(320, 14, 0.04);
        break;

      case 'POWER':
        this.triggerVibration(35);
        this.playSyntheticHapticClick(120, 30, 0.06);
        break;

      case 'LOCK':
        this.triggerVibration([20, 30, 20]);
        this.playSyntheticHapticClick(90, 25, 0.05);
        setTimeout(() => this.playSyntheticHapticClick(70, 30, 0.05), 35);
        break;

      case 'UNLOCK':
        this.triggerVibration(25);
        this.playSyntheticHapticClick(280, 25, 0.05);
        break;

      case 'COMMAND_EXECUTED':
        this.triggerVibration([30, 40, 40]);
        this.playSyntheticHapticClick(440, 20, 0.05);
        setTimeout(() => this.playSyntheticHapticClick(880, 30, 0.05), 45);
        break;

      case 'ERROR':
        this.triggerVibration([50, 50, 50, 50, 100]);
        this.playSyntheticHapticClick(110, 60, 0.08);
        break;
    }
  }
}
