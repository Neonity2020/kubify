class SoundManager {
  private ctx: AudioContext | null = null;
  private isMutedSetting = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction due to browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.noiseBuffer = this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Create 1 second of white noise to use for friction sounds
  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public setMuted(muted: boolean) {
    this.isMutedSetting = muted;
    if (!muted) {
      this.initContext();
    }
  }

  public get isMuted(): boolean {
    return this.isMutedSetting;
  }

  // Synthesize a turn sound: a combination of a friction swoosh and a soft plastic alignment click
  public playTurn() {
    this.initContext();
    if (this.isMutedSetting || !this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Friction "Swoosh" Sound using Bandpass Filtered Noise
    if (this.noiseBuffer) {
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = this.noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      // Slide the center frequency from 800Hz down to 400Hz during the turn
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.25);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.25);
    }

    // 2. Plastic Alignment "Click" at the end of the turn
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickOsc.type = 'triangle';
    // Frequency pitch slide
    clickOsc.frequency.setValueAtTime(600, now + 0.15);
    clickOsc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    clickFilter.type = 'lowpass';
    clickFilter.frequency.setValueAtTime(1200, now + 0.15);

    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.setValueAtTime(0, now + 0.15);
    clickGain.gain.linearRampToValueAtTime(0.12, now + 0.155);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(now + 0.15);
    clickOsc.stop(now + 0.19);

    // 3. Subtle low-frequency wooden/plastic thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(90, now + 0.15);
    thudOsc.frequency.linearRampToValueAtTime(40, now + 0.22);

    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.setValueAtTime(0, now + 0.15);
    thudGain.gain.linearRampToValueAtTime(0.25, now + 0.16);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);

    thudOsc.start(now + 0.15);
    thudOsc.stop(now + 0.23);
  }

  // A different pitch/sound for scrambling (quicker, lighter)
  public playScrambleClick() {
    this.initContext();
    if (this.isMutedSetting || !this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Celebratory sound when solved!
  public playSolvedChime() {
    this.initContext();
    if (this.isMutedSetting || !this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const time = now + i * 0.12;
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }
}

export const soundEffects = new SoundManager();
