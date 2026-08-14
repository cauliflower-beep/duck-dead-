import * as THREE from 'three';
import { DuckConfig, DuckType } from '../../config/ducks.config';
import { GAME_CONFIG } from '../../config/game.config';

export abstract class BaseDuck {
  public mesh: THREE.Group;
  public config: DuckConfig;
  public hp: number;
  public isAlive: boolean = false;
  public isDying: boolean = false;

  // 命中判定主要 Mesh
  public hitTargets: THREE.Object3D[] = [];

  // 移动与路径属性
  public velocity: THREE.Vector3 = new THREE.Vector3();
  protected flightTime: number = 0;
  protected deathTimer: number = 0;
  protected readonly deathDuration: number = 0.45;

  // 受击果冻弹性动画（Squash & Stretch）
  protected squashScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  protected squashVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // 材质与受击闪白
  protected bodyMaterial!: THREE.MeshStandardMaterial;
  protected billMaterial!: THREE.MeshStandardMaterial;
  protected originalColor: number;
  protected hitFlashTimer: number = 0;

  // 翅膀组件（用于扑翼动画）
  protected leftWing: THREE.Mesh | null = null;
  protected rightWing: THREE.Mesh | null = null;

  constructor(config: DuckConfig) {
    this.config = config;
    this.hp = config.maxHp;
    this.originalColor = config.primaryColor;
    this.mesh = new THREE.Group();
    this.mesh.name = `Duck_${config.type}`;

    this.buildDuckGeometry();
  }

  /**
   * 使用原生几何体构建高辨识度的呆萌鸭模型
   */
  protected buildDuckGeometry(): void {
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.config.primaryColor,
      roughness: 0.5,
      metalness: 0.05,
      flatShading: true
    });

    this.billMaterial = new THREE.MeshStandardMaterial({
      color: this.config.billColor,
      roughness: 0.4,
      metalness: 0.1
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 1. 鸭身（压扁的球体）
    const bodyGeo = new THREE.SphereGeometry(0.8, 12, 10);
    bodyGeo.scale(1.0, 0.85, 1.25);
    const body = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    body.position.set(0, 0, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);
    this.hitTargets.push(body);

    // 2. 鸭头
    const headGeo = new THREE.SphereGeometry(0.55, 12, 10);
    const head = new THREE.Mesh(headGeo, this.bodyMaterial);
    head.position.set(0, 0.65, 0.45);
    head.castShadow = true;
    this.mesh.add(head);
    this.hitTargets.push(head);

    // 3. 橘色扁平鸭嘴
    const billGeo = new THREE.BoxGeometry(0.4, 0.12, 0.35);
    const bill = new THREE.Mesh(billGeo, this.billMaterial);
    bill.position.set(0, 0.58, 0.88);
    bill.castShadow = true;
    this.mesh.add(bill);

    // 4. 大眼睛（白眼球 + 黑眼珠）
    const eyeGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);

    // 左眼
    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.25, 0.76, 0.72);
    const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    leftPupil.position.set(-0.27, 0.76, 0.82);
    this.mesh.add(leftEye, leftPupil);

    // 右眼
    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.25, 0.76, 0.72);
    const rightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    rightPupil.position.set(0.27, 0.76, 0.82);
    this.mesh.add(rightEye, rightPupil);

    // 5. 翅膀（左右可扇动）
    const wingGeo = new THREE.BoxGeometry(0.1, 0.4, 0.7);
    this.leftWing = new THREE.Mesh(wingGeo, this.bodyMaterial);
    this.leftWing.position.set(-0.85, 0.1, 0);
    this.leftWing.rotation.z = 0.2;
    this.mesh.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeo, this.bodyMaterial);
    this.rightWing.position.set(0.85, 0.1, 0);
    this.rightWing.rotation.z = -0.2;
    this.mesh.add(this.rightWing);

    // 6. 翘起的小尾巴
    const tailGeo = new THREE.ConeGeometry(0.22, 0.45, 6);
    const tail = new THREE.Mesh(tailGeo, this.bodyMaterial);
    tail.position.set(0, 0.35, -0.95);
    tail.rotation.x = -Math.PI / 3;
    this.mesh.add(tail);

    // 应用整体尺寸缩放
    const baseScale = this.config.scale;
    this.mesh.scale.set(baseScale, baseScale, baseScale);

    // 赋予扩展饰品（子类可重写）
    this.buildAccessories();
  }

  /**
   * 子类重写：添加帽子、竹蜻蜓、墨镜等装饰
   */
  protected buildAccessories(): void {}

  /**
   * 生成重置与发射
   */
  public spawn(startPos: THREE.Vector3, velocity: THREE.Vector3): void {
    this.hp = this.config.maxHp;
    this.isAlive = true;
    this.isDying = false;
    this.deathTimer = 0;
    this.flightTime = Math.random() * 10;
    this.hitFlashTimer = 0;

    this.mesh.position.copy(startPos);
    this.velocity.copy(velocity);

    this.squashScale.set(1, 1, 1);
    this.squashVel.set(0, 0, 0);

    const s = this.config.scale;
    this.mesh.scale.set(s, s, s);
    this.mesh.visible = true;

    // 面向速度方向
    if (velocity.lengthSq() > 0.001) {
      this.mesh.lookAt(startPos.clone().add(velocity));
    }
  }

  /**
   * 承受伤害
   */
  public takeDamage(amount: number): boolean {
    if (!this.isAlive || this.isDying) return false;

    this.hp -= amount;

    // 1. 触发 Squash & Stretch 果冻受击形变
    this.squashScale.set(1.4, 0.55, 1.4);
    this.squashVel.set(-8, 12, -8);

    // 2. 材质受击闪白
    this.hitFlashTimer = 0.09;
    this.bodyMaterial.color.setHex(0xffffff);

    // 3. 判断是否死亡
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDying = true;
      this.deathTimer = this.deathDuration;
      return true; // 造成击杀
    }

    return false;
  }

  /**
   * 每帧更新物理与行为
   */
  public update(deltaTime: number): void {
    if (!this.isAlive) return;

    // 1. 受击闪白恢复
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer <= 0) {
        this.bodyMaterial.color.setHex(this.originalColor);
      }
    }

    // 2. 死亡升天旋转退场动画
    if (this.isDying) {
      this.deathTimer -= deltaTime;
      const progress = 1 - this.deathTimer / this.deathDuration;

      // 旋转狂飙并缩小上升
      this.mesh.rotation.x += deltaTime * 16;
      this.mesh.rotation.y += deltaTime * 20;
      this.mesh.position.y += deltaTime * 12;

      const shrink = (1 - progress) * this.config.scale;
      this.mesh.scale.set(Math.max(0, shrink), Math.max(0, shrink), Math.max(0, shrink));

      if (this.deathTimer <= 0) {
        this.despawn();
      }
      return;
    }

    // 3. 飞行时间累计
    this.flightTime += deltaTime;

    // 4. 扇动翅膀
    const flapAngle = Math.sin(this.flightTime * 14) * 0.35;
    if (this.leftWing) this.leftWing.rotation.z = 0.2 + flapAngle;
    if (this.rightWing) this.rightWing.rotation.z = -0.2 - flapAngle;

    // 5. 更新飞行轨迹与位移
    this.updateFlightPath(deltaTime);

    // 6. 受击果冻回弹物理：F = -kx - cv
    const k = 140;
    const c = 12;

    const diffX = 1 - this.squashScale.x;
    const diffY = 1 - this.squashScale.y;
    const diffZ = 1 - this.squashScale.z;

    this.squashVel.x += (k * diffX - c * this.squashVel.x) * deltaTime;
    this.squashVel.y += (k * diffY - c * this.squashVel.y) * deltaTime;
    this.squashVel.z += (k * diffZ - c * this.squashVel.z) * deltaTime;

    this.squashScale.x += this.squashVel.x * deltaTime;
    this.squashScale.y += this.squashVel.y * deltaTime;
    this.squashScale.z += this.squashVel.z * deltaTime;

    // 应用形变与呆萌微晃
    const wobbleY = Math.sin(this.flightTime * this.config.wobbleSpeed) * this.config.wobbleAmount;
    const s = this.config.scale;
    this.mesh.scale.set(
      this.squashScale.x * s,
      (this.squashScale.y + wobbleY) * s,
      this.squashScale.z * s
    );

    // 7. 边界检查（飞出射击靶场太远则自动回收）
    this.checkBounds();
  }

  /**
   * 航迹算法更新（子类可重写以实现正弦波、螺旋机动）
   */
  protected updateFlightPath(deltaTime: number): void {
    this.mesh.position.addScaledVector(this.velocity, deltaTime);

    // 保持朝向移动方向
    if (this.velocity.lengthSq() > 0.01) {
      const targetLook = this.mesh.position.clone().add(this.velocity);
      this.mesh.lookAt(targetLook);
    }
  }

  /**
   * 检查靶场边界，超出范围自动脱离回收
   */
  protected checkBounds(): void {
    const p = this.mesh.position;
    const b = GAME_CONFIG.arenaBounds;

    if (p.x < b.minX - 8 || p.x > b.maxX + 8 || p.y < -1 || p.y > b.maxY + 8 || p.z < b.minZ - 8 || p.z > b.maxZ + 12) {
      this.despawn();
    }
  }

  /**
   * 实例注销与隐藏
   */
  public despawn(): void {
    this.isAlive = false;
    this.isDying = false;
    this.mesh.visible = false;
  }

  public reset(): void {
    this.despawn();
  }
}
