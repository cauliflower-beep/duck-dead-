import * as THREE from 'three';
import { ObjectPool } from '../core/ObjectPool';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  baseScale: number;
  isAlive: boolean;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particlePool: ObjectPool<Particle>;
  private activeParticles: Set<Particle> = new Set();

  // 共享几何体与材质提升性能
  private popcornGeo = new THREE.DodecahedronGeometry(0.12, 0);
  private featherGeo = new THREE.PlaneGeometry(0.2, 0.35);
  private confettiGeo = new THREE.BoxGeometry(0.14, 0.14, 0.02);

  private popcornMat = new THREE.MeshStandardMaterial({
    color: 0xfffa65,
    roughness: 0.8,
    flatShading: true
  });

  private confettiColors = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0x9b59b6, 0xff6b81];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';
    scene.add(this.group);

    this.particlePool = new ObjectPool<Particle>(
      () => this.createParticleObject(),
      (p) => this.resetParticle(p),
      80,
      300
    );
  }

  private createParticleObject(): Particle {
    const mesh = new THREE.Mesh(this.popcornGeo, this.popcornMat);
    mesh.visible = false;
    this.group.add(mesh);

    return {
      mesh,
      velocity: new THREE.Vector3(),
      rotVelocity: new THREE.Vector3(),
      gravity: -9.8,
      drag: 0.98,
      life: 0,
      maxLife: 1.0,
      baseScale: 1.0,
      isAlive: false
    };
  }

  private resetParticle(p: Particle): void {
    p.mesh.visible = false;
    p.isAlive = false;
    p.velocity.set(0, 0, 0);
    p.rotVelocity.set(0, 0, 0);
    p.life = 0;
  }

  /**
   * 枪口爆米花喷溅
   */
  public emitMuzzlePopcorn(origin: THREE.Vector3, direction: THREE.Vector3, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get();
      p.mesh.geometry = this.popcornGeo;
      p.mesh.material = this.popcornMat;

      p.mesh.position.copy(origin);
      p.baseScale = 0.6 + Math.random() * 0.4;
      p.mesh.scale.set(p.baseScale, p.baseScale, p.baseScale);
      p.mesh.visible = true;
      p.isAlive = true;
      p.life = 0.35 + Math.random() * 0.25;
      p.maxLife = p.life;
      p.gravity = -12;
      p.drag = 0.95;

      // 向前冲出加随机扩散
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5 + 0.5,
        (Math.random() - 0.5) * 1.5
      );
      p.velocity.copy(direction).multiplyScalar(14 + Math.random() * 8).add(spread);
      p.rotVelocity.set(Math.random() * 15, Math.random() * 15, Math.random() * 15);

      this.activeParticles.add(p);
    }
  }

  /**
   * 鸭子受击：爆出羽毛与爆米花
   */
  public emitHitFeathers(position: THREE.Vector3, colorHex: number, count: number = 8): void {
    const featherMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get();
      const isFeather = i % 2 === 0;

      p.mesh.geometry = isFeather ? this.featherGeo : this.popcornGeo;
      p.mesh.material = isFeather ? featherMat : this.popcornMat;
      p.mesh.position.copy(position);

      p.baseScale = 0.8 + Math.random() * 0.6;
      p.mesh.scale.set(p.baseScale, p.baseScale, p.baseScale);
      p.mesh.visible = true;
      p.isAlive = true;
      p.life = 0.5 + Math.random() * 0.4;
      p.maxLife = p.life;
      p.gravity = isFeather ? -3.5 : -14; // 羽毛飘落更慢
      p.drag = isFeather ? 0.92 : 0.97;

      // 球形随机炸开
      const speed = 4 + Math.random() * 6;
      const angleTheta = Math.random() * Math.PI * 2;
      const anglePhi = Math.acos(Math.random() * 2 - 1);

      p.velocity.set(
        Math.sin(anglePhi) * Math.cos(angleTheta) * speed,
        Math.sin(anglePhi) * Math.sin(angleTheta) * speed + 2.0,
        Math.cos(anglePhi) * speed
      );

      p.rotVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
      this.activeParticles.add(p);
    }
  }

  /**
   * 鸭子击飞爆炸：漫天彩带、羽毛与金黄爆米花
   */
  public emitDuckExplosion(position: THREE.Vector3, colorHex: number, count: number = 24): void {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get();
      const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
      const confettiMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        side: THREE.DoubleSide
      });

      p.mesh.geometry = i % 3 === 0 ? this.popcornGeo : this.confettiGeo;
      p.mesh.material = i % 3 === 0 ? this.popcornMat : confettiMat;
      p.mesh.position.copy(position);

      p.baseScale = 1.0 + Math.random() * 0.8;
      p.mesh.scale.set(p.baseScale, p.baseScale, p.baseScale);
      p.mesh.visible = true;
      p.isAlive = true;
      p.life = 0.8 + Math.random() * 0.6;
      p.maxLife = p.life;
      p.gravity = -8;
      p.drag = 0.94;

      const speed = 6 + Math.random() * 10;
      const angleTheta = Math.random() * Math.PI * 2;
      const anglePhi = Math.acos(Math.random() * 2 - 1);

      p.velocity.set(
        Math.sin(anglePhi) * Math.cos(angleTheta) * speed,
        Math.sin(anglePhi) * Math.sin(angleTheta) * speed + 4.0,
        Math.cos(anglePhi) * speed
      );

      p.rotVelocity.set(Math.random() * 18, Math.random() * 18, Math.random() * 18);
      this.activeParticles.add(p);
    }
  }

  /**
   * 每帧更新活跃粒子
   */
  public update(deltaTime: number): void {
    const toRelease: Particle[] = [];

    this.activeParticles.forEach((p) => {
      p.life -= deltaTime;
      if (p.life <= 0) {
        toRelease.push(p);
        return;
      }

      // 物理积分
      p.velocity.y += p.gravity * deltaTime;
      p.velocity.multiplyScalar(Math.pow(p.drag, deltaTime * 60));

      p.mesh.position.addScaledVector(p.velocity, deltaTime);

      p.mesh.rotation.x += p.rotVelocity.x * deltaTime;
      p.mesh.rotation.y += p.rotVelocity.y * deltaTime;
      p.mesh.rotation.z += p.rotVelocity.z * deltaTime;

      // 渐进缩小消失
      const progress = p.life / p.maxLife;
      const scale = p.baseScale * Math.min(1, progress * 1.5);
      p.mesh.scale.set(scale, scale, scale);
    });

    // 回收过期粒子
    for (const p of toRelease) {
      this.activeParticles.delete(p);
      this.particlePool.release(p);
    }
  }

  public reset(): void {
    this.activeParticles.forEach((p) => {
      this.particlePool.release(p);
    });
    this.activeParticles.clear();
  }
}
