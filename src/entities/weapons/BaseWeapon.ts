import * as THREE from 'three';
import { WeaponConfig } from '../../config/weapons.config';

export abstract class BaseWeapon {
  public mesh: THREE.Group;
  public config: WeaponConfig;
  public currentAmmo: number;
  public isReloading: boolean = false;

  protected fireTimer: number = 0;
  protected reloadTimer: number = 0;

  constructor(config: WeaponConfig) {
    this.config = config;
    this.currentAmmo = config.magazineSize;
    this.mesh = new THREE.Group();
    this.mesh.name = config.name;
  }

  public abstract update(deltaTime: number): void;
  public abstract tryShoot(origin: THREE.Vector3, direction: THREE.Vector3): boolean;
  public abstract startReload(): boolean;
  public abstract reset(): void;
}
