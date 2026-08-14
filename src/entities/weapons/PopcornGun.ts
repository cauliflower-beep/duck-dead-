import * as THREE from 'three';
import { BaseWeapon } from './BaseWeapon';
import { WEAPONS_CONFIG } from '../../config/weapons.config';
import { EventBus, GameEvents } from '../../core/EventBus';

export class PopcornGun extends BaseWeapon {
  // 静态默认持枪位与旋转
  private readonly defaultPosition = new THREE.Vector3(0.26, -0.24, -0.52);
  private readonly defaultRotation = new THREE.Euler(0.04, -0.06, 0.02);

  // 弹簧物理后坐力状态
  private recoilPos = new THREE.Vector3(0, 0, 0);
  private recoilVel = new THREE.Vector3(0, 0, 0);
  private recoilRot = new THREE.Vector3(0, 0, 0);
  private recoilRotVel = new THREE.Vector3(0, 0, 0);

  // 待机呼吸与晃动
  private idleTime: number = 0;

  // 枪口微光
  private muzzleFlash: THREE.PointLight;
  private muzzleFlashTimer: number = 0;

  constructor() {
    super(WEAPONS_CONFIG.POPCORN_GUN);

    this.buildGunModel();

    // 枪口闪光点光源
    this.muzzleFlash = new THREE.PointLight(0xfff200, 0, 4);
    this.muzzleFlash.position.set(0, 0.06, -0.4);
    this.mesh.add(this.muzzleFlash);

    this.resetTransform();
  }

  /**
   * 使用原生几何体装配搞怪爆米花发射枪模型
   */
  private buildGunModel(): void {
    const gunGroup = new THREE.Group();

    // 1. 材质定义
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xee5253, // 爆米花桶经典红
      roughness: 0.4,
      metalness: 0.1
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // 经典白条纹
      roughness: 0.4
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x576574,
      roughness: 0.3,
      metalness: 0.8
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfeca57,
      roughness: 0.2,
      metalness: 0.7
    });

    const popcornKernelMat = new THREE.MeshStandardMaterial({
      color: 0xfffa65,
      roughness: 0.9,
      flatShading: true
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8d5524,
      roughness: 0.8
    });

    // 2. 枪身主体：红白相间的圆台爆米花桶
    const bucketHeight = 0.28;
    const bucketGeo = new THREE.CylinderGeometry(0.11, 0.08, bucketHeight, 16);
    const bucket = new THREE.Mesh(bucketGeo, redMat);
    bucket.rotation.x = Math.PI / 2; // 水平朝前
    bucket.position.set(0, 0, 0);
    gunGroup.add(bucket);

    // 爆米花桶白色装饰条纹环
    for (let ring = -1; ring <= 1; ring += 2) {
      const ringGeo = new THREE.TorusGeometry(0.098 + ring * 0.008, 0.008, 8, 16);
      const ringMesh = new THREE.Mesh(ringGeo, whiteMat);
      ringMesh.position.set(0, 0, ring * 0.08);
      gunGroup.add(ringMesh);
    }

    // 3. 枪口漏斗与金属喷管
    const nozzleGeo = new THREE.CylinderGeometry(0.045, 0.075, 0.14, 16);
    const nozzle = new THREE.Mesh(nozzleGeo, metalMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0, -0.2);
    gunGroup.add(nozzle);

    const barrelRingGeo = new THREE.TorusGeometry(0.05, 0.01, 8, 16);
    const barrelRing = new THREE.Mesh(barrelRingGeo, goldMat);
    barrelRing.position.set(0, 0, -0.27);
    gunGroup.add(barrelRing);

    // 4. 枪体上方的透明/开放式爆米花装弹料斗
    const hopperGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.1, 12);
    const hopper = new THREE.Mesh(hopperGeo, goldMat);
    hopper.position.set(0, 0.11, -0.04);
    gunGroup.add(hopper);

    // 塞入几颗饱满的爆米花模型点缀
    for (let k = 0; k < 5; k++) {
      const kernelGeo = new THREE.DodecahedronGeometry(0.024, 0);
      const kernel = new THREE.Mesh(kernelGeo, popcornKernelMat);
      const angle = (k / 5) * Math.PI * 2;
      kernel.position.set(
        Math.cos(angle) * 0.025,
        0.15 + (k % 2) * 0.015,
        -0.04 + Math.sin(angle) * 0.025
      );
      kernel.rotation.set(Math.random(), Math.random(), Math.random());
      gunGroup.add(kernel);
    }

    // 5. 握把与扳机护圈
    const gripGeo = new THREE.BoxGeometry(0.05, 0.15, 0.07);
    const grip = new THREE.Mesh(gripGeo, woodMat);
    grip.position.set(0, -0.12, 0.06);
    grip.rotation.x = -0.3;
    gunGroup.add(grip);

    // 扳机护圈
    const triggerGuardGeo = new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI);
    const triggerGuard = new THREE.Mesh(triggerGuardGeo, metalMat);
    triggerGuard.position.set(0, -0.07, -0.01);
    triggerGuard.rotation.y = Math.PI / 2;
    gunGroup.add(triggerGuard);

    this.mesh.add(gunGroup);
  }

  private resetTransform(): void {
    this.mesh.position.copy(this.defaultPosition);
    this.mesh.rotation.copy(this.defaultRotation);
    this.recoilPos.set(0, 0, 0);
    this.recoilVel.set(0, 0, 0);
    this.recoilRot.set(0, 0, 0);
    this.recoilRotVel.set(0, 0, 0);
  }

  /**
   * 尝试射击
   */
  public tryShoot(origin: THREE.Vector3, direction: THREE.Vector3): boolean {
    if (this.isReloading) {
      return false;
    }

    if (this.fireTimer > 0) {
      return false;
    }

    if (this.currentAmmo <= 0) {
      EventBus.getInstance().emit(GameEvents.WEAPON_DRY_FIRE);
      this.startReload();
      return false;
    }

    // 扣减弹药并设置射速冷却
    this.currentAmmo--;
    this.fireTimer = this.config.fireRate;

    // 触发强力后坐力冲量（向后位移与上抬旋转）
    this.recoilVel.z += this.config.recoilKick * 24;
    this.recoilVel.y += this.config.recoilKick * 6;
    this.recoilRotVel.x -= this.config.recoilRotKick * 20;
    this.recoilRotVel.z += (Math.random() - 0.5) * 4;

    // 枪口火光闪现
    this.muzzleFlash.intensity = 3.5;
    this.muzzleFlashTimer = 0.05;

    // 广播事件
    EventBus.getInstance().emit(GameEvents.WEAPON_FIRED, {
      origin,
      direction: direction.clone()
    });

    EventBus.getInstance().emit(GameEvents.AMMO_CHANGED, {
      current: this.currentAmmo,
      max: this.config.magazineSize
    });

    EventBus.getInstance().emit(GameEvents.SCREEN_SHAKE, {
      intensity: 0.04,
      duration: 0.12
    });

    // 若弹药打空则自动进入换弹
    if (this.currentAmmo === 0) {
      this.startReload();
    }

    return true;
  }

  /**
   * 开始换弹
   */
  public startReload(): boolean {
    if (this.isReloading || this.currentAmmo === this.config.magazineSize) {
      return false;
    }

    this.isReloading = true;
    this.reloadTimer = this.config.reloadTime;

    EventBus.getInstance().emit(GameEvents.RELOAD_START, {
      duration: this.config.reloadTime
    });

    return true;
  }

  /**
   * 更新后坐力弹簧物理、待机动画与换弹状态
   */
  public update(deltaTime: number): void {
    if (this.fireTimer > 0) {
      this.fireTimer -= deltaTime;
    }

    // 枪口微光衰减
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= deltaTime;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash.intensity = 0;
      }
    }

    // 换弹状态更新与动画
    if (this.isReloading) {
      this.reloadTimer -= deltaTime;
      const reloadProgress = 1 - this.reloadTimer / this.config.reloadTime;

      // 换弹下倾动画
      const dipAngle = Math.sin(reloadProgress * Math.PI) * 0.45;
      this.mesh.rotation.x = this.defaultRotation.x - dipAngle;
      this.mesh.position.y = this.defaultPosition.y - Math.sin(reloadProgress * Math.PI) * 0.15;

      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.currentAmmo = this.config.magazineSize;
        EventBus.getInstance().emit(GameEvents.AMMO_CHANGED, {
          current: this.currentAmmo,
          max: this.config.magazineSize
        });
        EventBus.getInstance().emit(GameEvents.RELOAD_FINISH);
      }
      return;
    }

    // 弹簧物理阻尼模拟：F = -kx - cv
    const k = this.config.springStiffness;
    const c = this.config.springDamping;

    // 位置弹簧
    const forceX = -k * this.recoilPos.x - c * this.recoilVel.x;
    const forceY = -k * this.recoilPos.y - c * this.recoilVel.y;
    const forceZ = -k * this.recoilPos.z - c * this.recoilVel.z;

    this.recoilVel.x += forceX * deltaTime;
    this.recoilVel.y += forceY * deltaTime;
    this.recoilVel.z += forceZ * deltaTime;

    this.recoilPos.x += this.recoilVel.x * deltaTime;
    this.recoilPos.y += this.recoilVel.y * deltaTime;
    this.recoilPos.z += this.recoilVel.z * deltaTime;

    // 旋转弹簧
    const rotForceX = -k * this.recoilRot.x - c * this.recoilRotVel.x;
    const rotForceZ = -k * this.recoilRot.z - c * this.recoilRotVel.z;

    this.recoilRotVel.x += rotForceX * deltaTime;
    this.recoilRotVel.z += rotForceZ * deltaTime;

    this.recoilRot.x += this.recoilRotVel.x * deltaTime;
    this.recoilRot.z += this.recoilRotVel.z * deltaTime;

    // 待机呼吸微动
    this.idleTime += deltaTime * 2.2;
    const idleOffsetY = Math.sin(this.idleTime) * 0.003;
    const idleOffsetX = Math.cos(this.idleTime * 0.5) * 0.002;

    // 应用变换
    this.mesh.position.set(
      this.defaultPosition.x + this.recoilPos.x + idleOffsetX,
      this.defaultPosition.y + this.recoilPos.y + idleOffsetY,
      this.defaultPosition.z + this.recoilPos.z
    );

    this.mesh.rotation.set(
      this.defaultRotation.x + this.recoilRot.x,
      this.defaultRotation.y,
      this.defaultRotation.z + this.recoilRot.z
    );
  }

  public reset(): void {
    this.currentAmmo = this.config.magazineSize;
    this.isReloading = false;
    this.fireTimer = 0;
    this.reloadTimer = 0;
    this.muzzleFlash.intensity = 0;
    this.resetTransform();

    EventBus.getInstance().emit(GameEvents.AMMO_CHANGED, {
      current: this.currentAmmo,
      max: this.config.magazineSize
    });
  }
}
