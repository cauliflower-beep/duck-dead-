export interface ComboThreshold {
  minCombo: number;
  multiplier: number;
  title: string;
}

export interface GameConfig {
  roundDuration: number;     // 单局时长（秒）
  comboDecayTime: number;    // 连击保持时间（秒）
  comboThresholds: ComboThreshold[];
  waveSettings: {
    baseWaveDuration: number;
    initialDuckCount: number;
    duckCountIncrement: number;
    bossWaveInterval: number; // 每几波出一次 Boss
  };
  arenaBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  roundDuration: 60,
  comboDecayTime: 2.8,
  comboThresholds: [
    { minCombo: 3, multiplier: 1.5, title: 'QUACK-TASTIC!' },
    { minCombo: 6, multiplier: 2.0, title: 'POPCORN FRENZY!' },
    { minCombo: 10, multiplier: 3.0, title: 'DUCK-O-RAMA!' },
    { minCombo: 15, multiplier: 4.0, title: 'HOLY DUCK GOD!!' }
  ],
  waveSettings: {
    baseWaveDuration: 12,
    initialDuckCount: 4,
    duckCountIncrement: 2,
    bossWaveInterval: 3
  },
  arenaBounds: {
    minX: -26,
    maxX: 26,
    minY: 1.5,
    maxY: 16,
    minZ: -32,
    maxZ: -5
  }
};
