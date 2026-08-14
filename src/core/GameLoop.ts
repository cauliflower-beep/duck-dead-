export type UpdateCallback = (deltaTime: number, elapsedTime: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private elapsedTime: number = 0;
  private readonly maxDeltaTime: number = 0.1; // 防止切标签页导致的物理穿模/暴冲

  private updateCallbacks: Set<UpdateCallback> = new Set();
  private renderCallback: RenderCallback | null = null;

  constructor() {
    this.tick = this.tick.bind(this);
  }

  public registerUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.unregisterUpdate(callback);
  }

  public unregisterUpdate(callback: UpdateCallback): void {
    this.updateCallbacks.delete(callback);
  }

  public setRender(callback: RenderCallback): void {
    this.renderCallback = callback;
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick(currentTime: number): void {
    if (!this.isRunning) return;

    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 限制单帧最大时间步长
    if (deltaTime > this.maxDeltaTime) {
      deltaTime = this.maxDeltaTime;
    }

    this.elapsedTime += deltaTime;

    // 1. 更新所有注册的游戏逻辑子系统
    this.updateCallbacks.forEach((cb) => {
      try {
        cb(deltaTime, this.elapsedTime);
      } catch (err) {
        console.error('[GameLoop] Error in update callback:', err);
      }
    });

    // 2. 渲染帧
    if (this.renderCallback) {
      try {
        this.renderCallback();
      } catch (err) {
        console.error('[GameLoop] Error in render callback:', err);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public get running(): boolean {
    return this.isRunning;
  }

  public get totalTime(): number {
    return this.elapsedTime;
  }
}
