import * as THREE from 'three';
import { BaseDuck } from './BaseDuck';
import { DUCKS_CONFIG, DuckType } from '../../config/ducks.config';

export class ChonkyBoss extends BaseDuck {
  private circleAngle: number = 0;
  private circleCenter: THREE.Vector3 = new THREE.Vector3(0, 8, -20);
  private circleRadius: number = 14;
  private healthBarMesh: THREE.Mesh | null = null;
  private maxHpScale: number = 1;

  constructor() {
    super(DUCKS_CONFIG[DuckType.CHONKY_BOSS]);
  }

  /**
   * 酷炫配件：巨型黑超墨镜与金冠
   */
  protected override buildAccessories(): void {
    // 1. 酷炫黑超墨镜
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.76, 0.78);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e272e,
      roughness: 0.1,
      metalness: 0.9
    });

    const frameGeo = new THREE.BoxGeometry(0.85, 0.22, 0.08);
    const frame = new THREE.Mesh(frameGeo, glassMat);
    glassesGroup.add(frame);

    // 镜架侧边
    const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.45);
    const leftArm = new THREE.Mesh(armGeo, glassMat);
    leftArm.position.set(-0.4, 0, -0.2);
    const rightArm = new THREE.Mesh(armGeo, glassMat);
    rightArm.position.set(0.4, 0, -0.2);
    glassesGroup.add(leftArm, rightArm);

    this.mesh.add(glassesGroup);

    // 2. 闪亮小金冠
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffd32a,
      metalness: 0.8,
      roughness: 0.2
    });
    const crownGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.3, 5);
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(0, 1.35, 0.45);
    crown.rotation.y = Math.PI / 5;
    this.mesh.add(crown);

    // 3. 头顶血量条（3D 悬浮）
    const barBgMat = new THREE.MeshBasicMaterial({ color: 0x2f3542 });
    const barFillMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });

    const barBg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.05), barBgMat);
    barBg.position.set(0, 1.85, 0);

    this.healthBarMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.06), barFillMat);
    this.healthBarMesh.position.set(0, 1.85, 0.01);

    this.mesh.add(barBg);
    this.mesh.add(this.healthBarMesh);
  }

  public override spawn(startPos: THREE.Vector3, velocity: THREE.Vector3): void {
    super.spawn(startPos, velocity);
    this.circleCenter.set(0, 7.5, -20);
    this.circleAngle = Math.atan2(startPos.z - this.circleCenter.z, startPos.x - this.circleCenter.x);
    this.circleRadius = Math.max(10, startPos.distanceTo(this.circleCenter));
    this.updateHealthBar();
  }

  public override takeDamage(amount: number): boolean {
    const isFatal = super.takeDamage(amount);

    // Boss 具有更夸张的果冻弹性反冲
    this.squashScale.set(1.6, 0.4, 1.6);
    this.squashVel.set(-10, 16, -10);

    this.updateHealthBar();
    return isFatal;
  }

  private updateHealthBar(): void {
    if (this.healthBarMesh) {
      const ratio = Math.max(0, this.hp / this.config.maxHp);
      this.healthBarMesh.scale.x = ratio;
      this.healthBarMesh.position.x = -((1 - ratio) * 1.5) / 2;
    }
  }

  /**
   * 霸主巡空巨幅环形盘旋与俯冲航迹
   */
  protected override updateFlightPath(deltaTime: number): void {
    this.circleAngle += deltaTime * 0.45;

    const x = this.circleCenter.x + Math.cos(this.circleAngle) * this.circleRadius;
    const z = this.circleCenter.z + Math.sin(this.circleAngle) * this.circleRadius;
    const y = this.circleCenter.y + Math.sin(this.flightTime * 1.5) * 2.0;

    const nextX = this.circleCenter.x + Math.cos(this.circleAngle + 0.1) * this.circleRadius;
    const nextZ = this.circleCenter.z + Math.sin(this.circleAngle + 0.1) * this.circleRadius;

    this.mesh.position.set(x, y, z);

    const lookTarget = new THREE.Vector3(nextX, y, nextZ);
    this.mesh.lookAt(lookTarget);

    // 血条始终朝向玩家摄像机（原点/大致前向）
    if (this.healthBarMesh) {
      // 保持血条相对平直
      this.healthBarMesh.quaternion.identity();
    }
  }
}
