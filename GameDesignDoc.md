# Game Design
---

## 1. 技术栈与架构规范
- **开发构建**：Vite + TypeScript
- **渲染引擎**：Three.js + PointerLockControls
- **设计模式要求**：
  1. **状态机（State Machine）**：管理游戏状态（Loading, StartMenu, Playing, Paused, GameOver）。
  2. **事件总线（Event Emitter）**：解耦 3D 游戏逻辑与 2D UI 界面（如得分、击中、弹药变化、连击触发）。
  3. **对象池（Object Pool）**：用于子弹、粒子特效、鸭子生成，杜绝频繁 GC 导致的掉帧卡顿。
  4. **配置驱动（Data-Driven Config）**：鸭子属性、武器参数、波次难度均抽象在 `config/` 中，便于策划调参。

---

## 2. 建议工程目录结构
请严格按照以下模块化目录组织代码并逐一实现：

```text
duck-hunter-3d/
├── index.html                  # 挂载入口与 UI 容器
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── config/                 # 游戏数值与平衡性配置
    │   ├── ducks.config.ts     # 鸭子类型（移速、血量、体型、得分、行为模式）
    │   └── weapons.config.ts   # 武器属性（射速、弹容量、后坐力、换弹时长）
    ├── core/                   # 核心系统
    │   ├── Engine.ts           # Three.js 渲染器、相机、场景初始化与 Resize
    │   ├── GameLoop.ts         # 固定步长/可变步长的游戏主循环
    │   ├── InputManager.ts     # 键盘/鼠标/PointerLock 输入监听与状态抽象
    │   └── EventBus.ts         # 全局发布订阅事件中心
    ├── entities/               # 游戏实体
    │   ├── ducks/
    │   │   ├── BaseDuck.ts     # 鸭子抽象基类（生命周期、移动路径算法、受击变形）
    │   │   ├── NormalDuck.ts   # 呆萌黄鸭
    │   │   ├── CopterDuck.ts   # 螺旋桨快速鸭（S型/螺旋飞行轨迹）
    │   │   └── ChonkyBoss.ts   # 墨镜巨型鸭（多阶段/被击中果冻Q弹回弹）
    │   ├── weapons/
    │   │   └── PopcornGun.ts   # 搞怪爆米花枪（第一人称持枪视角、射击后坐力骨骼动画）
    │   └── Environment.ts      # 低模卡通场景（草地、围栏、彩云、水塘、动态光影）
    ├── systems/                # 玩法子系统
    │   ├── DuckSpawner.ts      # 鸭子生成调度器与波次控制
    │   ├── CombatSystem.ts     # 射线检测（Raycaster）与受击判定
    │   ├── ParticleSystem.ts   # 爆米花/羽毛/彩色碎纸粒子系统（基于对象池）
    │   └── ScoreManager.ts     # 得分、连击（Combo）、倒计时逻辑
    ├── audio/                  # 音效系统
    │   └── SoundManager.ts     # 纯 Web Audio API 合成音效（橡皮鸭嘎嘎叫、啵啵射击声、爆米花破裂声）
    ├── ui/                     # 界面层（纯 DOM/CSS 悬浮）
    │   ├── HUD.ts              # 准星、弹药数量、分数跳字、Combo 夸张弹窗
    │   └── MenuOverlay.ts      # 开始页面、暂停菜单、结算面板
    └── main.ts                 # 游戏启动总入口
```

## 3. 核心美术风格与实体构建（Procedural Low-Poly）

无需依赖外部 .gltf 资源，使用 Three.js 原生几何体组合出高辨识度的搞怪角色（后续可无缝替换为模型加载器）：

1. **第一人称武器（爆米花枪）**：挂载在相机前方，用圆柱体、球体组合成可爱的红白条纹爆米花桶造型，射击时带有强烈的弹簧回缩动画。
2. **鸭子模型**：
   - 采用多色低多边形材质（MeshStandardMaterial + 鲜亮扁平色彩）。
   - 带有简单的挂件（竹蜻蜓、墨镜、小红帽）。
   - **受击反馈（Juice）**：被击中时产生 scale 挤压形变动画（Squash & Stretch）和短暂发白材质切换。
3. **环境**：明亮的糖果色草地，点缀简单的方块花朵、卡通树木、低模小池塘和缓缓飘动的白云。

------



## 4. 核心手感与玩法机制细节

1. **射击手感**：
   - 鼠标锁定后第一人称平滑准星跟随。
   - 射击时光影微闪，屏幕轻微梯形抖动（Screenshake）。
   - 枪口喷出 3~5 颗爆米花小粒子。
2. **打击与连击体验**：
   - 击中鸭子爆出 Feather/Popcorn 粒子。
   - 鸭子血量归零时触发搞笑的“转圈螺旋飞升”或“缩放自爆”退场动画。
   - 连续命中 3 只以上在屏幕中央触发动态夸张漫画风格文字（如 *"QUACK-TASTIC!"*, *"HOLY DUCK!"*）。
3. **音效体验（SoundManager）**：
   - 使用 Web Audio 振荡器（OscillatorNode）合成出滑稽的“啾——嘎！”声音与“POP”爆米花发射声，换弹时有欢快的机械“咔嚓”声。

------



## 5. 输出要求

1. 请先提供 package.json（包含 Three.js、TypeScript、Vite 依赖配置）及环境配置。
2. 按照模块划分，输出完整、严谨、带类型注解的 TypeScript 代码。
3. 确保代码遵循面向对象与开闭原则，核心参数（移速、波次间隔、伤害）均暴露在配置文件中方便后续调优。