import * as THREE from 'three';
import { EventBus, GameEvents } from './EventBus';

export class InputManager {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  public isLocked: boolean = false;
  public isMouseDown: boolean = false;
  private reloadPressed: boolean = false;

  // 视角控制参数
  private sensitivity: number = 0.0022;
  private minPolarAngle: number = -Math.PI / 2.4; // 约 -75 度
  private maxPolarAngle: number = Math.PI / 2.4;  // 约 +75 度

  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // 按键状态
  private keys: Map<string, boolean> = new Map();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.camera.rotation.order = 'YXZ';

    this.initListeners();
  }

  private initListeners(): void {
    // 鼠标锁定状态变更
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this));

    // 鼠标移动
    document.addEventListener('mousemove', this.onMouseMove.bind(this));

    // 鼠标按键
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    // 键盘按键
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  public requestLock(): void {
    this.domElement.requestPointerLock();
  }

  public exitLock(): void {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange(): void {
    this.isLocked = document.pointerLockElement === this.domElement;
    EventBus.getInstance().emit(GameEvents.POINTER_LOCK_CHANGE, { isLocked: this.isLocked });
  }

  private onPointerLockError(error: Event): void {
    console.warn('[InputManager] Pointer lock error:', error);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    // 水平旋转（Yaw）
    this.euler.y -= movementX * this.sensitivity;

    // 垂直俯仰（Pitch）
    this.euler.x -= movementY * this.sensitivity;
    this.euler.x = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // 鼠标左键
      this.isMouseDown = true;
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.isMouseDown = false;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.set(event.code, true);

    if (event.code === 'KeyR') {
      this.reloadPressed = true;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.set(event.code, false);
  }

  public isKeyPressed(code: string): boolean {
    return !!this.keys.get(code);
  }

  public consumeReload(): boolean {
    if (this.reloadPressed) {
      this.reloadPressed = false;
      return true;
    }
    return false;
  }

  public reset(): void {
    this.isMouseDown = false;
    this.reloadPressed = false;
    this.keys.clear();
  }
}
