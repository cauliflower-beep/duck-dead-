export class ObjectPool<T> {
  private pool: T[] = [];
  private activeItems: Set<T> = new Set();
  private factory: () => T;
  private resetFn?: (item: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    resetFn?: (item: T) => void,
    initialSize: number = 10,
    maxSize: number = 200
  ) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 从对象池获取一个可用实例
   */
  public get(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }

    if (this.resetFn) {
      this.resetFn(item);
    }

    this.activeItems.add(item);
    return item;
  }

  /**
   * 将使用完毕的对象回收至对象池
   */
  public release(item: T): void {
    if (!this.activeItems.has(item)) {
      return;
    }

    this.activeItems.delete(item);

    if (this.resetFn) {
      this.resetFn(item);
    }

    if (this.pool.length < this.maxSize) {
      this.pool.push(item);
    }
  }

  /**
   * 回收当前所有处于活跃状态的对象
   */
  public releaseAll(): void {
    const active = Array.from(this.activeItems);
    for (const item of active) {
      this.release(item);
    }
  }

  /**
   * 获取当前活跃数量
   */
  public get activeCount(): number {
    return this.activeItems.size;
  }

  /**
   * 获取池中闲置可用数量
   */
  public get idleCount(): number {
    return this.pool.length;
  }

  /**
   * 清理并销毁对象池
   */
  public clear(destroyFn?: (item: T) => void): void {
    this.releaseAll();
    if (destroyFn) {
      this.pool.forEach(destroyFn);
    }
    this.pool = [];
    this.activeItems.clear();
  }
}
