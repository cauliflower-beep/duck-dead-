import * as THREE from 'three';

export type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 监听事件
   */
  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    return () => this.off(event, callback);
  }

  /**
   * 移除事件监听
   */
  public off<T = any>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 广播触发事件
   */
  public emit<T = any>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`[EventBus] Error executing listener for event: ${event}`, error);
        }
      });
    }
  }

  /**
   * 清除所有监听（用于关卡重置）
   */
  public clear(): void {
    this.listeners.clear();
  }
}

// 常用事件名常量定义
export const GameEvents = {
  AMMO_CHANGED: 'AMMO_CHANGED',
  RELOAD_START: 'RELOAD_START',
  RELOAD_FINISH: 'RELOAD_FINISH',
  WEAPON_FIRED: 'WEAPON_FIRED',
  WEAPON_DRY_FIRE: 'WEAPON_DRY_FIRE',
  DUCK_HIT: 'DUCK_HIT',
  DUCK_KILLED: 'DUCK_KILLED',
  SCORE_CHANGED: 'SCORE_CHANGED',
  COMBO_UPDATED: 'COMBO_UPDATED',
  COMBO_EXPIRED: 'COMBO_EXPIRED',
  TIMER_TICK: 'TIMER_TICK',
  WAVE_START: 'WAVE_START',
  STATE_CHANGE: 'STATE_CHANGE',
  POINTER_LOCK_CHANGE: 'POINTER_LOCK_CHANGE',
  SCREEN_SHAKE: 'SCREEN_SHAKE'
} as const;
