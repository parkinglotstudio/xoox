export class AudioSystem {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private music: GainNode | null = null;
  private timer: number | undefined;
  muted = false;
  volume = 0.35;
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.bus = this.ctx.createGain();
      this.bus.gain.value = this.volume;
      this.bus.connect(this.ctx.destination);
      this.ambience();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }
  setMuted(v: boolean) {
    this.muted = v;
    if (this.bus)
      this.bus.gain.setTargetAtTime(
        v ? 0 : this.volume,
        this.ctx!.currentTime,
        0.1,
      );
  }
  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    slide = 0,
  ) {
    if (!this.ctx || !this.bus || this.muted) return;
    const now = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, freq + slide),
        now + duration,
      );
    g.gain.setValueAtTime(volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.connect(g);
    g.connect(this.bus);
    o.start(now);
    o.stop(now + duration);
  }
  private noise(duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.bus || this.muted) return;
    const buffer = this.ctx.createBuffer(
        1,
        Math.floor(this.ctx.sampleRate * duration),
        this.ctx.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const s = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    s.buffer = buffer;
    f.type = "lowpass";
    f.frequency.value = cutoff;
    g.gain.value = volume;
    s.connect(f);
    f.connect(g);
    g.connect(this.bus);
    s.start();
  }
  private ambience() {
    if (!this.ctx || !this.bus) return;
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.018;
    this.music.connect(this.bus);
    [55, 82.41, 110.3].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      o.type = i === 1 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = 0.5;
      o.connect(g);
      g.connect(this.music!);
      o.start();
    });
    this.timer = window.setInterval(() => {
      if (!this.muted)
        this.tone(
          [164.81, 146.83, 110, 123.47][Math.floor(Math.random() * 4)],
          1.4,
          "sine",
          0.03,
        );
    }, 2200);
  }
  play(event: string) {
    if (this.muted) return;
    switch (event) {
      case "slash":
        this.noise(0.12, 0.045, 4000);
        break;
      case "sniper":
        this.noise(0.2, 0.13, 1800);
        this.tone(75, 0.2, "triangle", 0.07, -40);
        break;
      case "flame":
        this.noise(0.18, 0.025, 850);
        break;
      case "shot":
        this.noise(0.06, 0.055, 2200);
        this.tone(120, 0.07, "triangle", 0.045, -70);
        break;
      case "shotgun":
        this.noise(0.14, 0.12, 1200);
        break;
      case "hurt":
        this.tone(120, 0.25, "sawtooth", 0.14, -80);
        break;
      case "level":
      case "evolve":
        [440, 554, 659, 880].forEach((f, i) =>
          window.setTimeout(() => this.tone(f, 0.25, "sine", 0.09), i * 75),
        );
        break;
      case "zap":
        this.tone(650, 0.15, "sawtooth", 0.07, -580);
        break;
      case "ice":
        this.tone(950, 0.3, "sine", 0.07, -300);
        break;
      case "glass":
        this.noise(0.09, 0.05, 5200);
        this.tone(1550, 0.05, "triangle", 0.02, -850);
        break;
      case "fire":
        this.noise(0.3, 0.06, 700);
        break;
      case "collapse":
        this.noise(0.65, 0.3, 450);
        this.tone(55, 0.7, "sawtooth", 0.12, 22);
        break;
      case "pulse":
        this.noise(0.45, 0.17, 800);
        this.tone(90, 0.4, "sine", 0.2, -50);
        break;
      case "dash":
        this.noise(0.13, 0.06, 1600);
        break;
      case "heal":
        this.tone(740, 0.3, "sine", 0.08, 300);
        break;
      case "boss":
      case "wave":
        this.tone(70, 0.8, "sawtooth", 0.08, -30);
        break;
      case "death":
        this.tone(180, 1, "triangle", 0.12, -150);
        break;
      case "win":
        [330, 440, 550, 660].forEach((f, i) =>
          window.setTimeout(() => this.tone(f, 0.7, "sine", 0.12), i * 150),
        );
        break;
    }
  }
  dispose() {
    if (this.timer) clearInterval(this.timer);
    void this.ctx?.close();
  }
}
