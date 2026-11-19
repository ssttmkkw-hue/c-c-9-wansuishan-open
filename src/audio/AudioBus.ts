export class AudioBus {
  muted = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private murmur: GainNode | null = null;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.22, this.ctx.currentTime, 0.05);
    }
  }

  /** Call from a pointer or key gesture. Safe to call often. */
  unlock() {
    if (!this.ctx) this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMurmur(amount: number) {
    if (!this.ctx || !this.murmur || this.muted) return;
    this.murmur.gain.setTargetAtTime(Math.max(0, Math.min(1, amount)) * 0.08, this.ctx.currentTime, 0.2);
  }

  hit(kind: 'drum' | 'wood' | 'clap') {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (kind === 'drum') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.2);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    } else if (kind === 'wood') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  private ensure() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.22;
    this.master.connect(this.ctx.destination);

    const seconds = 2;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 2.4;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    this.murmur = this.ctx.createGain();
    this.murmur.gain.value = 0;
    src.connect(filter);
    filter.connect(this.murmur);
    this.murmur.connect(this.master);
    src.start();
  }
}
