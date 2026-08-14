import * as THREE from 'three';
import { BaseDuck } from './BaseDuck';
import { DUCKS_CONFIG, DuckType } from '../../config/ducks.config';

export class CopterDuck extends BaseDuck {
  private propeller: THREE.Group | null = null;
  private sineOffset: number = 0;
  private basePosition: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    super(DUCKS_CONFIG[DuckType.COPTER]);
  }

  /**
   * 头顶竹蜻蜓/螺旋桨装置
   */
  protected override buildAccessories(): void {
    this.propeller = new THREE.Group();
    this.propeller.position.set(0, 1.25, 0.45);

    // 竹蜻蜓立杆
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xffa502 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.12;
    this.propeller.add(stem);

    // 旋转叶片
    const bladeGeo = new THREE.BoxGeometry(1.2, 0.03, 0.16);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x2ed573,
      metalness: 0.2,
      roughness: 0.4
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.25;
    this.propeller.add(blade);

    this.mesh.add(this.propeller);
  }

  public override spawn(startPos: THREE.Vector3, velocity: THREE.Vector3): void {
    super.spawn(startPos, velocity);
    this.basePosition.copy(startPos);
    this.sineOffset = Math.random() * Math.PI * 2;
  }

  /**
   * 极速螺旋与 S 型波浪机动轨迹
   */
  protected override updateFlightPath(deltaTime: number): void {
    // 1. 竹蜻蜓超高速旋转
    if (this.propeller) {
      this.propeller.rotation.y += deltaTime * 28;
    }

    // 2. 主速度位移
    this.basePosition.addScaledVector(this.velocity, deltaTime);

    // 3. S型波浪垂直与侧向机动叠加
    const waveFreq = 4.5;
    const waveAmpY = 1.4;
    const waveAmpSide = 1.8;

    const time = this.flightTime * waveFreq + this.sineOffset;
    const offsetY = Math.sin(time) * waveAmpY;
    const offsetX = Math.cos(time * 0.8) * waveAmpSide;

    this.mesh.position.set(
      this.basePosition.x + offsetX,
      this.basePosition.y + offsetY,
      this.basePosition.z
    );

    // 计算瞬时切线朝向
    if (this.velocity.lengthSq() > 0.01) {
      const tangent = this.velocity.clone().add(new THREE.Vector3(
        -Math.sin(time * 0.8) * waveAmpSide * 0.8,
        Math.cos(time) * waveAmpY,
        0
      ));
      const lookTarget = this.mesh.position.clone().add(tangent);
      this.mesh.lookAt(lookTarget);
    }
  }
}
