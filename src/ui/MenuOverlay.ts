export class MenuOverlay {
  private overlay: HTMLElement | null;
  private startMenu: HTMLElement | null;
  private pauseMenu: HTMLElement | null;
  private gameOverMenu: HTMLElement | null;
  private lockHint: HTMLElement | null;

  // 按钮
  private btnStart: HTMLElement | null;
  private btnResume: HTMLElement | null;
  private btnRestartPause: HTMLElement | null;
  private btnRestartGameOver: HTMLElement | null;

  // 结算数据
  private highScoreDisplay: HTMLElement | null;
  private finalScore: HTMLElement | null;
  private finalDucks: HTMLElement | null;
  private finalCombo: HTMLElement | null;
  private finalAccuracy: HTMLElement | null;
  private ratingTitle: HTMLElement | null;

  // 事件回调
  public onStartClicked?: () => void;
  public onResumeClicked?: () => void;
  public onRestartClicked?: () => void;
  public onLockHintClicked?: () => void;

  constructor() {
    this.overlay = document.getElementById('menu-overlay');
    this.startMenu = document.getElementById('start-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.gameOverMenu = document.getElementById('game-over-menu');
    this.lockHint = document.getElementById('lock-hint');

    this.btnStart = document.getElementById('btn-start');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPause = document.getElementById('btn-restart-pause');
    this.btnRestartGameOver = document.getElementById('btn-restart');

    this.highScoreDisplay = document.getElementById('high-score-display');
    this.finalScore = document.getElementById('final-score');
    this.finalDucks = document.getElementById('final-ducks');
    this.finalCombo = document.getElementById('final-combo');
    this.finalAccuracy = document.getElementById('final-accuracy');
    this.ratingTitle = document.getElementById('rating-title');

    this.initButtons();
  }

  private initButtons(): void {
    this.btnStart?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onStartClicked?.();
    });

    this.btnResume?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onResumeClicked?.();
    });

    this.btnRestartPause?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onRestartClicked?.();
    });

    this.btnRestartGameOver?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onRestartClicked?.();
    });

    this.lockHint?.addEventListener('click', () => {
      this.onLockHintClicked?.();
    });
  }

  public showStartMenu(highScore: number = 0): void {
    if (this.overlay) this.overlay.classList.remove('hidden');
    this.hideAllMenus();
    if (this.startMenu) this.startMenu.classList.remove('hidden');
    if (this.highScoreDisplay) this.highScoreDisplay.textContent = highScore.toString();
  }

  public showPauseMenu(): void {
    if (this.overlay) this.overlay.classList.remove('hidden');
    this.hideAllMenus();
    if (this.pauseMenu) this.pauseMenu.classList.remove('hidden');
  }

  public showGameOverMenu(stats: {
    score: number;
    ducksKilled: number;
    maxCombo: number;
    accuracy: number;
    rating: string;
  }): void {
    if (this.overlay) this.overlay.classList.remove('hidden');
    this.hideAllMenus();
    if (this.gameOverMenu) this.gameOverMenu.classList.remove('hidden');

    if (this.finalScore) this.finalScore.textContent = stats.score.toString();
    if (this.finalDucks) this.finalDucks.textContent = stats.ducksKilled.toString();
    if (this.finalCombo) this.finalCombo.textContent = `${stats.maxCombo}x`;
    if (this.finalAccuracy) this.finalAccuracy.textContent = `${stats.accuracy}%`;
    if (this.ratingTitle) this.ratingTitle.textContent = stats.rating;
  }

  public showLockPrompt(): void {
    if (this.lockHint) this.lockHint.classList.remove('hidden');
  }

  public hideLockPrompt(): void {
    if (this.lockHint) this.lockHint.classList.add('hidden');
  }

  public hideAll(): void {
    if (this.overlay) this.overlay.classList.add('hidden');
    this.hideAllMenus();
    this.hideLockPrompt();
  }

  private hideAllMenus(): void {
    if (this.startMenu) this.startMenu.classList.add('hidden');
    if (this.pauseMenu) this.pauseMenu.classList.add('hidden');
    if (this.gameOverMenu) this.gameOverMenu.classList.add('hidden');
  }
}
