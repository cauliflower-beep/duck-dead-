export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number;       // 发射间隔（秒）
  magazineSize: number;   // 弹匣容量
  reloadTime: number;     // 换弹时间（秒）
  spread: number;         // 扩散角（弧度）
  recoilKick: number;     // 后坐力向后位移
  recoilRotKick: number;  // 后坐力上抬角度（弧度）
  springStiffness: number;// 弹簧回弹劲度系数
  springDamping: number;  // 阻尼系数
}

export const WEAPONS_CONFIG: { POPCORN_GUN: WeaponConfig } = {
  POPCORN_GUN: {
    name: '爆米花强力发射枪',
    damage: 1,
    fireRate: 0.18,          // 连发间隔
    magazineSize: 12,        // 12发弹药
    reloadTime: 1.2,         // 1.2秒换弹
    spread: 0.006,           // 精准小散射
    recoilKick: 0.08,        // 枪体后坐位移
    recoilRotKick: 0.12,     // 枪头上抬
    springStiffness: 180,    // 快速清脆回弹
    springDamping: 14        // 快速稳定无拖泥带水
  }
};
