import { EventBus, GameEvents } from '../core/EventBus';

export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * 确保 AudioContext 在用户首个交互手势（点击/按键）中唤醒
   */
  public initAudioContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on(GameEvents.WEAPON_FIRED, () => {
      this.playPop();
    });

    bus.on(GameEvents.WEAPON_DRY_FIRE, () => {
      this.playDryFire();
    });

    bus.on(GameEvents.RELOAD_START, () => {
      this.playReload();
    });

    bus.on(GameEvents.DUCK_HIT, (data: { isFatal: boolean }) => {
      this.playHit();
      if (!data.isFatal) {
        this.playQuack(1.0 + (Math.random() - 0.5) * 0.3);
      }
    });

    bus.on(GameEvents.DUCK_KILLED, (data: { comboCount: number }) => {
      this.playQuack(1.4 + Math.random() * 0.4);
      if (data.comboCount >= 3) {
        this.playCombo(data.comboCount);
      }
    });

    bus.on(GameEvents.WAVE_START, (data: { hasBoss: boolean }) => {
      if (data.hasBoss) {
        this.playBossSpawn();
      }
    });
  }

  /**
   * 爆米花发射声（清脆 Pop 啵啵声）
   */
  public playPop(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;

    // 1. 快速音调下潜的正弦/三角波
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 750 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);

    // 2. 补充一点轻微白噪脆响
    this.playNoisePop(now, 0.04);
  }

  private playNoisePop(time: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.Q.setValueAtTime(3.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  /**
   * 橡皮鸭搞怪嘎嘎叫 Quack!
   */
  public playQuack(pitchMultiplier: number = 1.0): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const duration = 0.22;

    const osc = this.ctx.createOscillator();
    const formantFilter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startFreq = (380 + (Math.random() - 0.5) * 40) * pitchMultiplier;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 1.35, now + duration * 0.35);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, now + duration);

    // 鸭子共鸣腔滤波器
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(1400 * pitchMultiplier, now);
    formantFilter.frequency.linearRampToValueAtTime(800 * pitchMultiplier, now + duration);
    formantFilter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(formantFilter);
    formantFilter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * 命中提示音（清脆 Ding）
   */
  public playHit(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * 弹药打光空按扳机声
   */
  public playDryFire(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * 机械换弹音效（卡扣咔嗒声）
   */
  public playReload(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    // 第 1 声：弹匣抽出
    this.playClick(now, 600, 0.04);
    // 第 2 声：装填爆米花
    this.playClick(now + 0.45, 950, 0.05);
    // 第 3 声：枪栓复位上膛
    this.playClick(now + 0.9, 1200, 0.08);
  }

  private playClick(time: number, freq: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, time + duration);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 连击奖励欢快乐句
   */
  public playCombo(comboLevel: number): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const pentatonicNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const startIndex = Math.min(comboLevel % pentatonicNotes.length, pentatonicNotes.length - 3);

    for (let i = 0; i < 3; i++) {
      const noteFreq = pentatonicNotes[startIndex + i];
      const noteTime = now + i * 0.08;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    }
  }

  /**
   * Boss 登场滑稽低音号角
   */
  public playBossSpawn(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * 游戏结束号角
   */
  public playGameOver(): void {
    if (this.isMuted || !this.ctx) return;
    this.initAudioContext();

    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.22;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
