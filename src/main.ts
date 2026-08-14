import * as THREE from 'three';
import { Engine } from './core/Engine';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { StateMachine, GameState } from './core/StateMachine';
import { EventBus, GameEvents } from './core/EventBus';
import { SoundManager } from './audio/SoundManager';
import { Environment } from './entities/Environment';
import { PopcornGun } from './entities/weapons/PopcornGun';
import { ParticleSystem } from './systems/ParticleSystem';
import { DuckSpawner } from './systems/DuckSpawner';
import { ScoreManager } from './systems/ScoreManager';
import { CombatSystem } from './systems/CombatSystem';
import { HUD } from './ui/HUD';
import { MenuOverlay } from './ui/MenuOverlay';

class QuackAttackGame {
  private engine: Engine;
  private gameLoop: GameLoop;
  private inputManager: InputManager;
  private stateMachine: StateMachine;
  private soundManager: SoundManager;

  // 实体与环境
  private environment: Environment;
  private weapon: PopcornGun;

  // 子系统
  private particleSystem: ParticleSystem;
  private duckSpawner: DuckSpawner;
  private scoreManager: ScoreManager;
  private combatSystem: CombatSystem;

  // 界面层
  private hud: HUD;
  private menuOverlay: MenuOverlay;

  constructor() {
    // 1. 初始化核心渲染引擎
    this.engine = new Engine('game-container');

    // 2. 初始化环境场景与第一人称武器
    this.environment = new Environment();
    this.engine.scene.add(this.environment.group);

    this.weapon = new PopcornGun();
    this.engine.camera.add(this.weapon.mesh);

    // 3. 初始化玩法系统
    this.particleSystem = new ParticleSystem(this.engine.scene);
    this.scoreManager = new ScoreManager();
    this.duckSpawner = new DuckSpawner(this.engine.scene);
    this.combatSystem = new CombatSystem(
      this.engine.camera,
      this.particleSystem,
      this.duckSpawner,
      this.scoreManager
    );

    // 4. 音效与输入系统
    this.soundManager = SoundManager.getInstance();
    this.inputManager = new InputManager(this.engine.camera, this.engine.renderer.domElement);

    // 5. UI 与状态机
    this.hud = new HUD();
    this.menuOverlay = new MenuOverlay();
    this.stateMachine = new StateMachine(GameState.START_MENU);
    this.gameLoop = new GameLoop();

    // 6. 装配系统与事件绑定
    this.setupStateMachine();
    this.setupUIEvents();
    this.setupInputListeners();

    // 7. 注册主渲染循环
    this.gameLoop.registerUpdate(this.update.bind(this));
    this.gameLoop.setRender(this.render.bind(this));

    // 启动游戏引擎循环
    this.gameLoop.start();

    // 初始显示开始菜单
    this.menuOverlay.showStartMenu(this.scoreManager.highScore);
  }

  /**
   * 状态机生命周期配置
   */
  private setupStateMachine(): void {
    const sm = this.stateMachine;

    sm.onEnter(GameState.START_MENU, () => {
      this.hud.hide();
      this.menuOverlay.showStartMenu(this.scoreManager.highScore);
      this.inputManager.exitLock();
    });

    sm.onEnter(GameState.PLAYING, () => {
      this.menuOverlay.hideAll();
      this.hud.show();
      this.soundManager.initAudioContext();

      if (sm.getPreviousState() === GameState.PAUSED) {
        this.scoreManager.resumeRound();
      } else {
        // 全新开局
        this.resetGameRound();
        this.scoreManager.startRound();
        this.duckSpawner.startWave(1);
      }

      this.inputManager.requestLock();
    });

    sm.onEnter(GameState.PAUSED, () => {
      this.hud.hide();
      this.menuOverlay.showPauseMenu();
      this.scoreManager.pauseRound();
      this.inputManager.exitLock();
    });

    sm.onEnter(GameState.GAME_OVER, () => {
      this.hud.hide();
      this.soundManager.playGameOver();
      this.inputManager.exitLock();

      this.menuOverlay.showGameOverMenu({
        score: this.scoreManager.currentScore,
        ducksKilled: this.scoreManager.ducksKilled,
        maxCombo: this.scoreManager.maxCombo,
        accuracy: this.scoreManager.accuracy,
        rating: this.scoreManager.getRatingTitle()
      });
    });
  }

  /**
   * UI 事件与按钮响应
   */
  private setupUIEvents(): void {
    this.menuOverlay.onStartClicked = () => {
      this.stateMachine.transitionTo(GameState.PLAYING);
    };

    this.menuOverlay.onResumeClicked = () => {
      this.stateMachine.transitionTo(GameState.PLAYING);
    };

    this.menuOverlay.onRestartClicked = () => {
      this.resetGameRound();
      this.stateMachine.transitionTo(GameState.PLAYING);
    };

    this.menuOverlay.onLockHintClicked = () => {
      if (this.stateMachine.is(GameState.PLAYING)) {
        this.inputManager.requestLock();
      }
    };
  }

  /**
   * 按键输入监听（ESC 暂停/恢复）
   */
  private setupInputListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.stateMachine.is(GameState.PLAYING)) {
          this.stateMachine.transitionTo(GameState.PAUSED);
        } else if (this.stateMachine.is(GameState.PAUSED)) {
          this.stateMachine.transitionTo(GameState.PLAYING);
        }
      }
    });

    EventBus.getInstance().on(GameEvents.POINTER_LOCK_CHANGE, (data: { isLocked: boolean }) => {
      if (this.stateMachine.is(GameState.PLAYING)) {
        if (!data.isLocked) {
          this.menuOverlay.showLockPrompt();
        } else {
          this.menuOverlay.hideLockPrompt();
        }
      }
    });
  }

  /**
   * 重置整局游戏数据
   */
  private resetGameRound(): void {
    this.weapon.reset();
    this.duckSpawner.reset();
    this.particleSystem.reset();
    this.inputManager.reset();
  }

  /**
   * 每帧主更新逻辑
   */
  private update(deltaTime: number): void {
    // 无论任何状态，环境动画（如白云漂移）都保持运转，增强背景活力
    this.environment.update(deltaTime);

    if (this.stateMachine.is(GameState.PLAYING)) {
      // 1. 处理射击输入
      if (this.inputManager.isMouseDown && this.inputManager.isLocked) {
        const forward = new THREE.Vector3();
        this.engine.camera.getWorldDirection(forward);
        const muzzlePos = new THREE.Vector3();
        this.weapon.mesh.getWorldPosition(muzzlePos);

        this.weapon.tryShoot(muzzlePos, forward);
      }

      // 2. 处理换弹请求
      if (this.inputManager.consumeReload()) {
        this.weapon.startReload();
      }

      // 3. 更新实体与子系统
      this.weapon.update(deltaTime);
      this.duckSpawner.update(deltaTime);
      this.particleSystem.update(deltaTime);

      // 4. 更新连击衰减与局内计时
      const isGameOver = this.scoreManager.update(deltaTime);
      this.hud.updateComboProgress(this.scoreManager.comboTimer);

      if (isGameOver) {
        this.stateMachine.transitionTo(GameState.GAME_OVER);
      }
    } else if (this.stateMachine.is(GameState.START_MENU) || this.stateMachine.is(GameState.GAME_OVER)) {
      // 在菜单展示期间粒子与轻度动画继续淡出
      this.particleSystem.update(deltaTime);
    }

    // 更新引擎相机震荡
    this.engine.update(deltaTime);
  }

  /**
   * 渲染画面
   */
  private render(): void {
    this.engine.render();
  }
}

// 页面加载完成后实例化游戏
window.addEventListener('DOMContentLoaded', () => {
  new QuackAttackGame();
});
