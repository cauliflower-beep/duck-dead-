import * as THREE from 'three';
import { BaseDuck } from './BaseDuck';
import { DUCKS_CONFIG, DuckType } from '../../config/ducks.config';

export class NormalDuck extends BaseDuck {
  private wanderTimer: number = 0;
  private wanderAngle: number = 0;

  constructor() {
    super(DUCKS_CONFIG[DuckType.NORMAL]);
  }

  /**
   * 添加可爱的小红帽配饰
   */
  protected override buildAccessories(): void {
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xe84118, // 亮红帽子
      roughness: 0.5
    });

    const capGeo = new THREE.ConeGeometry(0.35, 0.45, 8);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.25, 0.4);
    cap.rotation.x = -0.15;
    this.mesh.add(cap);

    // 帽顶白色毛绒小球
    const pomGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const pomMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pom = new THREE.Mesh(pomGeo, pomMat);
    pom.position.set(0, 1.5, 0.35);
    this.mesh.add(pom);
  }

  /**
   * 呆萌巡航移动，带轻微随机微漂移
   */
  protected override updateFlightPath(deltaTime: number): void {
    this.wanderTimer += deltaTime;
    if (this.wanderTimer > 1.2) {
      this.wanderTimer = 0;
      this.wanderAngle = (Math.random() - 0.5) * 0.4;
    }

    // 微量调整速度航向
    this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.wanderAngle * deltaTime);
    this.mesh.position.addScaledVector(this.velocity, deltaTime);

    // 保持朝向
    if (this.velocity.lengthSq() > 0.01) {
      const lookTarget = this.mesh.position.clone().add(this.velocity);
      this.mesh.lookAt(lookTarget);
    }
  }
}
