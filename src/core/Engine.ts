import * as THREE from 'three';
import { EventBus, GameEvents } from './EventBus';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public container: HTMLElement;

  // 光源
  public sunLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;
  public hemiLight!: THREE.HemisphereLight;

  // 屏幕震颤（Screenshake）
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private cameraOriginalPosition: THREE.Vector3 = new THREE.Vector3(0, 1.7, 0);

  constructor(containerId: string = 'game-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`[Engine] Container #${containerId} not found!`);
    }
    this.container = container;

    // 1. 初始化场景与雾效
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70c1ff); // 明亮卡通天蓝
    this.scene.fog = new THREE.FogExp2(0x70c1ff, 0.012);

    // 2. 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.copy(this.cameraOriginalPosition);
    this.scene.add(this.camera);

    // 3. 初始化 WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // 4. 初始化光源
    this.setupLighting();

    // 5. 监听窗口缩放与事件
    this.initEventListeners();
  }

  private setupLighting(): void {
    // 基础环境光
    this.ambientLight = new THREE.AmbientLight(0xfffae6, 0.75);
    this.scene.add(this.ambientLight);

    // 半球光（天光与地光反射）
    this.hemiLight = new THREE.HemisphereLight(0x90e0ef, 0x55efc4, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 主太阳光（带阴影投射）
    this.sunLight = new THREE.DirectionalLight(0xfff3c4, 1.4);
    this.sunLight.position.set(25, 45, 20);
    this.sunLight.castShadow = true;

    // 配置高质量阴影相机的正交投影范围
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;

    const shadowDist = 35;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0004;

    this.scene.add(this.sunLight);
  }

  private initEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 监听屏幕震动事件
    EventBus.getInstance().on(GameEvents.SCREEN_SHAKE, (data: { intensity: number; duration: number }) => {
      this.triggerScreenShake(data.intensity, data.duration);
    });
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * 触发相机震动
   */
  public triggerScreenShake(intensity: number = 0.08, duration: number = 0.18): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /**
   * 更新震动与相机偏移
   */
  public update(deltaTime: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;

      // 快速随机微偏移
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity * 0.5;

      this.camera.position.x = this.cameraOriginalPosition.x + offsetX;
      this.camera.position.y = this.cameraOriginalPosition.y + offsetY;
      this.camera.position.z = this.cameraOriginalPosition.z + offsetZ;
    } else {
      this.camera.position.copy(this.cameraOriginalPosition);
      this.shakeIntensity = 0;
    }
  }

  /**
   * 渲染单帧
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
