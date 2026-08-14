import * as THREE from 'three';

export class Environment {
  public group: THREE.Group;
  private clouds: THREE.Group[] = [];
  private waterMesh: THREE.Mesh | null = null;
  private waterTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Environment';

    this.createGround();
    this.createFence();
    this.createPond();
    this.createTrees();
    this.createDecorations();
    this.createClouds();
  }

  /**
   * 1. 糖果色卡通草坪地面
   */
  private createGround(): void {
    // 宽广主地面
    const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71, // 鲜亮卡通草绿
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 靶场木质活动区地面底板
    const rangeGeo = new THREE.BoxGeometry(60, 0.4, 50);
    const rangeMat = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      roughness: 0.9,
      metalness: 0.05
    });
    const rangeFloor = new THREE.Mesh(rangeGeo, rangeMat);
    rangeFloor.position.set(0, -0.2, -18);
    rangeFloor.receiveShadow = true;
    this.group.add(rangeFloor);
  }

  /**
   * 2. 环绕农场木栅栏
   */
  private createFence(): void {
    const fenceGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xe67e22, // 温暖木纹色
      roughness: 0.7,
      metalness: 0.1
    });

    const postGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3);
    const plankGeo = new THREE.BoxGeometry(3.2, 0.25, 0.1);

    // 前围栏与侧围栏
    const zPos = -38;
    for (let x = -28; x <= 28; x += 3) {
      // 竖立立柱
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(x, 0.9, zPos);
      post.castShadow = true;
      post.receiveShadow = true;
      fenceGroup.add(post);

      // 上下两道横梁木板
      if (x < 28) {
        const topPlank = new THREE.Mesh(plankGeo, woodMat);
        topPlank.position.set(x + 1.5, 1.3, zPos);
        topPlank.castShadow = true;
        fenceGroup.add(topPlank);

        const btmPlank = new THREE.Mesh(plankGeo, woodMat);
        btmPlank.position.set(x + 1.5, 0.6, zPos);
        btmPlank.castShadow = true;
        fenceGroup.add(btmPlank);
      }
    }

    // 两侧栅栏
    const xOffsets = [-28, 28];
    for (const x of xOffsets) {
      for (let z = -38; z <= 2; z += 3) {
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(x, 0.9, z);
        post.castShadow = true;
        post.receiveShadow = true;
        fenceGroup.add(post);

        if (z < 2) {
          const topPlank = new THREE.Mesh(plankGeo, woodMat);
          topPlank.rotation.y = Math.PI / 2;
          topPlank.position.set(x, 1.3, z + 1.5);
          topPlank.castShadow = true;
          fenceGroup.add(topPlank);

          const btmPlank = new THREE.Mesh(plankGeo, woodMat);
          btmPlank.rotation.y = Math.PI / 2;
          btmPlank.position.set(x, 0.6, z + 1.5);
          btmPlank.castShadow = true;
          fenceGroup.add(btmPlank);
        }
      }
    }

    this.group.add(fenceGroup);
  }

  /**
   * 3. 低模卡通水塘与漂浮荷叶
   */
  private createPond(): void {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(10, 0.05, -20);

    // 水面圆盘
    const waterGeo = new THREE.CylinderGeometry(7.5, 7.5, 0.1, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00d2d3,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.receiveShadow = true;
    pondGroup.add(this.waterMesh);

    // 池塘泥岸边圈
    const bankGeo = new THREE.TorusGeometry(7.5, 0.5, 8, 24);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x8395a7,
      roughness: 0.9,
      flatShading: true
    });
    const bank = new THREE.Mesh(bankGeo, bankMat);
    bank.rotation.x = Math.PI / 2;
    bank.position.y = 0.05;
    bank.receiveShadow = true;
    pondGroup.add(bank);

    // 漂浮荷叶
    const lilyGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.04, 8);
    const lilyMat = new THREE.MeshStandardMaterial({
      color: 0x10ac84,
      roughness: 0.6
    });

    const lilyCoords = [
      [-3, 0.1, -1.5],
      [2, 0.1, 2.5],
      [-1.5, 0.1, 3],
      [3.5, 0.1, -2]
    ];

    lilyCoords.forEach(([lx, ly, lz]) => {
      const lily = new THREE.Mesh(lilyGeo, lilyMat);
      lily.position.set(lx, ly, lz);
      lily.rotation.y = Math.random() * Math.PI;
      lily.receiveShadow = true;
      pondGroup.add(lily);

      // 小莲花花瓣
      const flowerGeo = new THREE.ConeGeometry(0.25, 0.4, 5);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xff9ff3,
        roughness: 0.4
      });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(lx, ly + 0.2, lz);
      flower.rotation.x = Math.PI;
      pondGroup.add(flower);
    });

    this.group.add(pondGroup);
  }

  /**
   * 4. 低模卡通树木（锥形+球形分层叶冠）
   */
  private createTrees(): void {
    const treePositions = [
      [-20, -15], [-24, -28], [-14, -34],
      [22, -12], [24, -30], [16, -35],
      [-6, -36], [5, -37], [-30, -5], [30, -3]
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 2.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x795548,
      roughness: 0.8
    });

    const foliageColors = [0x2ecc71, 0x1abc9c, 0x27ae60, 0x16a085];

    treePositions.forEach(([x, z], index) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      // 树干
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // 树冠（三层递减圆锥）
      const color = foliageColors[index % foliageColors.length];
      const leavesMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        flatShading: true
      });

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2.0, 7), leavesMat);
      cone1.position.y = 2.4;
      cone1.castShadow = true;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 7), leavesMat);
      cone2.position.y = 3.5;
      cone2.castShadow = true;
      tree.add(cone2);

      const cone3 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.4, 7), leavesMat);
      cone3.position.y = 4.4;
      cone3.castShadow = true;
      tree.add(cone3);

      const randomScale = 0.85 + Math.random() * 0.4;
      tree.scale.set(randomScale, randomScale, randomScale);
      this.group.add(tree);
    });
  }

  /**
   * 5. 爆米花箱、木桶与小花点缀
   */
  private createDecorations(): void {
    // 爆米花箱装饰
    const crateGeo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      roughness: 0.7
    });

    const crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-6, 0.7, -6);
    crate1.rotation.y = 0.3;
    crate1.castShadow = true;
    this.group.add(crate1);

    const crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(-7.2, 0.7, -5.2);
    crate2.rotation.y = -0.4;
    crate2.castShadow = true;
    this.group.add(crate2);

    // 小花朵散落
    const flowerColors = [0xff6b81, 0xfff200, 0x70a1ff, 0xffffff];
    for (let i = 0; i < 35; i++) {
      const flowerGroup = new THREE.Group();
      const fx = (Math.random() - 0.5) * 45;
      const fz = -3 - Math.random() * 32;
      flowerGroup.position.set(fx, 0, fz);

      const petalColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.5 });
      const petalGeo = new THREE.SphereGeometry(0.12, 6, 6);

      const centerMat = new THREE.MeshStandardMaterial({ color: 0xffa502 });
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), centerMat);
      center.position.y = 0.15;
      flowerGroup.add(center);

      for (let p = 0; p < 4; p++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (p / 4) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.12, 0.15, Math.sin(angle) * 0.12);
        flowerGroup.add(petal);
      }

      this.group.add(flowerGroup);
    }
  }

  /**
   * 6. 天空漂浮低模棉花糖白云
   */
  private createClouds(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      flatShading: true
    });

    for (let i = 0; i < 7; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 3);

      for (let p = 0; p < numPuffs; p++) {
        const radius = 1.6 + Math.random() * 1.8;
        const puffGeo = new THREE.SphereGeometry(radius, 8, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (p - numPuffs / 2) * 1.8 + (Math.random() - 0.5),
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.2
        );
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 80,
        18 + Math.random() * 12,
        -10 - Math.random() * 45
      );

      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  /**
   * 每帧更新动态环境（云朵漂移、水波微漾）
   */
  public update(deltaTime: number): void {
    // 白云缓慢飘动并循环
    this.clouds.forEach((cloud) => {
      cloud.position.x += deltaTime * 1.2;
      if (cloud.position.x > 45) {
        cloud.position.x = -45;
      }
    });

    // 水面微波
    if (this.waterMesh) {
      this.waterTime += deltaTime * 2;
      this.waterMesh.scale.y = 1.0 + Math.sin(this.waterTime) * 0.04;
    }
  }
}
