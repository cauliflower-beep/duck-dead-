# 🦆 尖叫鸭大乱斗 (Quack Attack: Popcorn Blitz)

> 基于 **Vite + TypeScript + Three.js** 开发的轻量级、工程化第一人称 3D 搞怪射击游戏。🍿💥

![Three.js](https://img.shields.io/badge/Three.js-r162-black?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🎮 游戏简介

在阳光明媚的卡通农场里，成群结队的搞怪橡皮鸭正在肆虐！手持特制**红白条纹爆米花发射枪**，锁定准星、扣动扳机，用滚烫清脆的爆米花将它们统统击飞！

游戏采用 **纯原生几何体程序化建模（Procedural Low-Poly）** 与 **Web Audio API 纯合成音效**，**零外部重型模型与音频资产依赖**，实现网页端秒开与 60FPS+ 丝滑射击体验。

---

## ✨ 核心特色

### 1. 🍿 第一人称爆米花枪手感（Juice & Feel）
- **弹簧阻尼后坐力物理（Spring-Damper Physics）**：开火时枪体强烈后退与上抬，随后平滑弹性回正。
- **开火视效**：枪口火光闪烁、爆米花粒子迸发，伴随真实的屏幕微震（Screen Shake）。
- **待机与换弹动画**：待机呼吸晃动、下倾装填爆米花机械咔嗒音效。

### 2. 🦆 丰富多样的搞怪鸭子家族
- **呆萌黄鸭（Normal Duck）**：头戴小红帽的经典大眼黄鸭，匀速巡航与随机漫步。
- **竹蜻蜓极速鸭（Copter Duck）**：头顶竹蜻蜓超高速旋转，进行 S 型正弦波空中大机动。
- **墨镜巨鸭霸主（Chonky Boss）**：2.2倍超大体型，佩戴酷炫黑超墨镜与金冠，拥有超厚多段血量条与空中盘旋俯冲航迹。

### 3. 💥 极致打击反馈
- **果冻受击弹性形变（Squash & Stretch）**：命中时鸭身瞬间压扁拉伸并 Q 弹回弹。
- **受击闪白与准星标记**：0.09s 材质纯白频闪，准星正中瞬间出现红色 X 形 Hitmarker。
- **滑稽升天自爆**：血量归零时鸭子螺旋升天，向四周炸出大量羽毛、爆米花与彩色庆典彩纸碎片。

### 4. 🔊 纯 Web Audio 拟真合成音效
无需加载外部音频文件，实时振荡器合成：
- **Pop 啵啵发射声**：快速调频下降的三角波 + 爆裂白噪声。
- **Quack 滑稽鸭叫**：双共鸣滤波调制的锯齿波，音调随机浮动。
- **Reload 换弹声**：机械卡扣三段咔嗒声。
- **Combo 奖励乐句**：基于五声音阶上行琶音，连击越高声调越亢奋。

### 5. 🎯 街机连击与评分系统
- 连续命中触发 **2x ~ 4x 连击倍率** 与夸张漫画标语（*“QUACK-TASTIC!”*, *“POPCORN FRENZY!”*, *“HOLY DUCK GOD!!”*）。
- 结算面板精确统计最终得分、击飞鸭数、最高连击与命中率，并生成段位称号（*“👑 SUPREME DUCK OVERLORD”*）。
- 本地 `localStorage` 自动记录并保存历史最高分。

---

## 🕹️ 操作说明

| 按键 / 操作 | 动作 |
| :--- | :--- |
| **鼠标移动** | 控制第一人称视角瞄准 |
| **鼠标左键** | 发射爆米花（连发） |
| **R 键** | 换弹匣（容量 12 发） |
| **ESC / P 键** | 暂停 / 继续游戏 |
| **点击屏幕** | 重新捕获鼠标锁定（PointerLock） |

---

## 🏗️ 项目架构与目录组织

遵循数据驱动（Data-Driven）、状态机（State Machine）、对象池（Object Pool）与事件驱动（Event-Driven）设计模式：

```text
src/
├── main.ts                     # 游戏总启动入口与系统装配
├── style.css                   # 卡漫街机美学样式（准星、连击弹窗、HUD）
├── audio/
│   └── SoundManager.ts         # 纯 Web Audio 合成音效引擎
├── config/                     # 数值与关卡平衡性配置
│   ├── ducks.config.ts         # 鸭子移速、血量、体型、颜色与航迹
│   ├── weapons.config.ts       # 武器射速、弹容、弹簧后坐力、换弹时长
│   └── game.config.ts          # 关卡时长、波次规则、连击倍率
├── core/                       # 核心引擎与底层基础
│   ├── Engine.ts               # Three.js 场景/相机/渲染管线/阴影/雾效
│   ├── EventBus.ts             # 强类型发布订阅事件总线
│   ├── GameLoop.ts             # 步长安全主渲染循环
│   ├── InputManager.ts         # PointerLock 视角平滑与按键抽象
│   ├── ObjectPool.ts           # 通用高性能对象池（零 GC 掉帧）
│   └── StateMachine.ts         # 状态机（StartMenu / Playing / Paused / GameOver）
├── entities/                   # 实体与程序化建模
│   ├── Environment.ts          # 卡通草地、木栅栏、荷叶水塘、树木与漂浮白云
│   ├── ducks/
│   │   ├── BaseDuck.ts         # 鸭子抽象基类（几何体拼装、果冻形变、闪白）
│   │   ├── NormalDuck.ts       # 呆萌黄鸭
│   │   ├── CopterDuck.ts       # 竹蜻蜓极速鸭
│   │   └── ChonkyBoss.ts       # 墨镜巨鸭霸主
│   └── weapons/
│       ├── BaseWeapon.ts       # 武器基类
│       └── PopcornGun.ts       # 第一人称爆米花枪与弹簧后坐力
├── systems/                    # 玩法业务子系统
│   ├── CombatSystem.ts         # 射线命中判定（Raycaster）与伤害分发
│   ├── DuckSpawner.ts          # 动态波次调度器与对象池复用管理
│   ├── ParticleSystem.ts       # 爆米花/羽毛/彩色碎纸粒子池
│   └── ScoreManager.ts         # 积分计算、连击衰减与战绩评定
└── ui/                         # 2D 界面交互
    ├── HUD.ts                  # 准星、Hitmarker、弹药卡槽、Combo 漫画弹窗
    └── MenuOverlay.ts          # 开始菜单、暂停菜单、GameOver 战绩结算
```

---

## 🚀 快速开始

### 运行环境
- Node.js >= 18.0.0
- npm / yarn / pnpm

### 安装与启动

1. **克隆仓库**
   ```bash
   git clone git@github.com:cauliflower-beep/duck-dead-.git
   cd duck-dead-
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   启动后浏览器访问 `http://localhost:3000` 即可畅玩！

4. **生产打包**
   ```bash
   npm run build
   ```

---

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源。
