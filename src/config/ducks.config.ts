export enum DuckType {
  NORMAL = 'NORMAL',
  COPTER = 'COPTER',
  CHONKY_BOSS = 'CHONKY_BOSS'
}

export interface DuckConfig {
  type: DuckType;
  name: string;
  maxHp: number;
  baseSpeed: number;
  scoreValue: number;
  scale: number;
  primaryColor: number;
  billColor: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  flightPattern: 'linear' | 'sine_wave' | 'spiral' | 'patrol';
}

export const DUCKS_CONFIG: Record<DuckType, DuckConfig> = {
  [DuckType.NORMAL]: {
    type: DuckType.NORMAL,
    name: '呆萌黄鸭',
    maxHp: 1,
    baseSpeed: 5.5,
    scoreValue: 100,
    scale: 1.0,
    primaryColor: 0xffd32a, // 明黄
    billColor: 0xff5e57,    // 橙红
    wobbleSpeed: 6.0,
    wobbleAmount: 0.12,
    flightPattern: 'linear'
  },
  [DuckType.COPTER]: {
    type: DuckType.COPTER,
    name: '竹蜻蜓极速鸭',
    maxHp: 1,
    baseSpeed: 9.5,
    scoreValue: 250,
    scale: 0.85,
    primaryColor: 0x0be881, // 亮薄荷绿
    billColor: 0xffa801,
    wobbleSpeed: 12.0,
    wobbleAmount: 0.25,
    flightPattern: 'sine_wave'
  },
  [DuckType.CHONKY_BOSS]: {
    type: DuckType.CHONKY_BOSS,
    name: '墨镜巨鸭霸主',
    maxHp: 6,
    baseSpeed: 3.5,
    scoreValue: 1000,
    scale: 2.2,
    primaryColor: 0xffa801, // 橘金
    billColor: 0xff3f34,
    wobbleSpeed: 4.0,
    wobbleAmount: 0.18,
    flightPattern: 'spiral'
  }
};
