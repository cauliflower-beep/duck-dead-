import { EventBus, GameEvents } from './EventBus';

export enum GameState {
  LOADING = 'LOADING',
  START_MENU = 'START_MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export class StateMachine {
  private currentState: GameState = GameState.LOADING;
  private previousState: GameState = GameState.LOADING;
  private stateEnterCallbacks: Map<GameState, () => void> = new Map();
  private stateExitCallbacks: Map<GameState, () => void> = new Map();

  constructor(initialState: GameState = GameState.START_MENU) {
    this.currentState = initialState;
    this.previousState = initialState;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public getPreviousState(): GameState {
    return this.previousState;
  }

  public is(state: GameState): boolean {
    return this.currentState === state;
  }

  public onEnter(state: GameState, callback: () => void): this {
    this.stateEnterCallbacks.set(state, callback);
    return this;
  }

  public onExit(state: GameState, callback: () => void): this {
    this.stateExitCallbacks.set(state, callback);
    return this;
  }

  /**
   * 状态切换
   */
  public transitionTo(newState: GameState): boolean {
    if (this.currentState === newState) {
      return false;
    }

    const fromState = this.currentState;

    // 执行旧状态退出回调
    const exitCb = this.stateExitCallbacks.get(fromState);
    if (exitCb) {
      exitCb();
    }

    this.previousState = fromState;
    this.currentState = newState;

    // 广播状态改变事件
    EventBus.getInstance().emit(GameEvents.STATE_CHANGE, {
      from: fromState,
      to: newState
    });

    // 执行新状态进入回调
    const enterCb = this.stateEnterCallbacks.get(newState);
    if (enterCb) {
      enterCb();
    }

    return true;
  }
}
