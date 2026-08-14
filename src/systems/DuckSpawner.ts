import * as THREE from 'three';
import { BaseDuck } from '../entities/ducks/BaseDuck';
import { NormalDuck } from '../entities/ducks/NormalDuck';
import { CopterDuck } from '../entities/ducks/CopterDuck';
import { ChonkyBoss } from '../entities/ducks/ChonkyBoss';
import { ObjectPool } from '../core/ObjectPool';
import { DuckType } from '../config/ducks.config';
import { GAME_CONFIG } from '../config/game.config';
import { EventBus, GameEvents } from '../core/EventBus';

export class DuckSpawner {
  public group: THREE.Group;
  private scene: THREE.Scene;

  // 各类型鸭子对象池
  private normalPool: ObjectPool<NormalDuck>;
  private copterPool: ObjectPool<CopterDuck>;
  private bossPool: ObjectPool<ChonkyBoss>;

  private activeDucks: BaseDuck[] = [];

  // 波次与生成调度
  public currentWave: number = 0;
  private waveTimer: number = 0;
  private spawnInterval: number = 1.4;
  private spawnTimer: number = 0;
  private ducksToSpawnInWave: DuckType[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'DuckSpawnerGroup';
    this.scene.add(this.group);

    // 初始化各个对象池
    this.normalPool = new ObjectPool<NormalDuck>(
      () => {
        const duck = new NormalDuck();
        this.group.add(duck.mesh);
        return duck;
      },
      (duck) => duck.reset(),
      10,
      30
    );

    this.copterPool = new ObjectPool<CopterDuck>(
      () => {
        const duck = new CopterDuck();
        this.group.add(duck.mesh);
        return duck;
      },
      (duck) => duck.reset(),
      6,
      20
    );

    this.bossPool = new ObjectPool<ChonkyBoss>(
      () => {
        const duck = new ChonkyBoss();
        this.group.add(duck.mesh);
        return duck;
      },
      (duck) => duck.reset(),
      2,
      5
    );
  }

  /**
   * 启动指定波次
   */
  public startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.waveTimer = GAME_CONFIG.waveSettings.baseWaveDuration;
    this.spawnTimer = 0.5; // 稍作停顿后开始喷涌生成

    const totalDucks =
      GAME_CONFIG.waveSettings.initialDuckCount +
      (waveNumber - 1) * GAME_CONFIG.waveSettings.duckCountIncrement;

    const isBossWave = waveNumber % GAME_CONFIG.waveSettings.bossWaveInterval === 0;

    // 构建波次生成队列
    this.ducksToSpawnInWave = [];

    if (isBossWave) {
      this.ducksToSpawnInWave.push(DuckType.CHONKY_BOSS);
    }

    for (let i = 0; i < totalDucks; i++) {
      if (waveNumber > 1 && Math.random() < Math.min(0.6, 0.25 + waveNumber * 0.08)) {
        this.ducksToSpawnInWave.push(DuckType.COPTER);
      } else {
        this.ducksToSpawnInWave.push(DuckType.NORMAL);
      }
    }

    // 随机打乱队列
    this.ducksToSpawnInWave.sort(() => Math.random() - 0.5);

    EventBus.getInstance().emit(GameEvents.WAVE_START, {
      waveNumber,
      duckCount: this.ducksToSpawnInWave.length,
      hasBoss: isBossWave
    });
  }

  /**
   * 调度生成单只鸭子
   */
  private spawnSingleDuck(type: DuckType): void {
    let duck: BaseDuck;

    switch (type) {
      case DuckType.COPTER:
        duck = this.copterPool.get();
        break;
      case DuckType.CHONKY_BOSS:
        duck = this.bossPool.get();
        break;
      case DuckType.NORMAL:
      default:
        duck = this.normalPool.get();
        break;
    }

    // 随机生成起点与目标航迹
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -26 : 26;
    const endX = fromLeft ? 26 : -26;

    const startY = 2.5 + Math.random() * 8.5;
    const endY = 3.0 + Math.random() * 8.0;

    const startZ = -8 - Math.random() * 20;
    const endZ = -8 - Math.random() * 20;

    const startPos = new THREE.Vector3(startX, startY, startZ);
    const endPos = new THREE.Vector3(endX, endY, endZ);

    const speed = duck.config.baseSpeed * (1.0 + (this.currentWave - 1) * 0.05);
    const direction = endPos.clone().sub(startPos).normalize();
    const velocity = direction.multiplyScalar(speed);

    duck.spawn(startPos, velocity);
    this.activeDucks.push(duck);
  }

  /**
   * 每帧更新生成器逻辑与所有活跃鸭子
   */
  public update(deltaTime: number): void {
    // 1. 检查是否需要生成下一只鸭子
    if (this.ducksToSpawnInWave.length > 0) {
      this.spawnTimer -= deltaTime;
      if (this.spawnTimer <= 0) {
        const nextType = this.ducksToSpawnInWave.shift()!;
        this.spawnSingleDuck(nextType);
        this.spawnInterval = Math.max(0.7, 1.6 - this.currentWave * 0.1);
        this.spawnTimer = this.spawnInterval + (Math.random() - 0.5) * 0.4;
      }
    }

    // 2. 波次倒计时
    this.waveTimer -= deltaTime;
    if (this.waveTimer <= 0 && this.ducksToSpawnInWave.length === 0 && this.activeDucks.length === 0) {
      this.startWave(this.currentWave + 1);
    }

    // 3. 更新所有活跃鸭子
    for (let i = this.activeDucks.length - 1; i >= 0; i--) {
      const duck = this.activeDucks[i];
      duck.update(deltaTime);

      // 若鸭子已死亡/移出边界并 despawn，则回收至对应池中
      if (!duck.isAlive) {
        this.activeDucks.splice(i, 1);

        if (duck instanceof NormalDuck) {
          this.normalPool.release(duck);
        } else if (duck instanceof CopterDuck) {
          this.copterPool.release(duck);
        } else if (duck instanceof ChonkyBoss) {
          this.bossPool.release(duck);
        }
      }
    }
  }

  public getActiveDucks(): BaseDuck[] {
    return this.activeDucks;
  }

  /**
   * 重置全部波次与清空在场鸭子
   */
  public reset(): void {
    this.ducksToSpawnInWave = [];
    this.currentWave = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;

    for (const duck of this.activeDucks) {
      duck.despawn();
      if (duck instanceof NormalDuck) {
        this.normalPool.release(duck);
      } else if (duck instanceof CopterDuck) {
        this.copterPool.release(duck);
      } else if (duck instanceof ChonkyBoss) {
        this.bossPool.release(duck);
      }
    }
    this.activeDucks = [];
  }
}
