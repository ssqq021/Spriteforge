# Sprint 4R-A：AI Studio 角色生成工作台

## 目标

打通 SpriteForge 的第一段核心链路：

Prompt / 参考图
→ 角色生成任务
→ 候选结果
→ 选择角色基准图
→ 进入动作生成

## 已实现

- 新增 AI Studio 主导航
- 创建角色 Tab
- 生成历史 Tab
- Prompt
- Negative Prompt
- 参考图上传
- 风格选择
- 正面 / 背面 / 侧面方向
- 256 / 512 / 1024 分辨率
- Seed
- 一致性强度
- GenerationTask 数据模型
- queued / running / completed / failed 状态
- Mock Provider 生成流程
- 任务进度动画
- 生成 4 个角色候选
- 候选结果保存在 IndexedDB
- 选择角色基准图
- 删除生成任务和相关素材
- “进入动作生成”入口预留

## 说明

本 Sprint 不调用真实 AI。

Mock Provider 用本地 Canvas 生成 4 张占位角色图，目的是验证：

- 页面结构
- 任务状态
- 数据持久化
- 候选选择
- 后续动作生成入口

真实 Character Provider 会在产品流程确认后接入。

## 验收

1. 进入 AI Studio。
2. 填写角色名称、Prompt 和风格。
3. 可选上传参考图。
4. 点击“生成 4 个角色候选”。
5. 自动进入生成历史。
6. 检查进度从 running 变为 completed。
7. 确认出现 4 个候选结果。
8. 选择任意一个候选。
9. 确认显示“角色基准图”。
10. 点击“进入动作生成”。
11. 刷新网页，确认生成历史和候选结果仍然存在。
12. 删除任务，确认任务消失。
13. 执行 `npm run build`。

## 下一步 Sprint 4R-B

角色基准图
→ Image-to-Video 动作生成工作台
→ 视频预览
→ Use This Video
→ 自动进入现有视频抽帧和时间轴
