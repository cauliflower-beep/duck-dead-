import { EventBus, GameEvents } from '../core/EventBus';
import { GAME_CONFIG } from '../config/game.config';

export class HUD {
  private crosshairContainer: HTMLElement | null;
  private hitmarker: HTMLElement | null;
  private hudOverlay: HTMLElement | null;
  private scoreDisplay: HTMLElement | null;
  private timerDisplay: HTMLElement | null;
  private waveDisplay: HTMLElement | null;

  private comboContainer: HTMLElement | null;
  private comboCount: HTMLElement | null;
  private comboText: HTMLElement | null;
  private comboTimerBar: HTMLElement | null;

  private ammoKernels: HTMLElement | null;
  private ammoCurrent: HTMLElement | null;
  private ammoMax: HTMLElement | null;
  private reloadIndicator: HTMLElement | null;
  private floatingTextContainer: HTMLElement | null;

  private hitmarkerTimeout: number | null = null;

  constructor() {
    this.crosshairContainer = document.getElementById('crosshair-container');
    this.hitmarker = document.getElementById('hitmarker');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.scoreDisplay = document.getElementById('score-display');
    this.timerDisplay = document.getElementById('timer-display');
    this.waveDisplay = document.getElementById('wave-display');

    this.comboContainer = document.getElementById('combo-container');
    this.comboCount = document.getElementById('combo-count');
    this.comboText = document.getElementById('combo-text');
    this.comboTimerBar = document.getElementById('combo-timer-bar');

    this.ammoKernels = document.getElementById('ammo-kernels');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoMax = document.getElementById('ammo-max');
    this.reloadIndicator = document.getElementById('reload-indicator');
    this.floatingTextContainer = document.getElementById('floating-text-container');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    // 1. 弹药变动
    bus.on(GameEvents.AMMO_CHANGED, (data: { current: number; max: number }) => {
      this.updateAmmo(data.current, data.max);
    });

    // 2. 换弹状态
    bus.on(GameEvents.RELOAD_START, () => {
      if (this.reloadIndicator) this.reloadIndicator.classList.remove('hidden');
    });

    bus.on(GameEvents.RELOAD_FINISH, () => {
      if (this.reloadIndicator) this.reloadIndicator.classList.add('hidden');
    });

    // 3. 开火震荡准星
    bus.on(GameEvents.WEAPON_FIRED, () => {
      this.kickCrosshair();
    });

    // 4. 命中标记 Hitmarker
    bus.on(GameEvents.DUCK_HIT, () => {
      this.showHitmarker();
    });

    // 5. 分数变动与跳字
    bus.on(GameEvents.SCORE_CHANGED, (data: { score: number; delta: number }) => {
      this.updateScore(data.score);
      if (data.delta > 0) {
        this.spawnFloatingText(`+${data.delta}`, '#feca57');
      }
    });

    // 6. 连击更新
    bus.on(GameEvents.COMBO_UPDATED, (data: { combo: number; multiplier: number; title?: string }) => {
      this.updateCombo(data.combo, data.title);
    });

    bus.on(GameEvents.COMBO_EXPIRED, () => {
      this.hideCombo();
    });

    // 7. 倒计时
    bus.on(GameEvents.TIMER_TICK, (data: { remainingTime: number }) => {
      this.updateTimer(data.remainingTime);
    });

    // 8. 波次提醒
    bus.on(GameEvents.WAVE_START, (data: { waveNumber: number; hasBoss: boolean }) => {
      this.updateWave(data.waveNumber);
      if (data.hasBoss) {
        this.spawnFloatingText('⚠️ BOSS DUCK INCOMING! ⚠️', '#ff4757', true);
      } else {
        this.spawnFloatingText(`WAVE ${data.waveNumber}`, '#48dbfb');
      }
    });
  }

  public show(): void {
    if (this.crosshairContainer) this.crosshairContainer.classList.remove('hidden');
    if (this.hudOverlay) this.hudOverlay.classList.remove('hidden');
  }

  public hide(): void {
    if (this.crosshairContainer) this.crosshairContainer.classList.add('hidden');
    if (this.hudOverlay) this.hudOverlay.classList.add('hidden');
  }

  private updateScore(score: number): void {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = score.toString().padStart(6, '0');
    }
  }

  private updateTimer(seconds: number): void {
    if (this.timerDisplay) {
      this.timerDisplay.textContent = seconds.toString();
      if (seconds <= 10) {
        this.timerDisplay.classList.add('timer-warning');
      } else {
        this.timerDisplay.classList.remove('timer-warning');
      }
    }
  }

  private updateWave(wave: number): void {
    if (this.waveDisplay) {
      this.waveDisplay.textContent = wave.toString();
    }
  }

  private updateAmmo(current: number, max: number): void {
    if (this.ammoCurrent) this.ammoCurrent.textContent = current.toString();
    if (this.ammoMax) this.ammoMax.textContent = max.toString();

    if (this.ammoKernels) {
      this.ammoKernels.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const kernel = document.createElement('div');
        kernel.className = `ammo-kernel ${i >= current ? 'spent' : ''}`;
        this.ammoKernels.appendChild(kernel);
      }
    }
  }

  private kickCrosshair(): void {
    if (this.crosshairContainer) {
      this.crosshairContainer.classList.remove('crosshair-kick');
      void this.crosshairContainer.offsetWidth; // 触发重绘
      this.crosshairContainer.classList.add('crosshair-kick');
    }
  }

  private showHitmarker(): void {
    if (!this.hitmarker) return;

    if (this.hitmarkerTimeout !== null) {
      window.clearTimeout(this.hitmarkerTimeout);
    }

    this.hitmarker.classList.add('active');
    this.hitmarkerTimeout = window.setTimeout(() => {
      this.hitmarker?.classList.remove('active');
      this.hitmarkerTimeout = null;
    }, 120);
  }

  private updateCombo(combo: number, title?: string): void {
    if (!this.comboContainer) return;

    if (combo >= 2) {
      this.comboContainer.classList.remove('hidden');
      if (this.comboCount) this.comboCount.textContent = `${combo}x`;
      if (this.comboText) {
        this.comboText.textContent = title || 'COMBO!';
        this.comboText.style.display = title ? 'block' : 'none';
      }
      if (this.comboTimerBar) {
        this.comboTimerBar.style.width = '100%';
      }
    }
  }

  public updateComboProgress(timer: number): void {
    if (this.comboTimerBar && this.comboContainer && !this.comboContainer.classList.contains('hidden')) {
      const progress = Math.max(0, Math.min(100, (timer / GAME_CONFIG.comboDecayTime) * 100));
      this.comboTimerBar.style.width = `${progress}%`;
    }
  }

  private hideCombo(): void {
    if (this.comboContainer) {
      this.comboContainer.classList.add('hidden');
    }
  }

  public spawnFloatingText(text: string, color: string = '#feca57', isCenter: boolean = false): void {
    if (!this.floatingTextContainer) return;

    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.color = color;

    if (isCenter) {
      el.style.left = '50%';
      el.style.top = '35%';
      el.style.fontSize = '34px';
    } else {
      el.style.left = `${45 + (Math.random() - 0.5) * 16}%`;
      el.style.top = `${48 + (Math.random() - 0.5) * 10}%`;
    }

    this.floatingTextContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 900);
  }
}
