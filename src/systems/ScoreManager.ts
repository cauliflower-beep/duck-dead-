import { BaseDuck } from '../entities/ducks/BaseDuck';
import { GAME_CONFIG, ComboThreshold } from '../config/game.config';
import { EventBus, GameEvents } from '../core/EventBus';

export class ScoreManager {
  public currentScore: number = 0;
  public highScore: number = 0;
  public currentCombo: number = 0;
  public maxCombo: number = 0;
  public ducksKilled: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;

  public remainingTime: number = GAME_CONFIG.roundDuration;
  public comboTimer: number = 0;

  private isTimerActive: boolean = false;
  private readonly HIGH_SCORE_KEY = 'quack_attack_highscore_v1';

  constructor() {
    this.loadHighScore();
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem(this.HIGH_SCORE_KEY);
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.highScore = 0;
    }
  }

  private saveHighScore(): void {
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      try {
        localStorage.setItem(this.HIGH_SCORE_KEY, this.highScore.toString());
      } catch (err) {
        console.warn('Unable to save high score to localStorage:', err);
      }
    }
  }

  public startRound(): void {
    this.currentScore = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.ducksKilled = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.remainingTime = GAME_CONFIG.roundDuration;
    this.comboTimer = 0;
    this.isTimerActive = true;

    EventBus.getInstance().emit(GameEvents.SCORE_CHANGED, { score: 0, delta: 0 });
    EventBus.getInstance().emit(GameEvents.TIMER_TICK, { remainingTime: this.remainingTime });
  }

  public pauseRound(): void {
    this.isTimerActive = false;
  }

  public resumeRound(): void {
    this.isTimerActive = true;
  }

  public recordShotFired(): void {
    this.shotsFired++;
  }

  public recordShotHit(): void {
    this.shotsHit++;
  }

  /**
   * 击杀鸭子时调用：计算连击与加分
   */
  public addScoreForDuck(duck: BaseDuck): number {
    this.ducksKilled++;
    this.currentCombo++;

    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    // 重置连击保持时间
    this.comboTimer = GAME_CONFIG.comboDecayTime;

    // 获取对应倍率与连击称号
    const comboInfo = this.getComboInfo(this.currentCombo);
    const gain = Math.round(duck.config.scoreValue * comboInfo.multiplier);

    this.currentScore += gain;
    this.saveHighScore();

    EventBus.getInstance().emit(GameEvents.SCORE_CHANGED, {
      score: this.currentScore,
      delta: gain
    });

    EventBus.getInstance().emit(GameEvents.COMBO_UPDATED, {
      combo: this.currentCombo,
      multiplier: comboInfo.multiplier,
      title: comboInfo.title
    });

    return gain;
  }

  private getComboInfo(combo: number): { multiplier: number; title?: string } {
    let multiplier = 1.0;
    let title: string | undefined;

    // 匹配最高档位的连击称号
    for (const t of GAME_CONFIG.comboThresholds) {
      if (combo >= t.minCombo) {
        multiplier = t.multiplier;
        title = t.title;
      }
    }

    return { multiplier, title };
  }

  /**
   * 每帧更新连击倒计时与局内时间
   */
  public update(deltaTime: number): boolean {
    if (!this.isTimerActive) return false;

    // 1. 连击衰减
    if (this.currentCombo > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
        this.comboTimer = 0;
        EventBus.getInstance().emit(GameEvents.COMBO_EXPIRED);
      }
    }

    // 2. 局内倒计时
    this.remainingTime -= deltaTime;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0;
      this.isTimerActive = false;
      EventBus.getInstance().emit(GameEvents.TIMER_TICK, { remainingTime: 0 });
      return true; // 倒计时结束触发 GameOver
    }

    EventBus.getInstance().emit(GameEvents.TIMER_TICK, { remainingTime: Math.ceil(this.remainingTime) });
    return false;
  }

  public get accuracy(): number {
    if (this.shotsFired === 0) return 0;
    return Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100));
  }

  public getRatingTitle(): string {
    const s = this.currentScore;
    if (s >= 10000) return '👑 SUPREME DUCK OVERLORD 👑';
    if (s >= 6000) return '🍿 POPCORN MASTER 🍿';
    if (s >= 3500) return '🦆 DUCK SLAYER PRO 🦆';
    if (s >= 1500) return '🎯 SHARP SHOOTER 🎯';
    return '🐣 QUACK APPRENTICE 🐣';
  }
}
