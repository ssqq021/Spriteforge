# SpriteForge AI（灵画 AI）

> 面向 Unity 开发者的一站式 AI 角色美术生产管线。

从一张角色图、视频或提示词开始，完成动作生成、序列帧处理、透明背景修复、图集整理，并导出可直接进入 Unity 项目的角色资源包。

## 当前阶段

项目处于 **MVP 产品设计与工程初始化阶段**。

现有基础来自 `lunghwa-media-tools`：

- 视频抽帧
- SpriteSheet 合成与拆分
- GIF/WebP 预览
- 去黑底和透明通道处理
- 批量帧筛选与导出

## 核心工作流

```text
导入角色
  ↓
生成或导入动作
  ↓
清理透明背景
  ↓
整理 SpriteSheet
  ↓
配置 Pivot / FPS / Loop
  ↓
导出 Unity 资源包
```

## MVP 核心能力

1. 项目与角色管理
2. 图片、GIF、视频和序列帧导入
3. 动作帧选择、排序、裁剪和预览
4. 去背景、去黑边、Alpha 修复
5. SpriteSheet、GIF、WebP、JSON 导出
6. Unity 导入配置生成
7. Unity Editor 插件完成 Sprite 切片、AnimationClip、Animator 和 Prefab 创建

## 暂不纳入 MVP

- 从单张图片直接生成高质量多动作动画
- 四方向自动补全
- LoRA 训练
- 素材市场
- 团队协作
- 支付和积分系统

这些能力进入 V2/V3，避免第一版范围失控。

## 仓库结构

```text
spriteforge/
├── frontend/       # Web 工作台
├── backend/        # 项目、任务和文件服务
├── ai/             # 图像处理与 AI 任务
├── unity-plugin/   # Unity Editor 插件
├── shared/         # 共享类型和协议
├── design/         # 原型与设计资源
└── docs/           # 产品、技术和商业文档
```

## 文档导航

- [项目简介](docs/00-项目简介.md)
- [产品路线图](docs/01-产品路线图.md)
- [产品需求 PRD](docs/02-产品需求PRD.md)
- [信息架构](docs/03-信息架构.md)
- [UI 设计规范](docs/04-UI设计规范.md)
- [人物工作区](docs/05-人物工作区.md)
- [序列帧编辑器](docs/06-序列帧编辑器.md)
- [AI 修图模块](docs/07-AI修图.md)
- [Unity 导出](docs/08-Unity导出.md)
- [技术架构](docs/09-技术架构.md)
- [数据模型](docs/10-数据模型.md)
- [接口设计](docs/11-接口设计.md)
- [开发计划](docs/12-开发计划.md)
- [商业计划](docs/13-商业计划.md)
- [风险与验收](docs/14-风险与验收.md)

## 产品原则

- **先可用，再智能**
- **项目工作流优先于工具堆叠**
- **Unity 可落地优先于单纯生成图片**
- **所有 AI 结果都必须允许人工修正**
- **原始素材永不被覆盖**

## License

项目暂不附加开源许可证。商业化方向确认前，默认保留全部权利。
