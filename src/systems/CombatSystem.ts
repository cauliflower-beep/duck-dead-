import * as THREE from 'three';
import { EventBus, GameEvents } from '../core/EventBus';
import { ParticleSystem } from './ParticleSystem';
import { DuckSpawner } from './DuckSpawner';
import { BaseDuck } from '../entities/ducks/BaseDuck';
import { ScoreManager } from './ScoreManager';

export class CombatSystem {
  private camera: THREE.PerspectiveCamera;
  private particleSystem: ParticleSystem;
  private duckSpawner: DuckSpawner;
  private scoreManager: ScoreManager;
  private raycaster: THREE.Raycaster;
  private centerCoord = new THREE.Vector2(0, 0);

  constructor(
    camera: THREE.PerspectiveCamera,
    particleSystem: ParticleSystem,
    duckSpawner: DuckSpawner,
    scoreManager: ScoreManager
  ) {
    this.camera = camera;
    this.particleSystem = particleSystem;
    this.duckSpawner = duckSpawner;
    this.scoreManager = scoreManager;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 120;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.getInstance().on(
      GameEvents.WEAPON_FIRED,
      (data: { origin: THREE.Vector3; direction: THREE.Vector3 }) => {
        this.processShot(data.origin, data.direction);
      }
    );
  }

  /**
   * 处理单次射击判定
   */
  public processShot(muzzleOrigin: THREE.Vector3, direction: THREE.Vector3): void {
    // 1. 枪口爆米花火花特效
    this.particleSystem.emitMuzzlePopcorn(muzzleOrigin, direction, 4);

    // 2. 统计开火次数
    this.scoreManager.recordShotFired();

    // 3. 从相机中心向前方投射射线
    this.raycaster.setFromCamera(this.centerCoord, this.camera);

    const activeDucks = this.duckSpawner.getActiveDucks();
    if (activeDucks.length === 0) {
      return;
    }

    // 收集所有活跃鸭子的可碰撞网格并建立映射
    const targetMap = new Map<THREE.Object3D, BaseDuck>();
    const checkObjects: THREE.Object3D[] = [];

    activeDucks.forEach((duck) => {
      if (duck.isAlive && !duck.isDying) {
        duck.hitTargets.forEach((targetMesh) => {
          checkObjects.push(targetMesh);
          targetMap.set(targetMesh, duck);
        });
      }
    });

    const intersects = this.raycaster.intersectObjects(checkObjects, true);

    if (intersects.length > 0) {
      // 命中最近的有效目标
      const hit = intersects[0];
      let hitMesh: THREE.Object3D | null = hit.object;

      // 递归向上查找注册的目标
      while (hitMesh && !targetMap.has(hitMesh)) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && targetMap.has(hitMesh)) {
        const duck = targetMap.get(hitMesh)!;
        this.handleDuckHit(duck, hit.point);
      }
    }
  }

  /**
   * 鸭子命中结算与特效派发
   */
  private handleDuckHit(duck: BaseDuck, hitPoint: THREE.Vector3): void {
    const damage = 1;
    const isFatal = duck.takeDamage(damage);

    // 统计命中次数
    this.scoreManager.recordShotHit();

    // 触发羽毛/爆米花散落特效
    this.particleSystem.emitHitFeathers(hitPoint, duck.config.primaryColor, 8);

    // 触发屏幕微震
    EventBus.getInstance().emit(GameEvents.SCREEN_SHAKE, {
      intensity: isFatal ? 0.09 : 0.04,
      duration: 0.14
    });

    // 广播命中事件（HUD 显示 Hitmarker、音效播放等）
    EventBus.getInstance().emit(GameEvents.DUCK_HIT, {
      duck,
      hitPosition: hitPoint,
      damage,
      isFatal
    });

    // 若击杀
    if (isFatal) {
      this.particleSystem.emitDuckExplosion(hitPoint, duck.config.primaryColor, 28);

      const scoreGain = this.scoreManager.addScoreForDuck(duck);

      EventBus.getInstance().emit(GameEvents.DUCK_KILLED, {
        duck,
        position: hitPoint,
        scoreGain,
        comboCount: this.scoreManager.currentCombo
      });
    }
  }
}
